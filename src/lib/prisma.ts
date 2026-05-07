import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    // Isso força o uso do binário nativo gerado pelo 'prisma generate'
    // @ts-ignore
    engineType: 'library', 
    log: ['error'],
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export function getPrismaClient() {
  return prisma;
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;