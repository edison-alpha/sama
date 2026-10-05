import type { NextConfig } from "next";

/**
 * Shared @sama/* packages (sama-packages) are added to transpilePackages once they are linked
 * through pnpm-workspace.yaml. The starter runs without them in mock mode.
 */
const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  /**
   * Next.js blocks dev-server requests whose Origin doesn't match the host you loaded the
   * page from. Without this, opening the app from a phone via your PC's LAN IP (e.g.
   * http://192.168.x.x:3200 or a phone-hotspot IP like 172.20.10.x) gets blocked/broken.
   * Patterns are dot-segment wildcards (no CIDR support), so common private ranges are
   * spelled out; add your own IP here if it falls outside these.
   */
  allowedDevOrigins: [
    "192.168.*.*", // typical home/office Wi-Fi router LAN
    "10.*.*.*", // typical corporate/VPN LAN
    "172.20.10.*", // iPhone Personal Hotspot subnet
  ],
  /** The old single-page guide now lives in the docs. */
  async redirects() {
    return [{ source: "/learn", destination: "/docs", permanent: true }];
  },
};

export default config;
