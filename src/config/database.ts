import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '@prisma/client';

import { env } from './env';

let prisma: PrismaClient;

const createPrismaClient = (log?: Prisma.LogLevel[]) => {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  if (log) {
    return new PrismaClient({ adapter, log });
  }
  return new PrismaClient({ adapter });
};

if (env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  // Prevent multiple instances in development with hot reload
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
  };

  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = createPrismaClient(
      env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    );
  }
  prisma = globalWithPrisma.prisma;
}

export { prisma };
