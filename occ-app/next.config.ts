import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ['*', 'occfp001.state.de.us']
};

export default nextConfig;
