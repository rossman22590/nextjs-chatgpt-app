import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';

// This should be set as an environment variable in production
const APP_PASSWORD_HASH = process.env.APP_PASSWORD_HASH;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // If no password hash is configured, allow access (development mode)
    if (!APP_PASSWORD_HASH) {
      console.warn('APP_PASSWORD_HASH not configured - allowing access');
      return res.status(200).json({ success: true });
    }

    // Verify the password against the hash
    const isValid = await bcrypt.compare(password, APP_PASSWORD_HASH);

    if (isValid) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Password verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}