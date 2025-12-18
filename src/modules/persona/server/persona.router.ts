import { z } from 'zod';

import { createTRPCRouter } from '~/server/trpc/trpc.server';
import { protectedProcedure } from '~/server/trpc/trpc.server';
import { prisma } from '~/server/prisma/prisma-client';

const personaInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().max(200).optional(),
  description: z.string().max(280).optional(),
  systemPrompt: z.string().min(1),
  // allow multi-codepoint emojis and short labels
  symbol: z.string().max(32).optional(),
  pictureUrl: z.string().url().optional(),
  instructionHints: z.any().optional(),
  data: z.any().optional(),
  aiSettings: z.any().optional(),
  inputProvenance: z.any().optional(),
  inputText: z.string().optional(),
  llmLabel: z.string().optional(),
});

const personaUpdateSchema = personaInputSchema.extend({
  id: z.string().uuid(),
}).omit({ systemPrompt: true }).partial().extend({
  systemPrompt: z.string().min(1), // systemPrompt is required
});

export const personaRouter = createTRPCRouter({
  /** Create a new persona for the authenticated user */
  create: protectedProcedure
    .input(personaInputSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const persona = await prisma.persona.create({
        data: {
          id: input.id,
          userId,
          name: input.name,
          description: input.description,
          systemPrompt: input.systemPrompt,
          symbol: input.symbol,
          pictureUrl: input.pictureUrl,
          instructionHints: input.instructionHints as any,
          data: input.data as any,
          aiSettings: input.aiSettings as any,
          inputProvenance: input.inputProvenance as any,
          inputText: input.inputText,
          llmLabel: input.llmLabel,
        },
      });

      return persona;
    }),

  /** List personas for the authenticated user */
  list: protectedProcedure
    .output(z.array(z.object({
      id: z.string(),
      name: z.string().nullable(),
      description: z.string().nullable(),
      systemPrompt: z.string(),
      symbol: z.string().nullable(),
      pictureUrl: z.string().nullable(),
      instructionHints: z.any().nullable(),
      data: z.any().nullable(),
      aiSettings: z.any().nullable(),
      inputProvenance: z.any().nullable(),
      inputText: z.string().nullable(),
      llmLabel: z.string().nullable(),
      created: z.date(),
      updated: z.date(),
    })))
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const personas = await prisma.persona.findMany({
        where: { userId },
        orderBy: { updated: 'desc' },
      });
      return personas.map(p => ({
        id: p.id,
        name: p.name ?? null,
        description: p.description ?? null,
        systemPrompt: p.systemPrompt,
        symbol: p.symbol ?? null,
        pictureUrl: p.pictureUrl ?? null,
        instructionHints: (p.instructionHints as any) ?? null,
        data: (p.data as any) ?? null,
        aiSettings: (p.aiSettings as any) ?? null,
        inputProvenance: (p.inputProvenance as any) ?? null,
        inputText: p.inputText ?? null,
        llmLabel: p.llmLabel ?? null,
        created: p.created,
        updated: p.updated,
      }));
    }),

  /** Update an existing persona (ownership enforced) */
  update: protectedProcedure
    .input(personaUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const { count } = await prisma.persona.updateMany({
        where: { id: input.id, userId },
        data: {
          name: input.name,
          systemPrompt: input.systemPrompt!,
          description: input.description,
          symbol: input.symbol,
          pictureUrl: input.pictureUrl,
          instructionHints: input.instructionHints as any,
          data: input.data as any,
          aiSettings: input.aiSettings as any,
          inputProvenance: input.inputProvenance as any,
          inputText: input.inputText,
          llmLabel: input.llmLabel,
        },
      });

      if (count !== 1)
        throw new Error('Persona not found or not owned by user');

      return { success: true };
    }),

  /** Delete a persona (soft delete not needed; hard delete with ownership) */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const { count } = await prisma.persona.deleteMany({ where: { id: input.id, userId } });
      if (count !== 1)
        throw new Error('Persona not found or not owned by user');
      return { success: true };
    }),
});
