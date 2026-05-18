import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '~/server/prisma/prisma-client';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import { z } from 'zod';

import { normalizeAuthEmail } from '~/server/auth/auth-utils';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleAuthConfigured = Boolean(googleClientId && googleClientSecret);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(googleAuthConfigured
      ? [
          GoogleProvider({
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validate credentials format
        const credentialsSchema = z.object({
          email: z.string().email(),
          password: z.string().min(6),
        });

        const result = credentialsSchema.safeParse(credentials);
        if (!result.success) {
          return null;
        }

        const { email, password } = result.data;
        const normalizedEmail = normalizeAuthEmail(email);

        // Find user by email (case-insensitive: legacy rows may differ in casing)
        const user = await (prisma as any).user.findFirst({
          where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
        });

        if (!user || !user.id) {
          return null;
        }

        // Get the hashed password from the database
        const userAccount = await (prisma as any).account.findFirst({
          where: {
            userId: user.id,
            provider: 'credentials'
          }
        });
        
        if (!userAccount || !userAccount.providerAccountId) {
          return null;
        }
        
        // Compare the provided password with the stored hash
        const isValid = await compare(password, userAccount.providerAccountId);
        
        if (!isValid) {
          return null;
        }
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}; 