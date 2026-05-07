import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Apenas esta linha é necessária para o Prisma
  serverExternalPackages: ['@prisma/client'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;