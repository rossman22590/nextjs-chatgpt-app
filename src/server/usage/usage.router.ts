import * as z from 'zod/v4';

import { createTRPCRouter, protectedProcedure } from '~/server/trpc/trpc.server';
import { prisma } from '~/server/prisma/prisma-client';

import { checkUserAllowance } from './usage.allowance';
import { planWeeklyTokens, WEEKLY_WINDOW_MS } from './usage.plans';

export const usageRouter = createTRPCRouter({
  // Log token usage after an AI response completes
  logUsage: protectedProcedure
    .input(
      z.object({
        modelId: z.string(),
        vendorId: z.string().optional(),
        serviceName: z.string().optional(),
        inputTokens: z.number().int().min(0),
        outputTokens: z.number().int().min(0),
        costCents: z.number().min(0).default(0),
        operation: z.string().default('chat'),
      }),
    )
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

  // Check if user is within the weekly (rolling 7-day) plan limit - call before AI request
  // Pass modelId to also validate the per-model-family cap (Fable / GPT Sol / GPT Pro)
  checkLimit: protectedProcedure.input(z.object({ modelId: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
    return checkUserAllowance(ctx.session.user.id, input?.modelId);
  }),

  // Get own usage summary (for non-admin users to see their own stats)
  myUsage: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(Date.now() - WEEKLY_WINDOW_MS);

    const [thisWeek, thisMonth, allowance] = await Promise.all([
      prisma.usageLog.aggregate({
        where: { userId, createdAt: { gte: weekStart } },
        _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costCents: true },
        _count: true,
      }),
      prisma.usageLog.aggregate({
        where: { userId, createdAt: { gte: monthStart } },
        _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costCents: true },
        _count: true,
      }),
      checkUserAllowance(userId),
    ]);

    return {
      thisWeek,
      thisMonth,
      plan: allowance.plan,
      planLabel: allowance.planLabel,
      weeklyLimit: allowance.limit,
      weeklyUsed: allowance.used,
      weeklyRemaining: allowance.remaining,
      // per-model-family weekly usage/limits (Fable / GPT Pro / Sol)
      modelGroups: allowance.modelGroups,
      // rolling 5-hour session window (burst protection)
      session: allowance.session,
      // reference for unlimited (admin) accounts: lets the UI draw a meaningful bar
      planWeeklyDefault: planWeeklyTokens(allowance.plan),
      reason: allowance.reason,
      isActive: allowance.isActive,
    };
  }),

  // Get own recent usage logs (deductions)
  myLogs: protectedProcedure.input(z.object({ limit: z.number().min(1).max(100).default(30) }).optional()).query(async ({ ctx, input }) => {
    return prisma.usageLog.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' },
      take: input?.limit ?? 30,
    });
  }),

  // Get monthly usage history (last N months) for profile analytics
  myMonthlyHistory: protectedProcedure.input(z.object({ months: z.number().min(1).max(24).default(6) }).optional()).query(async ({ ctx, input }) => {
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
