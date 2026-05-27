import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // Privy pulls in optional Farcaster/Solana connectors we don't use.
  // Mark them as resolved-to-false so webpack stops complaining.
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      "@farcaster/mini-app-solana": false,
      "@farcaster/miniapp-sdk": false,
      "@farcaster/frame-sdk": false,
      "pino-pretty": false,
      encoding: false,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "img-src 'self' data: blob: https:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://auth.privy.io",
              "frame-src 'self' https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com",
              "worker-src 'self' blob:",
              "connect-src 'self' https://*.supabase.co https://*.arc.network https://rpc.testnet.arc.network wss://rpc.testnet.arc.network https://testnet.arcscan.app https://auth.privy.io https://*.privy.io https://*.privy.systems wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.walletconnect.com https://*.walletconnect.org https://explorer-api.walletconnect.com https://api.coingecko.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
