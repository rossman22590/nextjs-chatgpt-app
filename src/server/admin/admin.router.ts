import * as z from 'zod/v4';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';

import { ADMIN_EMAILS, isAdminEmail } from '~/common/auth/adminEmails';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/trpc/trpc.server';
import { prisma } from '~/server/prisma/prisma-client';
import { planLabel, planWeeklyTokens, USER_PLAN_IDS, WEEKLY_WINDOW_MS } from '~/server/usage/usage.plans';
import { adminBannerInputSchema, isAllowedBannerUrl, readAdminBanner, readPublicAdminBanner, writeAdminBanner } from './admin.banner';
import { readDisabledModels, writeDisabledModels } from './admin.models';
import { getSystemPersonaSeedRows } from './system-personas.seed';

/**
 * Effective WEEKLY limit for display: mirrors checkUserAllowance (usage.allowance.ts).
 * tokenLimit: 0 = blocked (no credits), null = plan default, > 0 = custom override. Admin = null (unlimited).
 */
function effectiveWeeklyLimit(user: { email: string | null; plan: string; tokenLimit: number | null }): number | null {
  if (isAdminEmail(user.email)) return null;
  if (user.tokenLimit === 0) return 0;
  if (user.tokenLimit != null && user.tokenLimit > 0) return user.tokenLimit;
  return planWeeklyTokens(user.plan);
}

// Middleware: ensure the caller is the admin
const isAdmin = protectedProcedure.use(async ({ ctx, next }) => {
  if (!isAdminEmail(ctx.session.user.email)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  return next({ ctx });
});

const systemPersonaIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_-]+$/);

const systemPersonaExampleSchema = z.union([
  z.string().trim().min(1).max(500),
  z.object({
    prompt: z.string().trim().min(1).max(500),
    action: z.enum(['require-data-attachment']).optional(),
  }),
]);

const systemPersonaInputSchema = z.object({
  id: systemPersonaIdSchema.optional(),
  title: z.string().trim().min(1).max(120),
  description: z.string().max(500).optional(),
  systemMessage: z.string().min(1),
  systemMessageNotes: z.string().max(1000).optional(),
  symbol: z.string().max(32).optional(),
  imageUri: z.string().max(500).optional(),
  examples: z.array(systemPersonaExampleSchema).max(20).optional(),
  highlighted: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const systemPersonaUpdateSchema = systemPersonaInputSchema.extend({
  id: systemPersonaIdSchema,
});

function textOrNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function slugifySystemPersonaId(title: string): string {
  return (
    title
      .trim()
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'Persona'
  );
}

function systemPersonaData(input: z.infer<typeof systemPersonaInputSchema>) {
  return {
    title: input.title,
    description: textOrNull(input.description),
    systemMessage: input.systemMessage,
    systemMessageNotes: textOrNull(input.systemMessageNotes),
    symbol: textOrNull(input.symbol),
    imageUri: textOrNull(input.imageUri),
    examples: (input.examples ?? []) as Prisma.InputJsonValue,
    highlighted: input.highlighted ?? false,
    isActive: input.isActive ?? true,
  };
}

function systemPersonaSeedRowToPublic(row: ReturnType<typeof getSystemPersonaSeedRows>[number]) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    systemMessage: row.systemMessage,
    systemMessageNotes: row.systemMessageNotes,
    symbol: row.symbol,
    imageUri: row.imageUri,
    examples: row.examples ?? null,
    highlighted: row.highlighted,
    call: row.call ?? null,
    voices: row.voices ?? null,
    sortOrder: row.sortOrder,
  };
}

