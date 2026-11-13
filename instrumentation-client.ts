/**
 * Sentry for the browser. Next loads this file before the app hydrates.
 * Records a replay of every session and forwards console calls as Sentry logs. Replays show page text and
 * images but mask everything typed, since inputs hold vendor API keys and chat drafts.
 */
import * as Sentry from '@sentry/nextjs';

import { sentryBaseOptions } from './sentry.shared';


Sentry.init({
  ...sentryBaseOptions,
  replaysSessionSampleRate: 1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
      maskAllInputs: true,
    }),
    Sentry.consoleLoggingIntegration(),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
