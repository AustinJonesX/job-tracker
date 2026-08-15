"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ShareMethod } from "@/lib/share-config";

export type ShareStatus = {
  enabled: boolean;
  method: ShareMethod;
  publicPort: number;
  privatePort: number;
  password: string;
  remoteUrl: string | null;
  lanUrl: string | null;
  internalHost: string | null;
  externalIp: string | null;
  lastError: string | null;
  cgnat: boolean;
  shortenerFriendly: boolean;
};

export function SharePanel({ initialStatus }: { initialStatus: ShareStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState<ShareStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState(initialStatus.password);
  const [port, setPort] = useState(String(initialStatus.publicPort));
  const [method, setMethod] = useState<ShareMethod>(
    initialStatus.method || "port-forward",
  );
  const [copied, setCopied] = useState<string | null>(null);

  async function enable() {
    setPending(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("action", "enable");
      form.set("publicPort", port);
      form.set("password", password);
      form.set("method", method);
      const response = await fetch("/api/share", { method: "POST", body: form });
      const data = (await response.json()) as ShareStatus & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not turn sharing on");
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not turn sharing on");
    } finally {
      setPending(false);
    }
  }

  async function disable() {
    setPending(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("action", "disable");
      const response = await fetch("/api/share", { method: "POST", body: form });
      const data = (await response.json()) as ShareStatus & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not stop sharing");
      setStatus(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not stop sharing");
    } finally {
      setPending(false);
    }
  }

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      window.prompt("Copy this", value);
    }
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1500);
  }

  const lan = status.internalHost ?? "this-computer";
  const appPort = status.privatePort;
  const wanPort = Number(port) || status.publicPort;
  function httpUrl(host: string, portNum: number) {
    return portNum === 80 ? `http://${host}` : `http://${host}:${portNum}`;
  }
  const remoteUrl = status.externalIp
    ? httpUrl(status.externalIp, wanPort)
    : `http://YOUR.PUBLIC.IP${wanPort === 80 ? "" : `:${wanPort}`}`;
  const altUrl =
    wanPort !== appPort
      ? status.externalIp
        ? httpUrl(status.externalIp, appPort)
        : `http://YOUR.PUBLIC.IP:${appPort}`
      : null;
  const invite = `Job Tracker\n${remoteUrl}${altUrl ? `\n${altUrl}` : ""}\nPassword: ${status.password}`;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">Connection</h2>
        <p className="mt-1 text-sm text-muted">
          The computer running Job Tracker must stay on. Visitors reach it
          through your public IP, not a hosted site.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={status.enabled}
            onClick={() => setMethod("port-forward")}
            className={`rounded-xl px-3 py-2.5 text-sm font-medium ${
              method === "port-forward"
                ? "bg-accent text-accent-fg"
                : "bg-subtle text-foreground hover:bg-border"
            }`}
          >
            Port forward
          </button>
          <button
            type="button"
            disabled={status.enabled}
            onClick={() => setMethod("upnp")}
            className={`rounded-xl px-3 py-2.5 text-sm font-medium ${
              method === "upnp"
                ? "bg-accent text-accent-fg"
                : "bg-subtle text-foreground hover:bg-border"
            }`}
          >
            UPnP
          </button>
        </div>
        {method === "port-forward" ? (
          <p className="mt-4 text-sm leading-6 text-muted">
            Add this TCP rule on the router, then turn sharing on:
            <span className="mt-2 block break-all rounded-lg bg-background px-3 py-2 font-mono text-foreground">
              WAN {wanPort} → {lan}:{appPort}
            </span>
          </p>
        ) : (
          <p className="mt-4 text-sm leading-6 text-muted">
            UPnP asks the router to create{" "}
            <span className="font-mono text-foreground">
              WAN {wanPort} → {lan}:{appPort}
            </span>{" "}
            automatically. Use it only if the router supports UPnP.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">Access</h2>
        <p className="mt-1 text-sm text-muted">
          A password is required even if someone finds the link. Default public
          port is {appPort}; use 80 for a URL without a port number.
        </p>
        <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="w-full min-w-0 text-sm font-medium text-foreground sm:max-w-xs">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 block w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none ring-accent focus:ring-2"
            />
          </label>
          <label className="w-full min-w-0 text-sm font-medium text-foreground sm:w-auto">
            Public port
            <input
              type="number"
              min={1}
              max={65535}
              value={port}
              onChange={(event) => setPort(event.target.value)}
              className="mt-1 block w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2 sm:w-28"
            />
          </label>
          {status.enabled ? (
            <button
              type="button"
              onClick={disable}
              disabled={pending}
              className="w-full rounded-lg border border-danger px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger-subtle disabled:opacity-60 sm:w-auto"
            >
              {pending ? "Stopping…" : "Stop sharing"}
            </button>
          ) : (
            <button
              type="button"
              onClick={enable}
              disabled={pending}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-60 sm:w-auto"
            >
              {pending
                ? method === "upnp"
                  ? "Asking the router…"
                  : "Turning on…"
                : "Turn on sharing"}
            </button>
          )}
        </div>
        {error || status.lastError ? (
          <p className="mt-3 text-sm text-danger">{error ?? status.lastError}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">Link</h2>
        <p className="mt-3 break-all rounded-lg bg-background px-3 py-2 font-mono text-sm text-foreground">
          {remoteUrl}
        </p>
        {altUrl ? (
          <p className="mt-2 break-all rounded-lg bg-background px-3 py-2 font-mono text-sm text-foreground">
            {altUrl}
          </p>
        ) : null}
        {status.cgnat ? (
          <p className="mt-3 text-sm text-warning">
            This public address looks private (CGNAT). Inbound port forwarding
            will not work until the ISP provides a real public IPv4 address.
          </p>
        ) : null}

        {status.externalIp || status.enabled ? (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => copy("url", remoteUrl)}
              className="rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-subtle"
            >
              {copied === "url" ? "Copied link" : "Copy link"}
            </button>
            {altUrl ? (
              <button
                type="button"
                onClick={() => copy("alt", altUrl)}
                className="rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-subtle"
              >
                {copied === "alt" ? "Copied" : `Copy :${appPort}`}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => copy("password", status.password)}
              className="rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-subtle"
            >
              {copied === "password" ? "Copied password" : "Copy password"}
            </button>
            <button
              type="button"
              onClick={() => copy("both", invite)}
              className="rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-subtle"
            >
              {copied === "both" ? "Copied invite" : "Copy invite"}
            </button>
          </div>
        ) : null}

        {status.lanUrl ? (
          <p className="mt-4 text-sm text-muted">
            On the same Wi-Fi, use{" "}
            <span className="break-all font-mono text-foreground">
              {status.lanUrl}
            </span>
          </p>
        ) : null}
      </section>

      <details className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          Troubleshooting
        </summary>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
          <li>
            Test from cellular, not home Wi-Fi. Many routers block hairpin NAT,
            so the public IP fails from inside the house even when forwarding is
            correct.
          </li>
          <li>
            The URL port must match the WAN side of{" "}
            <span className="break-all font-mono text-foreground">
              {wanPort} → {lan}:{appPort}
            </span>
            .
          </li>
          <li>
            Forward to this computer ({lan}), keep the app running, and allow
            Node in the OS firewall if prompted.
          </li>
          <li>
            Addresses in 10.x, 100.64–100.127, 172.16–31, or 192.168 are not
            publicly reachable.
          </li>
          <li>
            URL shorteners often reject <span className="font-mono">ip:port</span>
            . Port 80 or a hostname from{" "}
            <a
              href="https://www.duckdns.org"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent hover:underline"
            >
              DuckDNS
            </a>{" "}
            works more reliably.
          </li>
        </ul>
      </details>
    </div>
  );
}
