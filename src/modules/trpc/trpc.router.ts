import { createTRPCRouter } from './trpc.server';

import { elevenlabsRouter } from '~/modules/elevenlabs/elevenlabs.router';
import { googleSearchRouter } from '~/modules/google/search.router';
import { llmAnthropicRouter } from '~/modules/llms/transports/server/anthropic.router';
import { llmAzureRouter } from '~/modules/llms/transports/server/azure.router';
import { llmOpenAIRouter } from '~/modules/llms/transports/server/openai.router';
import { prodiaRouter } from '~/modules/prodia/prodia.router';
import { sharingRouter } from '~/modules/sharing/sharing.router';
import { ytPersonaRouter } from '../../apps/personas/ytpersona.router';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  elevenlabs: elevenlabsRouter,
  googleSearch: googleSearchRouter,
  llmAnthropic: llmAnthropicRouter,
  llmAzure: llmAzureRouter,
  llmOpenAI: llmOpenAIRouter,
  prodia: prodiaRouter,
  sharing: sharingRouter,
  ytpersona: ytPersonaRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;