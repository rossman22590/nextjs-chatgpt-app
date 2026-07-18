import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { checkUserAllowance } from '~/server/usage/usage.allowance';
import { isModelDisabledCached } from '~/server/admin/admin.models';

/**
 * Internal usage guard - called by the AIX Edge runtime before dispatching a generation.
 *
 * The Edge runtime has no database access, so it forwards the caller's session cookie
 * here (Node runtime) to answer: "may this user generate right now?".
 *
 * Response: { allowed: boolean, reason: string, message?: string }
 *  - fail-open only on infrastructure errors (no DB configured, DB down), never on limits
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // No database configured (e.g. pure local deployment): usage limits don't apply
  if (!process.env.POSTGRES_PRISMA_URL)
    return res.status(200).json({ allowed: true, reason: 'no-database' });

  try {
    // JWT session strategy: verify the cookie without a DB roundtrip
    const token = await getToken({ req });
    const userId = token?.id as string | undefined;

    if (!userId)
      return res.status(200).json({
        allowed: false,
        reason: 'unauthenticated',
        message: 'Please sign in to use the AI models.',
      });

    const modelId = typeof req.query.modelId === 'string' ? req.query.modelId : undefined;

    // Admin-disabled model: hard block regardless of usage/plan
    if (modelId && await isModelDisabledCached(modelId))
      return res.status(200).json({
        allowed: false,
        reason: 'model_disabled',
        message: 'This model has been turned off by your administrator. Please pick a different model.',
      });

    const allowance = await checkUserAllowance(userId, modelId);

    if (allowance.allowed)
      return res.status(200).json({ allowed: true, reason: allowance.reason });

    // compose a friendly, plan-aware message
    let message: string;
    switch (allowance.reason) {
      case 'inactive':
        message = 'Your account is inactive. Please contact your admin to activate access. If you have an active AI Tutor Ultra account, reach out to support to get activated.';
        break;
      case 'no_credits':
        message = 'Your account has no credits yet. Please contact your admin to enable your plan allowance.';
        break;
      case 'session_limit_reached': {
        const freesInMin = allowance.session.freesAt ? Math.max(1, Math.ceil((allowance.session.freesAt - Date.now()) / 60_000)) : null;
        message = `You've hit the 5-hour session limit (${(allowance.session.limit ?? 0).toLocaleString()} tokens). Usage starts freeing up${freesInMin ? ` in about ${freesInMin >= 60 ? `${Math.floor(freesInMin / 60)} hr ${freesInMin % 60} min` : `${freesInMin} min`}` : ' soon'} as it ages past 5 hours.`;
        break;
      }
      case 'model_limit_reached':
        message = `You've used your weekly ${allowance.planLabel} allowance (${allowance.used.toLocaleString()} / ${(allowance.limit ?? 0).toLocaleString()} weighted tokens in the last 7 days), so ${allowance.blockedGroupLabel} models are unavailable. Standard models remain available, and usage frees up as it ages past 7 days. Note: premium models (Fable, GPT Pro / Sol) consume your allowance 3x faster.`;
        break;
      default:
        message = 'Your account cannot generate right now. Please contact your admin.';
    }

    return res.status(200).json({ allowed: false, reason: allowance.reason, message });

  } catch (error) {
    // infrastructure error (DB down, etc.): don't lock out users, but log it
    console.error('[usage.guard] allowance check failed:', error);
    return res.status(200).json({ allowed: true, reason: 'guard-error' });
  }
}
