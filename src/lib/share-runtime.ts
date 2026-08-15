import {
  getOrCreateShareConfig,
  loadShareConfig,
  saveShareConfig,
  type ShareMethod,
} from "@/lib/share-config";
import { localLanIPv4, mapPort, unmapPort } from "@/lib/upnp";

const LEASE_SECONDS = 3600;
const RENEW_MS = 30 * 60 * 1000;

let renewTimer: ReturnType<typeof setInterval> | null = null;

function stopRenewal() {
  if (renewTimer) {
    clearInterval(renewTimer);
    renewTimer = null;
  }
}

function isPrivateIPv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
  return false;
}

export function formatRemoteUrl(host: string, port: number) {
  if (port === 80) return `http://${host}`;
  return `http://${host}:${port}`;
}

async function lookupPublicIp(): Promise<string | null> {
  try {
    const response = await fetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { ip?: string };
    return data.ip?.trim() || null;
  } catch {
    return null;
  }
}

async function applyUpnpMapping() {
  const config = getOrCreateShareConfig();
  const mapped = await mapPort({
    publicPort: config.publicPort,
    privatePort: config.privatePort,
    leaseSeconds: LEASE_SECONDS,
  });
  config.enabled = true;
  config.method = "upnp";
  config.controlUrl = mapped.controlUrl;
  config.serviceType = mapped.serviceType;
  config.internalHost = mapped.internalHost;
  config.externalIp = mapped.externalIp;
  config.lastError = null;
  saveShareConfig(config);
  return config;
}

async function applyPortForward() {
  const config = getOrCreateShareConfig();
  const lan = localLanIPv4();
  if (!lan) {
    throw new Error(
      "Could not find a LAN IPv4 address. Connect to Wi-Fi or Ethernet and try again.",
    );
  }
  const publicIp = (await lookupPublicIp()) ?? config.externalIp ?? null;
  config.enabled = true;
  config.method = "port-forward";
  config.internalHost = lan;
  config.externalIp = publicIp ?? undefined;
  config.controlUrl = undefined;
  config.serviceType = undefined;
  config.lastError = publicIp
    ? null
    : "Could not look up your public IP. The LAN details below are still correct.";
  saveShareConfig(config);
  return config;
}

export async function enableShare(options?: {
  publicPort?: number;
  method?: ShareMethod;
}) {
  const config = getOrCreateShareConfig();
  const method = options?.method ?? config.method ?? "port-forward";
  if (options?.publicPort) {
    if (options.publicPort < 1 || options.publicPort > 65535) {
      throw new Error("Public port must be between 1 and 65535");
    }
    config.publicPort = options.publicPort;
  }
  config.method = method;
  saveShareConfig(config);

  const next =
    method === "upnp" ? await applyUpnpMapping() : await applyPortForward();

  stopRenewal();
  if (method === "upnp") {
    renewTimer = setInterval(() => {
      applyUpnpMapping().catch((error) => {
        const current = getOrCreateShareConfig();
        current.lastError =
          error instanceof Error ? error.message : String(error);
        saveShareConfig(current);
        console.error("UPnP renewal failed:", current.lastError);
      });
    }, RENEW_MS);
    renewTimer.unref?.();
  }
  return next;
}

export async function disableShare() {
  stopRenewal();
  const config = getOrCreateShareConfig();
  if (config.method === "upnp" && config.controlUrl && config.serviceType) {
    try {
      await unmapPort({
        publicPort: config.publicPort,
        controlUrl: config.controlUrl,
        serviceType: config.serviceType,
      });
    } catch (error) {
      console.error("UPnP unmap failed:", error);
    }
  }
  config.enabled = false;
  config.lastError = null;
  saveShareConfig(config);
  return config;
}

export async function bootShare() {
  const existing = loadShareConfig();
  if (!existing?.enabled) return;
  try {
    const config = await enableShare({ method: existing.method ?? "upnp" });
    if (config.externalIp) {
      console.log(
        `Remote access on ${formatRemoteUrl(config.externalIp, config.publicPort)}`,
      );
    }
  } catch (error) {
    const current = getOrCreateShareConfig();
    current.lastError = error instanceof Error ? error.message : String(error);
    saveShareConfig(current);
    console.error("Could not restore remote access:", current.lastError);
  }
}

export async function shareStatus() {
  const config = getOrCreateShareConfig();
  const lan = config.internalHost || localLanIPv4();
  if (lan && lan !== config.internalHost) {
    config.internalHost = lan;
    saveShareConfig(config);
  }
  if (!config.externalIp) {
    const ip = await lookupPublicIp();
    if (ip) {
      config.externalIp = ip;
      saveShareConfig(config);
    }
  }

  const host = config.externalIp;
  const remoteUrl = host
    ? formatRemoteUrl(host, config.publicPort)
    : null;
  const lanUrl = lan ? `http://${lan}:${config.privatePort}` : null;
  const shortenerFriendly = config.publicPort === 80;

  return {
    enabled: config.enabled,
    method: config.method ?? "port-forward",
    publicPort: config.publicPort,
    privatePort: config.privatePort,
    password: config.password,
    remoteUrl,
    lanUrl,
    internalHost: lan,
    externalIp: config.externalIp ?? null,
    lastError: config.lastError ?? null,
    cgnat: Boolean(config.externalIp) && isPrivateIPv4(config.externalIp!),
    shortenerFriendly,
  };
}
