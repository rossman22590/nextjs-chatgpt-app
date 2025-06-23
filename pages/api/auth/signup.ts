import { NextApiRequest, NextApiResponse } from 'next';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { prisma } from '~/server/prisma/prisma-client';

// Validation schema for user registration
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Validate request body
    const result = signupSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: 'Invalid input', 
        errors: result.error.errors 
      });
    }

    const { name, email, password } = result.data;

    // Check if user already exists
    // Using any type assertion as a workaround for TypeScript errors
    const existingUser = await (prisma as any).user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create the user
    const user = await (prisma as any).user.create({
      data: {
        name,
        email,
        // Create a credentials account
        accounts: {
          create: {
            type: 'credentials',
            provider: 'credentials',
            providerAccountId: hashedPassword, // Store hashed password in providerAccountId
          },
        },
      },
    });

    // Return success without exposing sensitive user data
    res.status(201).json({
      message: 'User created successfully',
      userId: user.id,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
