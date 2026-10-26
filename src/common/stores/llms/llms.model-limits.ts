/**
 * OpenRouter is restricted to free-of-charge models (see openrouter.models.ts for the
 * server-side filter, and the llms hooks/dropdown utils for the client-side guard on
 * models persisted by older builds).
 *
 * This cap only bounds how many of those are surfaced by default.
 */
export const OPENROUTER_VISIBLE_MODELS_LIMIT = 30;
