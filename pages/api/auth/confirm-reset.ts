import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { hashSync } from 'bcryptjs';
import { prisma } from '~/server/prisma/prisma-client';

const confirmResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token, password } = confirmResetSchema.parse(req.body);

    // Find and validate token in database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    });
    
    if (!resetToken || resetToken.used) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token',
        success: false 
      });
    }

    // Check if token is expired
    if (new Date() > resetToken.expires) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      });
      return res.status(400).json({ 
        message: 'Reset token has expired',
        success: false 
      });
    }

    // Hash the new password
    const hashedPassword = hashSync(password, 12);

    // Update the user's password in the Account table
    await prisma.account.updateMany({
      where: {
        user: { email: resetToken.email },
        provider: 'credentials'
      },
      data: {
        providerAccountId: hashedPassword
      }
    });

    // Mark token as used and clean up
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    });

    console.log(`Password reset successful for email: ${resetToken.email}`);

    res.status(200).json({ 
      message: 'Password updated successfully',
      success: true 
    });

  } catch (error) {
    console.error('Password reset confirmation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid input',
        errors: error.errors,
      });
    }

    res.status(500).json({ 
      message: 'Failed to update password',
      success: false 
    });
  }
} 