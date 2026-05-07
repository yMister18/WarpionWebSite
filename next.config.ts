import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remova a chave 'eslint' direta se ela existia
  serverExternalPackages: ['@prisma/client'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;