import * as Sentry from '@sentry/nextjs';


/** Runs once when the Next.js server starts and loads Sentry for the current runtime. */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs')
    await import('./sentry.server.config');
  if (process.env.NEXT_RUNTIME === 'edge')
    await import('./sentry.edge.config');
}

/** Reports errors thrown in API route handlers, pages and middleware. */
export const onRequestError = Sentry.captureRequestError;
