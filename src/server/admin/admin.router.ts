import * as z from 'zod/v4';
import { TRPCError } from '@trpc/server';

import { createTRPCRouter, protectedProcedure } from '~/server/trpc/trpc.server';
import { prisma } from '~/server/prisma/prisma-client';

const ADMIN_EMAIL = 'rcohen@mytsi.org';

// Middleware: ensure the caller is the admin
const isAdmin = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user.email !== ADMIN_EMAIL)
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  return next({ ctx });
});

export const adminRouter = createTRPCRouter({

  // Check if current user is admin (lightweight, for UI gating)
  isAdmin: protectedProcedure
    .query(({ ctx }) => {
      return { isAdmin: ctx.session.user.email === ADMIN_EMAIL };
    }),

  // List all users with usage stats
  listUsers: isAdmin
    .input(z.object({
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 50;
      const users = await prisma.user.findMany({
        take: limit + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { id: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          tokenLimit: true,
          _count: { select: { conversations: true, messages: true, usageLogs: true } },
        },
      });

      let nextCursor: string | undefined;
      if (users.length > limit) {
        const extra = users.pop()!;
        nextCursor = extra.id;
      }

      return { users, nextCursor };
    }),

  // Get usage summary for a specific user (current month + all time)
  getUserUsage: isAdmin
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [allTime, thisMonth, user] = await Promise.all([
        prisma.usageLog.aggregate({
          where: { userId: input.userId },
          _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costCents: true },
          _count: true,
        }),
        prisma.usageLog.aggregate({
          where: { userId: input.userId, createdAt: { gte: monthStart } },
          _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costCents: true },
          _count: true,
        }),
        prisma.user.findUnique({
          where: { id: input.userId },
          select: { id: true, name: true, email: true, tokenLimit: true },
        }),
      ]);

      return { user, allTime, thisMonth };
    }),

  // Get recent usage logs for a user
  getUserLogs: isAdmin
    .input(z.object({
      userId: z.string(),
      limit: z.number().min(1).max(200).default(50),
    }))
    .query(async ({ input }) => {
      return prisma.usageLog.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
    }),

  // Set token limit for a user (null = unlimited)
  setTokenLimit: isAdmin
    .input(z.object({
      userId: z.string(),
      tokenLimit: z.number().int().positive().nullable(),
    }))
    .mutation(async ({ input }) => {
      return prisma.user.update({
        where: { id: input.userId },
        data: { tokenLimit: input.tokenLimit },
        select: { id: true, email: true, tokenLimit: true },
      });
    }),

  // Bulk set token limit for ALL users
  setAllTokenLimits: isAdmin
    .input(z.object({
      tokenLimit: z.number().int().positive().nullable(),
    }))
    .mutation(async ({ input }) => {
      const result = await prisma.user.updateMany({
        data: { tokenLimit: input.tokenLimit },
      });
      return { updated: result.count };
    }),

  // Global usage stats
  globalStats: isAdmin
    .query(async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [userCount, allTime, thisMonth, today] = await Promise.all([
        prisma.user.count(),
        prisma.usageLog.aggregate({
          _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costCents: true },
          _count: true,
        }),
        prisma.usageLog.aggregate({
          where: { createdAt: { gte: monthStart } },
          _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costCents: true },
          _count: true,
        }),
        prisma.usageLog.aggregate({
          where: { createdAt: { gte: dayStart } },
          _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costCents: true },
          _count: true,
        }),
      ]);

      return { userCount, allTime, thisMonth, today };
    }),

  // Top users by usage this month
  topUsers: isAdmin
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
    .query(async ({ input }) => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const topUsers = await prisma.usageLog.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: monthStart } },
        _sum: { totalTokens: true, costCents: true },
        _count: true,
        orderBy: { _sum: { totalTokens: 'desc' } },
        take: input?.limit ?? 10,
      });

      // Fetch user details
      const userIds = topUsers.map(u => u.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, tokenLimit: true },
      });
      const userMap = new Map(users.map(u => [u.id, u]));

      return topUsers.map(entry => ({
        ...entry,
        user: userMap.get(entry.userId) ?? null,
      }));
    }),
});
