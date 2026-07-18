import { isAdminEmail } from '~/common/auth/adminEmails';
import { prisma } from '~/server/prisma/prisma-client';

import { MODEL_LIMIT_GROUPS, modelGroupIdFor, planLabel, planSessionTokens, planWeeklyTokens, PREMIUM_MODEL_WEIGHT, SESSION_WINDOW_MS, WEEKLY_WINDOW_MS } from './usage.plans';


export type UsageModelGroup = {
  id: string;
  label: string;
  /** raw tokens used in the trailing 7 days on this premium family */
  used: number;
  /** what those tokens count for against the weekly allowance (used x weight) */
  weighted: number;
  /** true when the weekly limit is hit: this family is unavailable until usage frees up */
  blocked: boolean;
};

export type UsageSession = {
  /** WEIGHTED tokens used in the trailing 5 hours */
  used: number;
  /** session cap in weighted tokens (null = uncapped, admin) */
  limit: number | null;
  remaining: number | null;
  /** epoch ms when the oldest in-window usage starts aging out (i.e. when the session starts freeing up), null when no usage */
  freesAt: number | null;
};

export type UsageAllowance = {
  allowed: boolean;
  reason: 'admin' | 'inactive' | 'no_credits' | 'within_limit' | 'session_limit_reached' | 'model_limit_reached' | 'unknown_user';
  plan: string;
  planLabel: string;
  /** effective weekly token limit (null only for admin) */
  limit: number | null;
  /** WEIGHTED tokens used in the trailing 7 days (premium models count x3) */
  used: number;
  remaining: number | null;
  /** premium model families: usage + blocked state */
  modelGroups: UsageModelGroup[];
  /** short-term (rolling 5-hour) session usage - blocks ALL models when exhausted */
  session: UsageSession;
  /** set when reason = 'model_limit_reached': the family that was requested while over the limit */
  blockedGroupLabel?: string;
  isActive: boolean;
};

const _noGroups: UsageModelGroup[] = [];
const _zeroSession: UsageSession = { used: 0, limit: 0, remaining: 0, freesAt: null };

/**
 * Single source of truth for "can this user generate right now?".
 *
 * Weekly allowance over a rolling 7-day window, with premium-model weighting:
 *  - premium families (Fable, GPT Pro / Sol - all variants) consume the allowance
 *    PREMIUM_MODEL_WEIGHT (3x) faster than standard models
 *  - once the weekly limit is hit, ONLY the premium families are blocked;
 *    standard models keep working
 *
 * `User.tokenLimit` semantics:
 *  - 0    -> blocked, no credits granted yet (the signup default)
 *  - null -> use the plan's weekly default (Premium/Ultra, see usage.plans.ts)
 *  - > 0  -> custom per-user weekly override
 *
 * @param modelId when provided (pre-flight/guard), a premium-family request is
 *                rejected if the weekly allowance is exhausted.
 */
