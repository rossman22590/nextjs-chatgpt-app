/**
 * Subscription plan definitions - single source of truth for plan limits.
 *
 * Limits are WEEKLY, computed over a rolling 7-day window (trailing 168 hours),
 * so there is no fixed reset day to game.
 *
 * Edit the token amounts here to tune the plans - no migration needed.
 */

/**
 * Premium model families (matched against the logged modelId, which for OpenRouter
 * looks like 'openrouter-...-anthropic/claude-fable-5' or '...openai/gpt-5.6-sol-pro').
 *
 * These models:
 *  - consume the weekly allowance PREMIUM_MODEL_WEIGHT times faster
 *  - are the ONLY models blocked once the weekly limit is hit (standard models keep working)
 *
 * 'all variants' by design: any Fable, and any GPT with a -pro or -sol suffix (OpenAI Sol included).
 */
export const MODEL_LIMIT_GROUPS = [
  { id: 'fable', label: 'Fable', match: /fable/i },
  { id: 'gpt_premium', label: 'GPT Pro / Sol', match: /gpt[^/]*(-sol\b|-pro\b)/i },
] as const;

export type ModelLimitGroupId = typeof MODEL_LIMIT_GROUPS[number]['id'];

/** Premium models eat the weekly allowance this many times faster. */
export const PREMIUM_MODEL_WEIGHT = 3;

/** Classify a model id into a premium family (or null for standard models, weighted 1x and never blocked). */
export function modelGroupIdFor(modelId: string | null | undefined): ModelLimitGroupId | null {
  if (!modelId) return null;
  for (const group of MODEL_LIMIT_GROUPS)
    if (group.match.test(modelId)) return group.id;
  return null;
}

export const USER_PLANS = {
  PREMIUM: {
    label: 'Premium',
    weeklyTokens: 5_000_000,
    sessionTokens: 1_000_000, // max weighted tokens per rolling 5-hour session window
  },
  ULTRA: {
    label: 'Ultra',
    weeklyTokens: 25_000_000,
    sessionTokens: 1_000_000,
  },
} as const;

export type UserPlanId = keyof typeof USER_PLANS;

export const USER_PLAN_IDS = Object.keys(USER_PLANS) as UserPlanId[];

export const DEFAULT_USER_PLAN: UserPlanId = 'PREMIUM';

/** Rolling window used for all weekly limit checks. */
export const WEEKLY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Rolling window for the short-term session limit (burst protection). */
export const SESSION_WINDOW_MS = 5 * 60 * 60 * 1000;

function _planOrDefault(plan: string | null | undefined): UserPlanId {
  return (plan && plan in USER_PLANS) ? plan as UserPlanId : DEFAULT_USER_PLAN;
}

export function planWeeklyTokens(plan: string | null | undefined): number {
  return USER_PLANS[_planOrDefault(plan)].weeklyTokens;
}

export function planSessionTokens(plan: string | null | undefined): number {
  return USER_PLANS[_planOrDefault(plan)].sessionTokens;
}

export function planLabel(plan: string | null | undefined): string {
  return USER_PLANS[_planOrDefault(plan)].label;
}
