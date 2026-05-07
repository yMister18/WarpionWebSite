import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isso avisa ao Next.js: "Não toque no Prisma, use-o como um pacote de servidor comum"
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;