export async function checkUserAllowance(userId: string, modelId?: string): Promise<UsageAllowance> {

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, tokenLimit: true, email: true, isActive: true },
  });

  if (!user)
    return { allowed: false, reason: 'unknown_user', plan: 'PREMIUM', planLabel: planLabel(null), limit: 0, used: 0, remaining: 0, modelGroups: _noGroups, session: _zeroSession, isActive: false };

  const plan = user.plan;
  const label = planLabel(plan);
  const isAdmin = isAdminEmail(user.email);

  // Only an explicit false blocks - legacy accounts (null) predate activation
  if (!isAdmin && user.isActive === false)
    return { allowed: false, reason: 'inactive', plan, planLabel: label, limit: 0, used: 0, remaining: 0, modelGroups: _noGroups, session: _zeroSession, isActive: false };

  // 0 = blocked: account has no credits granted yet
  if (!isAdmin && user.tokenLimit === 0)
    return { allowed: false, reason: 'no_credits', plan, planLabel: label, limit: 0, used: 0, remaining: 0, modelGroups: _noGroups, session: _zeroSession, isActive: true };

  // Single query for the rolling 7-day window: classify + weight per model family in JS
  // (regex matching can't be expressed in a Prisma aggregate); the 5-hour session
  // window is computed in the same pass.
  const now = Date.now();
  const windowStart = new Date(now - WEEKLY_WINDOW_MS);
  const sessionStart = now - SESSION_WINDOW_MS;
  const logs = await prisma.usageLog.findMany({
    where: { userId, createdAt: { gte: windowStart } },
    select: { modelId: true, totalTokens: true, createdAt: true },
  });

  let weightedUsed = 0;
  let sessionUsed = 0;
  let sessionOldestTs: number | null = null;
  const groupRawUsed: Record<string, number> = {};
  for (const log of logs) {
    const groupId = modelGroupIdFor(log.modelId);
    const weighted = groupId ? log.totalTokens * PREMIUM_MODEL_WEIGHT : log.totalTokens; // premium models eat the allowance 3x faster
    weightedUsed += weighted;
    if (groupId)
      groupRawUsed[groupId] = (groupRawUsed[groupId] ?? 0) + log.totalTokens;
    const ts = log.createdAt.getTime();
    if (ts >= sessionStart) {
      sessionUsed += weighted;
      if (sessionOldestTs === null || ts < sessionOldestTs) sessionOldestTs = ts;
    }
  }

  // Effective weekly limit: per-user override (> 0) wins, null falls back to the plan default. Admin = uncapped.
  const weeklyLimit = isAdmin ? null : (user.tokenLimit != null && user.tokenLimit > 0) ? user.tokenLimit : planWeeklyTokens(plan);
  const overLimit = weeklyLimit != null && weightedUsed >= weeklyLimit;

  // Session (rolling 5-hour) limit: burst protection, blocks ALL models when exhausted. Admin = uncapped.
  const sessionLimit = isAdmin ? null : planSessionTokens(plan);
  const session: UsageSession = {
    used: sessionUsed,
    limit: sessionLimit,
    remaining: sessionLimit == null ? null : Math.max(0, sessionLimit - sessionUsed),
    freesAt: sessionOldestTs == null ? null : sessionOldestTs + SESSION_WINDOW_MS,
  };

  const modelGroups: UsageModelGroup[] = MODEL_LIMIT_GROUPS.map((group) => {
    const raw = groupRawUsed[group.id] ?? 0;
    return {
      id: group.id,
      label: group.label,
      used: raw,
      weighted: raw * PREMIUM_MODEL_WEIGHT,
      blocked: overLimit, // over the weekly limit -> ALL premium families are unavailable
    };
  });

  // Admin is always unlimited (but still reports real usage)
  if (isAdmin)
    return { allowed: true, reason: 'admin', plan, planLabel: label, limit: null, used: weightedUsed, remaining: null, modelGroups, session, isActive: true };

  const remaining = Math.max(0, (weeklyLimit ?? 0) - weightedUsed);

  // 1. session limit first (the tightest gate): blocks EVERY model until usage ages past 5 hours
  if (sessionLimit != null && sessionUsed >= sessionLimit)
    return { allowed: false, reason: 'session_limit_reached', plan, planLabel: label, limit: weeklyLimit, used: weightedUsed, remaining, modelGroups, session, isActive: true };

  // 2. over the weekly limit: block ONLY premium-family requests - standard models keep working
  const requestGroupId = modelGroupIdFor(modelId);
  if (overLimit && requestGroupId) {
    const group = modelGroups.find((g) => g.id === requestGroupId);
    return { allowed: false, reason: 'model_limit_reached', plan, planLabel: label, limit: weeklyLimit, used: weightedUsed, remaining, modelGroups, session, blockedGroupLabel: group?.label ?? 'premium model', isActive: true };
  }

  return { allowed: true, reason: 'within_limit', plan, planLabel: label, limit: weeklyLimit, used: weightedUsed, remaining, modelGroups, session, isActive: true };
}
