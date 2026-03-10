import { createTRPCRouter } from './trpc.server';

import { adminRouter } from '~/server/admin/admin.router';
import { browseRouter } from '~/modules/browse/browse.router';
import { tradeRouter } from '~/modules/trade/server/trade.router';
import { personaRouter } from '~/modules/persona/server/persona.router';
import { usageRouter } from '~/server/usage/usage.router';

/**
 * Cloud rooter, which is geolocated in 1 location and separate from the other routers.
 * NOTE: at the time of writing, the location is aws|us-east-1
 */
export const appRouterCloud = createTRPCRouter({
  admin: adminRouter,
  browse: browseRouter,
  trade: tradeRouter,
  persona: personaRouter,
  usage: usageRouter,
});

// export type definition of API
export type AppRouterCloud = typeof appRouterCloud;