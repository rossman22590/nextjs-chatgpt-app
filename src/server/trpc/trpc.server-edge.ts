/**
 * Edge Runtime tRPC Server Configuration
 * 
 * This file provides tRPC server setup specifically for Edge Runtime environments.
 * It does NOT import NextAuth or any Node.js-specific APIs.
 */
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { ZodError } from 'zod';
import { initTRPC, TRPCError } from '@trpc/server';
import { transformer } from '~/server/trpc/trpc.transformer';

/**
 * Edge Runtime Context - No authentication support
 * Used for Edge API routes that don't need authentication
 */
export const createTRPCFetchContextEdge = async ({ req }: FetchCreateContextFnOptions) => {
  return {
    session: null as null, // Explicitly null in Edge Runtime
    hostName: req.headers?.get('host') ?? 'localhost',
    reqSignal: req.signal,
    req,
    res: null as null,
  };
};

/**
 * Edge Runtime tRPC initialization
 */
const tEdge = initTRPC.context<typeof createTRPCFetchContextEdge>().create({
  transformer: transformer,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Edge Router and Procedure builders
 */
export const createTRPCRouterEdge = tEdge.router;

/**
 * Public (unprotected) procedure for Edge Runtime
 * No authentication support in Edge Runtime
 */
export const publicProcedureEdge = tEdge.procedure;

/**
 * Edge procedure alias used by edge routers.
 * Keeps naming consistent with existing code while staying edge-safe.
 */
export const edgeProcedure = publicProcedureEdge;

/**
 * Protected procedure that always throws in Edge Runtime
 * Since Edge Runtime doesn't support NextAuth, protected operations should be disabled
 */
export const protectedProcedureEdge = tEdge.procedure.use(async ({ next }) => {
  throw new TRPCError({ 
    code: 'UNAUTHORIZED', 
    message: 'Authentication not supported in Edge Runtime. Use cloud API routes for authenticated operations.' 
  });
}); 
