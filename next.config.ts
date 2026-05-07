import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isso força o Next.js a usar o Prisma como um pacote de servidor comum,
  // evitando que ele tente rodar em modo "Edge" durante o build.
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;