/** Sentry for the Edge runtime (middleware, AIX and other edge routes). Loaded from instrumentation.ts. */
import * as Sentry from '@sentry/nextjs';

import { sentryBaseOptions } from './sentry.shared';


Sentry.init({
  ...sentryBaseOptions,
  integrations: [Sentry.consoleLoggingIntegration()],
});
