/**
 * OpenRouter is restricted to models at or below an output-price ceiling (see
 * openrouter.models.ts for the server-side filter, and the llms hooks/dropdown utils
 * for the client-side guard on models persisted by older builds).
 *
 * Denominated in $/MegaTokens, matching DPricingChatGenerate. Models whose output
 * price is unknown or variable - OpenRouter prices its auto-routers as "-1" - are
 * excluded, since their real cost is not knowable up front.
 */
export const OPENROUTER_MAX_OUTPUT_PRICE_PER_MTOK = 5;

/** Caps how many of the eligible models are surfaced by default. */
export const OPENROUTER_VISIBLE_MODELS_LIMIT = 30;
