import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// Validation schema for password verification
const passwordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Password verification API called');
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check if password protection is enabled
  const passwordProtectEnabled = process.env.PASSWORD_PROTECT === 'true';
  const appPassword = process.env.PASSWORD;
  
  console.log('Password protection enabled:', passwordProtectEnabled);
  console.log('App password configured:', !!appPassword);
  
  if (!passwordProtectEnabled || !appPassword) {
    console.log('Password protection disabled or no password set - allowing access');
    return res.status(200).json({ success: true }); // No password required
  }

  try {
    // Get password from request body
    const { password } = req.body || {};
    console.log('Received password:', password ? '[HIDDEN]' : 'empty');

    // If no password provided (testing), return 401 to indicate protection is enabled
    if (!password || password === '') {
      console.log('Empty password - returning 401 to indicate protection enabled');
      return res.status(401).json({ success: false, message: 'Password required' });
    }

    // Check password
    if (password === appPassword) {
      console.log('Password correct - allowing access');
      return res.status(200).json({ success: true });
    } else {
      console.log('Password incorrect - denying access');
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 