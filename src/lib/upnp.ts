import dgram from "node:dgram";
import os from "node:os";
import { URL } from "node:url";

const SSDP_ADDRESS = "239.255.255.250";
const SSDP_PORT = 1900;

const SERVICE_TYPES = [
  "urn:schemas-upnp-org:service:WANIPConnection:2",
  "urn:schemas-upnp-org:service:WANIPConnection:1",
  "urn:schemas-upnp-org:service:WANPPPConnection:1",
];

export type UpnpMapping = {
  publicPort: number;
  privatePort: number;
  internalHost: string;
  serviceType: string;
  controlUrl: string;
};

function isPrivateIPv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  return false;
}

export function isLoopback(ip: string) {
  return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
}

export function isPrivateOrLoopback(ip: string) {
  const v4 = ip.replace("::ffff:", "");
  return isLoopback(v4) || isPrivateIPv4(v4);
}

export function localLanIPv4(): string | null {
  const nets = os.networkInterfaces();
  const candidates: string[] = [];
  for (const [name, addrs] of Object.entries(nets)) {
    if (/utun|awdl|llw|lo|bridge|vmnet|veth/i.test(name)) continue;
    for (const addr of addrs ?? []) {
      const family = addr.family === "IPv4";
      if (!family || addr.internal) continue;
      if (addr.address.startsWith("169.254.")) continue;
      if (isPrivateIPv4(addr.address)) candidates.push(addr.address);
    }
  }
  return candidates[0] ?? null;
}

async function ssdpSearch(st: string, timeoutMs = 2800): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
    const locations = new Set<string>();
    const body = [
      "M-SEARCH * HTTP/1.1",
      `HOST: ${SSDP_ADDRESS}:${SSDP_PORT}`,
      'MAN: "ssdp:discover"',
      "MX: 2",
      `ST: ${st}`,
      "",
      "",
    ].join("\r\n");

    const timer = setTimeout(() => {
      try {
        socket.close();
      } catch {
        /* already closed */
      }
      resolve([...locations]);
    }, timeoutMs);

    socket.on("error", (error) => {
      clearTimeout(timer);
      try {
        socket.close();
      } catch {
        /* ignore */
      }
      reject(error);
    });

    socket.on("message", (buf) => {
      const match = buf.toString().match(/LOCATION:\s*(\S+)/i);
      if (match) locations.add(match[1].trim());
    });

    socket.bind(() => {
      try {
        socket.addMembership(SSDP_ADDRESS);
      } catch {
        /* some interfaces reject membership; broadcast still works */
      }
      socket.send(body, SSDP_PORT, SSDP_ADDRESS);
    });
  });
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    headers: { "User-Agent": "JobTracker/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Router responded ${response.status} for ${url}`);
  }
  return response.text();
}

function xmlText(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function findService(xml: string, serviceType: string) {
  const blocks = xml.split(/<service>/i).slice(1);
  for (const block of blocks) {
    const type = xmlText(block, "serviceType");
    if (type.toLowerCase() === serviceType.toLowerCase()) {
      return xmlText(block, "controlURL");
    }
  }
  return "";
}

function resolveUrl(base: string, maybeRelative: string) {
  return new URL(maybeRelative, base).toString();
}

async function soap(
  controlUrl: string,
  serviceType: string,
  action: string,
  args: Record<string, string>,
) {
  const inner = Object.entries(args)
    .map(([key, value]) => `<${key}>${value}</${key}>`)
    .join("");
  const envelope = `<?xml version="1.0"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:${action} xmlns:u="${serviceType}">${inner}</u:${action}>
  </s:Body>
</s:Envelope>`;

  const response = await fetch(controlUrl, {
    method: "POST",
    signal: AbortSignal.timeout(7000),
    headers: {
      "Content-Type": 'text/xml; charset="utf-8"',
      SOAPAction: `"${serviceType}#${action}"`,
      "User-Agent": "JobTracker/1.0",
    },
    body: envelope,
  });
  const text = await response.text();
  if (!response.ok || /<fault/i.test(text) || /UPnPError/i.test(text)) {
    const code = xmlText(text, "errorCode") || String(response.status);
    const desc = xmlText(text, "errorDescription") || "UPnP request failed";
    throw new Error(`${action} failed (${code}): ${desc}`);
  }
  return text;
}

async function discoverGateway(): Promise<{
  serviceType: string;
  controlUrl: string;
} | null> {
  for (const serviceType of SERVICE_TYPES) {
    let locations: string[] = [];
    try {
      locations = await ssdpSearch(serviceType);
    } catch {
      continue;
    }
    for (const location of locations) {
      try {
        const xml = await fetchText(location);
        const control = findService(xml, serviceType);
        if (!control) continue;
        return {
          serviceType,
          controlUrl: resolveUrl(location, control),
        };
      } catch {
        continue;
      }
    }
  }
  return null;
}

export async function getExternalIp(
  serviceType: string,
  controlUrl: string,
): Promise<string> {
  const xml = await soap(controlUrl, serviceType, "GetExternalIPAddress", {});
  return xmlText(xml, "NewExternalIPAddress");
}

export async function mapPort(options: {
  publicPort: number;
  privatePort: number;
  leaseSeconds?: number;
}): Promise<UpnpMapping & { externalIp: string }> {
  const internalHost = localLanIPv4();
  if (!internalHost) {
    throw new Error(
      "Could not find a LAN IPv4 address. Connect to Wi-Fi or Ethernet and try again.",
    );
  }
  const gateway = await discoverGateway();
  if (!gateway) {
    throw new Error(
      "No UPnP router found. Enable UPnP / NAT-PMP on the router, or your ISP may be using CGNAT.",
    );
  }

  const lease = String(options.leaseSeconds ?? 3600);
  await soap(gateway.controlUrl, gateway.serviceType, "AddPortMapping", {
    NewRemoteHost: "",
    NewExternalPort: String(options.publicPort),
    NewProtocol: "TCP",
    NewInternalPort: String(options.privatePort),
    NewInternalClient: internalHost,
    NewEnabled: "1",
    NewPortMappingDescription: "Job Tracker",
    NewLeaseDuration: lease,
  });

  const externalIp = await getExternalIp(gateway.serviceType, gateway.controlUrl);
  return {
    publicPort: options.publicPort,
    privatePort: options.privatePort,
    internalHost,
    serviceType: gateway.serviceType,
    controlUrl: gateway.controlUrl,
    externalIp,
  };
}

export async function unmapPort(mapping: {
  publicPort: number;
  serviceType: string;
  controlUrl: string;
}) {
  await soap(mapping.controlUrl, mapping.serviceType, "DeletePortMapping", {
    NewRemoteHost: "",
    NewExternalPort: String(mapping.publicPort),
    NewProtocol: "TCP",
  });
}
