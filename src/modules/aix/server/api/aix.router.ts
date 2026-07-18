import * as z from 'zod/v4';

import { createTRPCRouterEdge, edgeProcedure } from '~/server/trpc/trpc.server-edge';

import { _createDebugConfig } from '../dispatch/chatGenerate/chatGenerate.debug';
import { createChatGenerateDispatch, createChatGenerateResumeDispatch, executeChatGenerateDelete } from '../dispatch/chatGenerate/chatGenerate.dispatch';
import { executeChatGenerateWithContinuation } from '../dispatch/chatGenerate/chatGenerate.continuation';

import { AixWire_API, AixWire_API_ChatContentGenerate } from './aix.wiretypes';
import type { AixWire_Particles } from './aix.wiretypes';


// --- Usage Guard (server-side enforcement) ---

/**
 * Server-side usage enforcement: the Edge runtime has no session or database access,
 * so it forwards the caller's session cookie to the Node guard endpoint, which checks
 * the user's weekly plan allowance (see src/server/usage/).
 *
 * Returns null when generation may proceed, or a user-facing block message.
 * Fails open only on infrastructure errors - an explicit denial always blocks.
 */
async function _checkUsageGuard(req: Request, modelId?: string): Promise<string | null> {
  try {
    const guardUrl = new URL('/api/usage/guard', req.url);
    if (modelId) guardUrl.searchParams.set('modelId', modelId);
    const response = await fetch(guardUrl, {
      headers: { cookie: req.headers.get('cookie') ?? '' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null; // guard unavailable: fail open
    const guard: { allowed: boolean; reason?: string; message?: string } = await response.json();
    if (guard.allowed) return null;
    return guard.message || 'Your account cannot generate right now. Please contact your admin.';
  } catch {
    return null; // network/timeout: fail open, the client pre-flight is the fallback
  }
}

/** Terminates the generation stream with a user-facing issue, mirroring the dispatch-prepare error shape. */
function* _yieldGuardDenial(message: string): Generator<AixWire_Particles.ChatGenerateOp> {
  yield { cg: 'issue', issueId: 'dispatch-prepare', issueText: ` 🚫 **[Usage]:** ${message}` };
  yield { cg: 'end', terminationReason: 'issue-dispatch-rpc', tokenStopReason: 'cg-issue' };
}


// --- AIX tRPC Router ---

export const aixRouter = createTRPCRouterEdge({

  /**
   * Chat content generation, streaming, multipart.
   * Architecture: Client <-- (intake) --> Server <-- (dispatch) --> AI Service
   */
  chatGenerateContent: edgeProcedure
    .input(z.object({
      access: AixWire_API.Access_schema,
      model: AixWire_API.Model_schema,
      chatGenerate: AixWire_API_ChatContentGenerate.Request_schema,
      context: AixWire_API.ContextChatGenerate_schema,
      streaming: z.boolean(),
      connectionOptions: AixWire_API.ConnectionOptionsChatGenerate_schema.optional(), // debugDispatchRequest, debugProfilePerformance, enableResumability
    }))
    .mutation(async function* ({ input, ctx }) {

      // server-side usage enforcement (weekly plan + per-model-family limits) - blocks before any provider dispatch
      const guardDenial = await _checkUsageGuard(ctx.req, input.model.id);
      if (guardDenial !== null)
        return yield* _yieldGuardDenial(guardDenial);

      const _d = _createDebugConfig(input.access, input.connectionOptions, input.context.name);
      const dispatchCreator = () => createChatGenerateDispatch(input.access, input.model, input.chatGenerate, input.streaming, !!input.connectionOptions?.enableResumability);

      yield* executeChatGenerateWithContinuation(dispatchCreator, ctx.reqSignal, _d);
    }),

  /**
   * Chat content generation - reattach to an in-progress upstream run by handle, streaming only.
   * Today: OpenAI Responses API (network-disconnect recovery) and Gemini Interactions (Deep Research across reloads).
   */
  upstreamReattachContent: edgeProcedure
    .input(z.object({
      access: AixWire_API.Access_schema,
      upstreamHandle: AixWire_API.UpstreamHandle_schema, // reattach uses a handle instead of 'model + chatGenerate'
      context: AixWire_API.ContextChatGenerate_schema,
      streaming: z.boolean(),
      connectionOptions: AixWire_API.ConnectionOptionsChatGenerate_schema.pick({ debugDispatchRequest: true }).optional(), // debugDispatchRequest
    }))
    .mutation(async function* ({ input, ctx }) {

      // server-side usage enforcement: reattach continues real token generation, so it is gated too
      // (no modelId: only the account-level gates apply - inactive / no-credits / session limit)
      const guardDenial = await _checkUsageGuard(ctx.req);
      if (guardDenial !== null)
        return yield* _yieldGuardDenial(guardDenial);

      const _d = _createDebugConfig(input.access, input.connectionOptions, input.context.name);
      const dispatchCreator = () => createChatGenerateResumeDispatch(input.access, input.upstreamHandle, input.streaming);

      yield* executeChatGenerateWithContinuation(dispatchCreator, ctx.reqSignal, _d);
    }),

  /**
   * Delete an upstream-stored run by handle. One-shot, non-streaming, terminal: removes the
   * server-side resource (Gemini interaction / OpenAI response). Symmetric to `reattachContent`.
   */
  upstreamDeleteContent: edgeProcedure
    .input(z.object({
      access: AixWire_API.Access_schema,
      upstreamHandle: AixWire_API.UpstreamHandle_schema, // { uht, runId, ... } - the schema strips unknown fields (createdAt/expiresAt)
    }))
    .mutation(async ({ input, ctx }) => {
      return await executeChatGenerateDelete(input.access, input.upstreamHandle, ctx.reqSignal);
    }),

});
