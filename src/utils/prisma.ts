import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'], // Optional: remove or customize in production
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
