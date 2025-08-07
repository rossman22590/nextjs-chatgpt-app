// configuration
const DEFAULT_TIMEOUT_MS = 10_000;

// Vercel timeout can be configured (default 300s, user has 800s)
// We'll use less aggressive heartbeats for extended Vercel deployments
const VERCEL_TIMEOUT_MS = 15_000; // 15 seconds for Vercel (with 800s timeout)
const isVercelDeployment = process.env.VERCEL === '1';
const HEARTBEAT_INTERVAL = isVercelDeployment ? VERCEL_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;


/**
 * Awaits a promise while sending ❤
 *
 * Maintains connection liveliness during long-running operations such as
 * long fetches (e.g. Anthropic on large context) or long reads (e.g.
 * image generation by Gemini Image).
 *
 * @param operationPromise Promise to await with heartbeat protection
 * @param timeoutMs Time in ms between heartbeats (if 0, no heartbeats)
 * @returns The same result as awaiting the promise
 */
export async function* heartbeatsWhileAwaiting<TOut>(operationPromise: Promise<TOut>, timeoutMs: number = HEARTBEAT_INTERVAL) {
  if (!timeoutMs) return await operationPromise;

  // holds the outcome in either state
  const operationWrapper = operationPromise
    .then(result => ({ type: 'resolved' as const, result }))
    .catch(error => ({ type: 'rejected' as const, error }));

  while (true) {

    // setup next ❤ timeout
    const heartbeatPromise = new Promise<'❤'>(resolve => {
      setTimeout(() => resolve('❤'), timeoutMs);
    });

    // race ❤|operation
    const winner = await Promise.race([
      operationWrapper,
      heartbeatPromise,
    ]);

    // if the operation won, great, we're done
    if (winner !== '❤')
      break;

    // otherwise send the ❤
    yield { p: '❤' as const };
  }

  // return the actual result (or throw if rejected)
  const wrappedResult = await operationWrapper;
  if (wrappedResult.type === 'rejected')
    throw wrappedResult.error;

  return wrappedResult.result;
}