export const adminRouter = createTRPCRouter({
  getBanner: publicProcedure.query(async () => {
    return readPublicAdminBanner();
  }),

  // Public: the list of admin-disabled model ids, read by every client to filter its model selector
  getDisabledModels: publicProcedure.query(async () => {
    const { disabledIds } = await readDisabledModels();
    return { disabledIds };
  }),

  // Admin: full disabled-models record (with metadata) for the management panel
  getDisabledModelsAdmin: isAdmin.query(async () => {
    return readDisabledModels();
  }),

  // Admin: turn one or many models on/off. disabled=true adds them, false removes them.
  setModelsDisabled: isAdmin
    .input(z.object({
      modelIds: z.array(z.string().min(1).max(200)).min(1).max(2000),
      disabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const current = new Set((await readDisabledModels()).disabledIds);
      for (const id of input.modelIds) {
        if (input.disabled) current.add(id);
        else current.delete(id);
      }
      return writeDisabledModels(Array.from(current), ctx.session.user.id);
    }),

  listActiveSystemPersonas: publicProcedure.query(async () => {
    try {
      const personas = await prisma.systemPersona.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
        select: {
          id: true,
          title: true,
          description: true,
          systemMessage: true,
          systemMessageNotes: true,
          symbol: true,
          imageUri: true,
          examples: true,
          highlighted: true,
          call: true,
          voices: true,
          sortOrder: true,
        },
      });

      return personas;
    } catch (error) {
      console.warn('listActiveSystemPersonas: falling back to bundled personas', error);
    }

    return getSystemPersonaSeedRows()
      .filter((row) => row.isActive)
      .map(systemPersonaSeedRowToPublic);
  }),

  // Check if current user is admin (lightweight, for UI gating)
  isAdmin: protectedProcedure.query(({ ctx }) => {
    return { isAdmin: isAdminEmail(ctx.session.user.email) };
  }),

  getAdminBanner: isAdmin.query(async () => {
    return readAdminBanner();
  }),

  setAdminBanner: isAdmin.input(adminBannerInputSchema).mutation(async ({ input, ctx }) => {
    if (input.enabled && !input.message.trim()) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Banner message is required when the banner is live' });
    if (!isAllowedBannerUrl(input.ctaUrl)) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Banner link must be a relative path or an http(s) URL' });

    return writeAdminBanner(input, ctx.session.user.id);
  }),

  // List all users with usage stats: this month's, rolling 7-day (the enforced window), and all-time
  listUsers: isAdmin.query(async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(Date.now() - WEEKLY_WINDOW_MS);

    const [users, monthlyUsage, weeklyUsage, allTimeUsage] = await Promise.all([
      prisma.user.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          isActive: true,
          plan: true,
          tokenLimit: true,
          _count: { select: { conversations: true, messages: true, usageLogs: true } },
        },
      }),
      prisma.usageLog.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: monthStart } },
        _sum: { totalTokens: true, inputTokens: true, outputTokens: true, costCents: true },
        _count: true,
      }),
      prisma.usageLog.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: weekStart } },
        _sum: { totalTokens: true, inputTokens: true, outputTokens: true, costCents: true },
        _count: true,
      }),
      prisma.usageLog.groupBy({
        by: ['userId'],
        _sum: { totalTokens: true, inputTokens: true, outputTokens: true, costCents: true },
        _count: true,
        _max: { createdAt: true },
      }),
    ]);

    const usageMap = new Map(monthlyUsage.map((u) => [u.userId, u]));
    const weekMap = new Map(weeklyUsage.map((u) => [u.userId, u]));
    const allTimeUsageMap = new Map(allTimeUsage.map((u) => [u.userId, u]));

    return users.map((user) => ({
      ...user,
      planLabel: planLabel(user.plan),
      effectiveWeeklyLimit: effectiveWeeklyLimit(user),
      monthUsage: usageMap.get(user.id) ?? null,
      weekUsage: weekMap.get(user.id) ?? null,
      allTimeUsage: allTimeUsageMap.get(user.id) ?? null,
    }));
  }),

  // Get usage summary for a specific user (rolling week + current month + all time)
  getUserUsage: isAdmin.input(z.object({ userId: z.string() })).query(async ({ input }) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(Date.now() - WEEKLY_WINDOW_MS);

    const [allTime, thisMonth, thisWeek, user] = await Promise.all([
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
      prisma.usageLog.aggregate({
        where: { userId: input.userId, createdAt: { gte: weekStart } },
        _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costCents: true },
        _count: true,
      }),
      prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, name: true, email: true, image: true, isActive: true, plan: true, tokenLimit: true },
      }),
    ]);

    return {
      user: user ? { ...user, planLabel: planLabel(user.plan), effectiveWeeklyLimit: effectiveWeeklyLimit(user) } : null,
      allTime,
      thisMonth,
      thisWeek,
    };
  }),

  // Get recent usage logs for a user
  getUserLogs: isAdmin
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(200).default(50),
      }),
    )
    .query(async ({ input }) => {
      return prisma.usageLog.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
    }),

  // Set the subscription plan for a user (drives the weekly token limit when tokenLimit is null)
  setUserPlan: isAdmin
    .input(
      z.object({
        userId: z.string(),
        plan: z.enum(USER_PLAN_IDS),
      }),
    )
    .mutation(async ({ input }) => {
      return prisma.user.update({
        where: { id: input.userId },
        data: { plan: input.plan },
        select: { id: true, email: true, plan: true },
      });
    }),

  // Set the weekly token limit for a user (0 = blocked, null = plan default, > 0 = custom override)
  setTokenLimit: isAdmin
    .input(
      z.object({
        userId: z.string(),
        tokenLimit: z.number().int().nonnegative().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const existingUser = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
      });

      if (isAdminEmail(existingUser?.email)) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Admin token limit cannot be changed' });

      return prisma.user.update({
        where: { id: input.userId },
        data: { tokenLimit: input.tokenLimit },
        select: { id: true, email: true, tokenLimit: true },
      });
    }),

  // Toggle whether a user can chat
  setUserActive: isAdmin
    .input(
      z.object({
        userId: z.string(),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      const existingUser = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
      });

      if (isAdminEmail(existingUser?.email)) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Admin account is always active' });

      return prisma.user.update({
        where: { id: input.userId },
        data: { isActive: input.isActive },
        select: { id: true, email: true, isActive: true },
      });
    }),

  // Bulk set token limit for ALL users
  setAllTokenLimits: isAdmin
    .input(
      z.object({
        tokenLimit: z.number().int().nonnegative().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await prisma.user.updateMany({
        where: { NOT: { email: { in: [...ADMIN_EMAILS], mode: 'insensitive' } } },
        data: { tokenLimit: input.tokenLimit },
      });
      return { updated: result.count };
    }),

  // Global usage stats
  globalStats: isAdmin.query(async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [userCount, inactiveUserCount, zeroCreditUsersCount, planDefaultUsersCount, premiumUsersCount, ultraUsersCount, allTime, thisMonth, today] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { tokenLimit: 0 } }),
      prisma.user.count({ where: { tokenLimit: null } }),
      prisma.user.count({ where: { plan: 'PREMIUM' } }),
      prisma.user.count({ where: { plan: 'ULTRA' } }),
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

    return {
      userCount,
      userStatus: {
        active: userCount - inactiveUserCount,
        inactive: inactiveUserCount,
        zeroCredit: zeroCreditUsersCount,
        planDefault: planDefaultUsersCount, // tokenLimit null: weekly allowance comes from their plan
        overridden: userCount - zeroCreditUsersCount - planDefaultUsersCount, // custom weekly override (> 0)
      },
      plans: {
        premium: premiumUsersCount,
        ultra: ultraUsersCount,
      },
      allTime,
      thisMonth,
      today,
    };
  }),

  usageOverview: isAdmin.query(async () => {
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const logs = await prisma.usageLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 3000,
      select: {
        id: true,
        userId: true,
        modelId: true,
        vendorId: true,
        operation: true,
        totalTokens: true,
        costCents: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    const daily = new Map<string, { date: string; tokens: number; costCents: number; requests: number; users: Set<string> }>();
    for (let offset = 13; offset >= 0; offset--) {
      const day = new Date();
      day.setDate(day.getDate() - offset);
      const date = day.toISOString().slice(0, 10);
      daily.set(date, { date, tokens: 0, costCents: 0, requests: 0, users: new Set<string>() });
    }

    const models = new Map<string, { modelId: string; vendorId: string | null; tokens: number; costCents: number; requests: number }>();
    const operations = new Map<string, { operation: string; tokens: number; costCents: number; requests: number }>();
    const activeUsers = new Set<string>();

    for (const log of logs) {
      const date = log.createdAt.toISOString().slice(0, 10);
      const day = daily.get(date);
      if (day) {
        day.tokens += log.totalTokens;
        day.costCents += log.costCents;
        day.requests += 1;
        day.users.add(log.userId);
      }

      const modelKey = `${log.vendorId || 'unknown'}:${log.modelId || 'unknown'}`;
      const model = models.get(modelKey) ?? { modelId: log.modelId || 'unknown', vendorId: log.vendorId, tokens: 0, costCents: 0, requests: 0 };
      model.tokens += log.totalTokens;
      model.costCents += log.costCents;
      model.requests += 1;
      models.set(modelKey, model);

      const operationKey = log.operation || 'chat';
      const operation = operations.get(operationKey) ?? { operation: operationKey, tokens: 0, costCents: 0, requests: 0 };
      operation.tokens += log.totalTokens;
      operation.costCents += log.costCents;
      operation.requests += 1;
      operations.set(operationKey, operation);

      activeUsers.add(log.userId);
    }

    return {
      since,
      activeUsers: activeUsers.size,
      daily: Array.from(daily.values()).map((day) => ({ ...day, users: day.users.size })),
      topModels: Array.from(models.values())
        .sort((a, b) => b.tokens - a.tokens)
        .slice(0, 8),
      operations: Array.from(operations.values()).sort((a, b) => b.tokens - a.tokens),
      recent: logs.slice(0, 40),
    };
  }),

  // Top users by usage this month
  topUsers: isAdmin.input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional()).query(async ({ input }) => {
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
    const userIds = topUsers.map((u) => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, image: true, isActive: true, plan: true, tokenLimit: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return topUsers.map((entry) => ({
      ...entry,
      user: userMap.get(entry.userId) ?? null,
    }));
  }),

  listSystemPersonas: isAdmin.query(async () => {
    return prisma.systemPersona.findMany({
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }),

  createSystemPersona: isAdmin.input(systemPersonaInputSchema).mutation(async ({ input }) => {
    const id = input.id ?? slugifySystemPersonaId(input.title);
    const sortOrder = await prisma.systemPersona.count();

    try {
      return await prisma.systemPersona.create({
        data: {
          id,
          ...systemPersonaData(input),
          sortOrder,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new TRPCError({ code: 'CONFLICT', message: 'A persona with this ID already exists' });
      throw error;
    }
  }),

  updateSystemPersona: isAdmin.input(systemPersonaUpdateSchema).mutation(async ({ input }) => {
    const { count } = await prisma.systemPersona.updateMany({
      where: { id: input.id },
      data: systemPersonaData(input),
    });

    if (count !== 1) throw new TRPCError({ code: 'NOT_FOUND', message: 'System persona not found' });

    return prisma.systemPersona.findUniqueOrThrow({ where: { id: input.id } });
  }),

  deleteSystemPersona: isAdmin.input(z.object({ id: systemPersonaIdSchema })).mutation(async ({ input }) => {
    const { count } = await prisma.systemPersona.deleteMany({ where: { id: input.id } });
    if (count !== 1) throw new TRPCError({ code: 'NOT_FOUND', message: 'System persona not found' });
    return { success: true };
  }),

  seedSystemPersonas: isAdmin.mutation(async () => {
    const rows = getSystemPersonaSeedRows();

    await prisma.$transaction(
      rows.map((row) => {
        const { id, ...data } = row;
        return prisma.systemPersona.upsert({
          where: { id },
          create: { id, ...data },
          update: data,
        });
      }),
    );

    return { upserted: rows.length };
  }),
});
