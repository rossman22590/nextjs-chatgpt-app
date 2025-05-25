import { PrismaClient } from '@prisma/client';

// Check if database is enabled via environment variable
const isDatabaseEnabled = process.env.ENABLE_DATABASE !== 'false';

// Create a more complete mock PrismaClient that handles nested models
class MockPrismaClient {
  [key: string]: any;
  
  constructor() {
    return new Proxy(this, {
      get: (target, prop) => {
        // Special case for then/catch/finally to make it non-thenable
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return undefined;
        }
        
        // Handle model access (e.g., prisma.linkStorage)
        // Return a nested proxy that handles all model operations
        return new Proxy({}, {
          get: (_, modelMethod) => {
            // Create a function that returns a Promise for any model method
            // like findUnique, findMany, create, etc.
            return (..._args: any[]) => {
              if (modelMethod === 'count') {
                return Promise.resolve(0);
              }
              if (modelMethod === 'findMany') {
                return Promise.resolve([]);
              }
              if (modelMethod === 'findUnique' || modelMethod === 'findFirst') {
                return Promise.resolve(null);
              }
              if (modelMethod === 'create' || modelMethod === 'update' || modelMethod === 'upsert') {
                // For create operations, return a mock object with an ID
                return Promise.resolve({ id: 'mock-id' });
              }
              // Default response for any other method
              return Promise.resolve(null);
            };
          }
        });
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
