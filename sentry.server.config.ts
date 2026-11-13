/** Sentry for the Node server runtime. Loaded once per server process from instrumentation.ts. */
import * as Sentry from '@sentry/nextjs';

import { sentryBaseOptions } from './sentry.shared';


Sentry.init({
  ...sentryBaseOptions,
  // attach local variable values to each stack frame of an error
  includeLocalVariables: true,
  // forward console calls as Sentry logs
  integrations: [Sentry.consoleLoggingIntegration()],
});
