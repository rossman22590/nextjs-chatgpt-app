import { PrismaClient } from '@prisma/client';

// Check if database is enabled via environment variable
const isDatabaseEnabled = process.env.ENABLE_DATABASE !== 'false';

// Create a mock PrismaClient that will be used when database is disabled
class MockPrismaClient {
  constructor() {
    return new Proxy({}, {
      get: (target, prop) => {
        // Return a function that returns a Promise resolving to an empty array or object
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return undefined;
        }
        return () => Promise.resolve([]);
      }
    });
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | MockPrismaClient | undefined;
};

export const prismaDb =
  globalForPrisma.prisma ??
  (isDatabaseEnabled
    ? new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      })
    : new MockPrismaClient() as unknown as PrismaClient);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaDb;

// Log database status on startup (development only)
if (process.env.NODE_ENV === 'development') {
  console.log(`Database is ${isDatabaseEnabled ? 'ENABLED' : 'DISABLED'}`);
}
