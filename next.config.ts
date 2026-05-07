/** @type {import('next').NextConfig} */
const nextConfig = {
  // Isso é OBRIGATÓRIO para Prisma + Next.js 15/16 no Render
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;