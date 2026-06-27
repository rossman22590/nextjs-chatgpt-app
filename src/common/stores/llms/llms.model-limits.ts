export const OPENROUTER_VISIBLE_MODELS_LIMIT = 20;

export const OPENROUTER_CURATED_MODEL_REFS = [
  'anthropic/claude-sonnet-4.6',
  'anthropic/claude-haiku-4.5',
  'google/gemini-3-flash-preview',
  'google/gemini-3.5-flash',
  'google/gemini-2.5-pro',
  'openai/gpt-5.5',
  'openai/gpt-4o-mini',
  'openai/gpt-5.4',
  'openai/gpt-oss-120b',
  'openai/gpt-5-mini',
  'openai/gpt-5.4-mini',
  'openai/gpt-5.4-nano',
  'openai/gpt-4.1-mini',
  'openai/gpt-5.1',
  'deepseek/deepseek-v4-pro',
  'z-ai/glm-5.2',
  'minimax/minimax-m3',
  'x-ai/grok-4.3',
] as const;

const OPENROUTER_CURATED_MODEL_REF_SET = new Set<string>(OPENROUTER_CURATED_MODEL_REFS);
const OPENROUTER_CURATED_MODEL_REF_RANK = new Map<string, number>(
  OPENROUTER_CURATED_MODEL_REFS.map((ref, index) => [ref, index]),
);

export function isOpenRouterCuratedModelRef(modelRef: string | undefined): boolean {
  return !!modelRef && OPENROUTER_CURATED_MODEL_REF_SET.has(modelRef);
}

export function openRouterCuratedModelRank(modelRef: string | undefined): number {
  return modelRef ? OPENROUTER_CURATED_MODEL_REF_RANK.get(modelRef) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
}
