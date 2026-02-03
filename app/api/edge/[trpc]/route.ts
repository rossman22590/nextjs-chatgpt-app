import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { appRouterEdge } from '~/server/trpc/trpc.router-edge';
import { createTRPCFetchContextEdge } from '~/server/trpc/trpc.server-edge';

const handlerEdgeRoutes = (req: Request) => fetchRequestHandler({
  endpoint: '/api/edge',
  router: appRouterEdge,
  req,
  createContext: createTRPCFetchContextEdge,
  onError:
    process.env.NODE_ENV === 'development'
      ? ({ path, error }) => console.error(`\n❌ tRPC-edge failed on ${path ?? 'unk-path'}: ${error.message}`)
      : undefined,
});

// NOTE: we don't set maxDuration explicitly here - however we set it in the Vercel project settings, raising to the limit of 300s
// export const maxDuration = 60;
export const runtime = 'edge';
export { handlerEdgeRoutes as GET, handlerEdgeRoutes as POST };