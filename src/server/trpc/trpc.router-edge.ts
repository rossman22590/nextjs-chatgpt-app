import { createTRPCRouterEdge } from './trpc.server-edge';

// Edge routers
import { aixRouter } from '~/modules/aix/server/api/aix.router';
import { backendRouter } from '~/modules/backend/backend.router';
import { googleSearchRouter } from '~/modules/google/search.router';
import { llmAnthropicRouter } from '~/modules/llms/server/anthropic/anthropic.router';
import { llmGeminiRouter } from '~/modules/llms/server/gemini/gemini.router';
import { llmOllamaRouter } from '~/modules/llms/server/ollama/ollama.router';
import { llmOpenAIRouter } from '~/modules/llms/server/openai/openai.router';
import { speexRouter } from '~/modules/speex/protocols/rpc/rpc.router';
import { youtubeRouter } from '~/modules/youtube/youtube.router';

/**
 * Primary router for Edge Runtime.
 * Uses Edge-specific tRPC configuration without NextAuth.
 */
export const appRouterEdge = createTRPCRouterEdge({
  aix: aixRouter,
  backend: backendRouter,
  googleSearch: googleSearchRouter,
  llmAnthropic: llmAnthropicRouter,
  llmGemini: llmGeminiRouter,
  llmOllama: llmOllamaRouter,
  llmOpenAI: llmOpenAIRouter,
  speex: speexRouter, // synthesize, listVoices (multi-provider TTS)
  youtube: youtubeRouter,
});

// export type definition of API
export type AppRouterEdge = typeof appRouterEdge;