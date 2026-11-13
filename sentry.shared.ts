/**
 * Sentry settings shared by the browser, Node and Edge runtimes.
 * This repo is public, so the DSN comes only from the environment: Sentry stays off unless
 * NEXT_PUBLIC_SENTRY_DSN (or SENTRY_DSN on the server) is set, and clones/forks report nowhere.
 * Never put a Sentry auth token here.
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

export const sentryBaseOptions = {
  dsn: SENTRY_DSN,
  enabled: Boolean(SENTRY_DSN),
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT
    || process.env.SENTRY_ENVIRONMENT
    || process.env.NEXT_PUBLIC_DEPLOYMENT_TYPE // set in next.config.ts: 'local', 'vercel-production', ...
    || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_BUILD_HASH, // same release name the build uploads source maps under
  // every error and every trace, in all environments
  sampleRate: 1,
  tracesSampleRate: 1,
};
