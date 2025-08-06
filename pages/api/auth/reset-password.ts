import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import { prisma } from '~/server/prisma/prisma-client';

const resend = new Resend(process.env.RESEND_API_KEY);

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = resetPasswordSchema.parse(req.body);

    // Check if user exists
    const user = await (prisma as any).user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ 
        message: 'Password reset email sent successfully',
        success: true 
      });
    }

    // Generate a secure reset token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + (60 * 60 * 1000)); // 1 hour from now

    // Clean up old tokens for this email
    await (prisma as any).passwordResetToken.deleteMany({
      where: {
        OR: [
          { email },
          { expires: { lt: new Date() } }
        ]
      }
    });

    // Store the token in database
    await (prisma as any).passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      }
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

    // Send email via Resend
    try {
      await resend.emails.send({
        from: 'noreply@myapps.ai', // Your verified domain
        to: email,
        subject: 'Reset Your Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>You requested a password reset for your account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 12px 24px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
            </p>
            <p style="color: #666; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br/>
              <a href="${resetUrl}">${resetUrl}</a>
            </p>
          </div>
        `,
      });

      console.log(`Password reset email sent to: ${email} with token: ${token}`);
      
      res.status(200).json({ 
        message: 'Password reset email sent successfully',
        success: true 
      });

    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      res.status(500).json({ 
        message: 'Failed to send password reset email',
        success: false 
      });
    }

  } catch (error) {
    console.error('Password reset error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid email format',
        errors: error.issues,
      });
    }

    res.status(500).json({ 
      message: 'Failed to process password reset request',
      success: false 
    });
  }
}

// Database-based token management - no exports needed 