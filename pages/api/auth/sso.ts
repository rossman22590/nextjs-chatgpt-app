import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma/prisma-client';
import { encode } from 'next-auth/jwt';

const isAllowedSSOReferrer = (referrer: string | null): boolean => {
  if (!referrer) return false;
  try {
    const url = new URL(referrer);
    const hostname = url.hostname;
    const port = url.port;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return port === "3000" || port === "3001";
    }

    return hostname === "myapps.ai" || hostname.endsWith(".myapps.ai");
  } catch {
    return false;
  }
};

export default async function ssoHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const ssoToken = req.query.sso_token as string;
  if (!ssoToken) {
    return res.status(400).json({ message: 'sso_token is required' });
  }

  // Enforce referer check for extra protection
  const referer = req.headers.referer || null;
  if (!isAllowedSSOReferrer(referer)) {
    console.warn("SSO rejected: invalid referer domain:", referer);
    return res.status(403).json({ message: 'Access denied: invalid origin' });
  }

  try {
    // 1. Find the session in the database
    const session = await prisma.session.findUnique({
      where: { sessionToken: ssoToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    const user = session.user;
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // 2. Generate the NextAuth JWT token
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET is not configured');
    }

    const jwtToken = await encode({
      token: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.image,
      },
      secret,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // 3. Set the session cookie
    const secure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
    const cookieName = secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
    const maxAge = 30 * 24 * 60 * 60; // 30 days

    const cookieStr = `${cookieName}=${jwtToken}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', cookieStr);

    // 4. Delete the temporary database session
    await prisma.session.delete({
      where: { id: session.id },
    });

    // 5. Redirect back to the main app dashboard (e.g. '/')
    const nextParam = (req.query.next as string) || '/';
    res.writeHead(302, { Location: nextParam });
    res.end();
  } catch (error: any) {
    console.error('SSO authentication failed:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}
