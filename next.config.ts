import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Avatares de las cuentas de Google
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
};

export default nextConfig;
