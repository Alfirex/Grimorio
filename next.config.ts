import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Avatares de las cuentas de Google
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Ilustraciones de monstruos del SRD
      { protocol: "https", hostname: "www.dnd5eapi.co" },
    ],
  },
};

export default nextConfig;
