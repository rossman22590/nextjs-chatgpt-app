import * as z from 'zod/v4';
import { TRPCError } from '@trpc/server';

import { createTRPCRouter, protectedProcedure } from '~/server/trpc/trpc.server';
import { prisma } from '~/server/prisma/prisma-client';


export const usageRouter = createTRPCRouter({

  // Log token usage after an AI response completes
  logUsage: protectedProcedure
    .input(z.object({
      modelId: z.string(),
      vendorId: z.string().optional(),
      serviceName: z.string().optional(),
      inputTokens: z.number().int().min(0),
      outputTokens: z.number().int().min(0),
      costCents: z.number().min(0).default(0),
      operation: z.string().default('chat'),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const totalTokens = input.inputTokens + input.outputTokens;

      await prisma.usageLog.create({
        data: {
          userId,
          modelId: input.modelId,
          vendorId: input.vendorId,
          serviceName: input.serviceName,
          inputTokens: input.inputTokens,
          outputTokens: input.outputTokens,
          totalTokens,
          costCents: input.costCents,
          operation: input.operation,
        },
      });

      return { ok: true };
    }),

  // Check if user is within token limit (call before AI request)
  checkLimit: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tokenLimit: true },
      });

      // No limit set = unlimited
      if (!user?.tokenLimit)
        return { allowed: true, limit: null, used: 0, remaining: null };

      // Aggregate this month's usage
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const usage = await prisma.usageLog.aggregate({
        where: { userId, createdAt: { gte: monthStart } },
        _sum: { totalTokens: true },
      });

      const used = usage._sum.totalTokens ?? 0;
      const remaining = Math.max(0, user.tokenLimit - used);

      return {
        allowed: used < user.tokenLimit,
        limit: user.tokenLimit,
        used,
        remaining,
      };
    }),

  // Get own usage summary (for non-admin users to see their own stats)
  myUsage: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [thisMonth, user] = await Promise.all([
        prisma.usageLog.aggregate({
          where: { userId, createdAt: { gte: monthStart } },
          _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costCents: true },
          _count: true,
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { tokenLimit: true },
        }),
      ]);

      return {
        thisMonth,
        tokenLimit: user?.tokenLimit ?? null,
      };
    }),

  // Get own recent usage logs (deductions)
  myLogs: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      return prisma.usageLog.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: 'desc' },
        take: input?.limit ?? 30,
      });
    }),

  // Get monthly usage history (last N months) for profile analytics
  myMonthlyHistory: protectedProcedure
    .input(z.object({ months: z.number().min(1).max(24).default(6) }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const monthCount = input?.months ?? 6;
      const now = new Date();

      const months = [];
      for (let i = 0; i < monthCount; i++) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const agg = await prisma.usageLog.aggregate({
          where: { userId, createdAt: { gte: monthStart, lt: monthEnd } },
          _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costCents: true },
          _count: true,
        });

        months.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          year: monthStart.getFullYear(),
          monthIndex: monthStart.getMonth(),
          inputTokens: agg._sum.inputTokens ?? 0,
          outputTokens: agg._sum.outputTokens ?? 0,
          totalTokens: agg._sum.totalTokens ?? 0,
          costCents: agg._sum.costCents ?? 0,
          requests: agg._count,
        });
      }

      return months;
    }),
});
