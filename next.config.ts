import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Dev-only: HTML is served on the public/LAN host, but Next blocks
  // /_next scripts from any origin other than localhost unless listed.
  allowedDevOrigins: ["*.*.*.*", "*.local", "*.duckdns.org"],
};

export default nextConfig;
