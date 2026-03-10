/**
 * Enforces NextAuth login for app routes when the user arrives.
 * Public routes (auth, API, static) are excluded via config.matcher.
 *
 * Requires NEXTAUTH_SECRET to be set (same as NextAuth API route).
 * Session strategy must be "jwt" (default in auth.config.ts).
 */

import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});

export const config = {
  matcher: [
    // Protect app routes only: run middleware for paths that are NOT in the exclusion list
    '/((?!api|_next|auth|favicon\\.ico|link/callback_openrouter).*)',
  ],
};
