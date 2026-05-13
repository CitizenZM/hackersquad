import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      { hostname: "i.ytimg.com" },
      { hostname: "oaidalleapiprodscus.blob.core.windows.net" },
    ],
  },
};

export default nextConfig;
