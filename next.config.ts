import type { NextConfig } from "next";

// Ensure webpack resolves modules (e.g. tailwindcss) from this project, not a parent directory.
// Run `npm run build` from the project root: /home/fira/Desktop/impactis-client
const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  webpack: (config, { dir }) => {
    config.context = dir;
    return config;
  },
};

export default nextConfig;
