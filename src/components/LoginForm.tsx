"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not sign in");
        return;
      }
      const nextPath = searchParams.get("next") || "/";
      router.push(
        nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/",
      );
      router.refresh();
    } catch {
      setError("Could not reach the app. Is it still running?");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-foreground">
        Password
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-3 text-base outline-none ring-accent focus:ring-2"
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || !password}
        className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Open Job Tracker"}
      </button>
    </form>
  );
}
