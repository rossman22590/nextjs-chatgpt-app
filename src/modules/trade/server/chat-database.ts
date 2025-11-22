import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { randomUUID } from 'crypto';
import { MessageRole } from '@prisma/client';
import { prisma } from '~/server/prisma/prisma-client';
import { protectedProcedure } from '~/server/trpc/trpc.server';

// Zod schemas for input validation
const saveConversationSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  autoTitle: z.string().optional(),
  userSymbol: z.string().optional(),
  systemPurposeId: z.string().default('Generic'),
  isArchived: z.boolean().default(false),
  isIncognito: z.boolean().default(false),
  created: z.number(),
  updated: z.number().optional(),
});

const saveMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: z.enum(['USER', 'ASSISTANT', 'SYSTEM']),
  content: z.any(), // JSON content for message fragments
  purposeId: z.string().optional(),
  metadata: z.any().optional(), // JSON metadata
  userFlags: z.array(z.string()).default([]),
  tokenCount: z.number().default(0),
  generator: z.any().optional(), // JSON generator info
  pendingIncomplete: z.boolean().default(false),
  created: z.number(),
  updated: z.number().optional(),
});

const getConversationsSchema = z.object({
  limit: z.number().optional().default(50),
  offset: z.number().optional().default(0),
});

/**
 * Save a conversation to the database
 */
export const saveConversationProcedure = protectedProcedure
  .input(saveConversationSchema)
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session!.user.id;
    
    try {
      // Ownership guard: if conversation exists and isn't owned by user, auto-fork to a new ID
      const existing = await prisma.conversation.findUnique({ where: { id: input.id }, select: { userId: true } });
      const convIdToUse = existing && existing.userId !== userId ? randomUUID() : input.id;

      const conversation = existing && existing.userId !== userId
        ? await prisma.conversation.create({
          data: {
            id: convIdToUse,
            userId,
            title: input.title,
            autoTitle: input.autoTitle,
            userSymbol: input.userSymbol,
            systemPurposeId: input.systemPurposeId,
            isArchived: input.isArchived,
            isIncognito: input.isIncognito,
            created: new Date(input.created),
            updated: input.updated ? new Date(input.updated) : new Date(input.created),
          },
        })
        : await prisma.conversation.upsert({
          where: { id: convIdToUse },
          update: {
            title: input.title,
            autoTitle: input.autoTitle,
            userSymbol: input.userSymbol,
            systemPurposeId: input.systemPurposeId,
            isArchived: input.isArchived,
            updated: input.updated ? new Date(input.updated) : new Date(),
          },
          create: {
            id: convIdToUse,
            userId,
            title: input.title,
            autoTitle: input.autoTitle,
            userSymbol: input.userSymbol,
            systemPurposeId: input.systemPurposeId,
            isArchived: input.isArchived,
            isIncognito: input.isIncognito,
            created: new Date(input.created),
            updated: input.updated ? new Date(input.updated) : new Date(input.created),
          },
        });

      console.log(`✅ Saved conversation ${input.id} to database`);
      return { success: true, conversationId: conversation.id };
    } catch (error) {
      console.error('❌ Error saving conversation:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save conversation' });
    }
  });

/**
 * Save a message to the database
 */
export const saveMessageProcedure = protectedProcedure
  .input(saveMessageSchema)
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session!.user.id;
    
    try {
      // Verify conversation exists and is owned by the user
      const convo = await prisma.conversation.findUnique({ where: { id: input.conversationId }, select: { userId: true } });
      if (!convo || convo.userId !== userId)
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Conversation not found or not owned by user.' });

      // If message exists, ensure ownership and same conversation
      const existingMsg = await prisma.message.findUnique({ where: { id: input.id }, select: { userId: true, conversationId: true } });
      if (existingMsg && (existingMsg.userId !== userId || existingMsg.conversationId !== input.conversationId))
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Message not owned by user or mismatched conversation.' });

      const message = await prisma.message.upsert({
        where: { id: input.id },
        update: {
          content: input.content,
          purposeId: input.purposeId,
          metadata: input.metadata,
          userFlags: input.userFlags,
          tokenCount: input.tokenCount,
          generator: input.generator,
          pendingIncomplete: input.pendingIncomplete,
          updated: input.updated ? new Date(input.updated) : new Date(),
        },
        create: {
          id: input.id,
          conversationId: input.conversationId,
          userId,
          role: input.role as MessageRole,
          content: input.content,
          purposeId: input.purposeId,
          metadata: input.metadata,
          userFlags: input.userFlags,
          tokenCount: input.tokenCount,
          generator: input.generator,
          pendingIncomplete: input.pendingIncomplete,
          created: new Date(input.created),
          updated: input.updated ? new Date(input.updated) : undefined,
        },
      });

      if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_CLOUD_SYNC === 'true')
        console.log(`✅ Saved message ${input.id} to database`);
      return { success: true, messageId: message.id };
    } catch (error) {
      console.error('❌ Error saving message:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save message' });
    }
  });

/**
 * Get all conversations for the authenticated user
 */
export const getUserConversationsProcedure = protectedProcedure
  .input(getConversationsSchema)
  .query(async ({ input, ctx }) => {
    const userId = ctx.session!.user.id;
    
    try {
      const conversations = await prisma.conversation.findMany({
        where: { 
          userId,
          isIncognito: false, // Don't sync incognito conversations
        },
        include: {
          messages: {
            orderBy: { created: 'asc' },
          },
        },
        orderBy: { updated: 'desc' },
        take: input.limit,
        skip: input.offset,
      });

      console.log(`📚 Retrieved ${conversations.length} conversations from database`);
      return conversations;
    } catch (error) {
      console.error('❌ Error retrieving conversations:', error);
      throw new Error('Failed to retrieve conversations');
    }
  });

/**
 * Delete a conversation and all its messages
 */
export const deleteConversationProcedure = protectedProcedure
  .input(z.object({ conversationId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session!.user.id;
    
    try {
      // Verify ownership and delete
      await prisma.conversation.deleteMany({
        where: {
          id: input.conversationId,
          userId, // Ensure user owns the conversation
        },
      });

      console.log(`🗑️ Deleted conversation ${input.conversationId} from database`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      throw new Error('Failed to delete conversation');
    }
  });

/**
 * Save a complete conversation with all its messages in a single transaction
 */
export const saveCompleteConversationProcedure = protectedProcedure
  .input(z.object({
    conversation: saveConversationSchema,
    messages: z.array(saveMessageSchema),
  }))
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session!.user.id;

    try {
      // Determine conversation ID to use (auto-fork if existing belongs to another user)
      const existingConv = await prisma.conversation.findUnique({ where: { id: input.conversation.id }, select: { userId: true } });
      const convIdToUse = existingConv && existingConv.userId !== userId ? randomUUID() : input.conversation.id;

      if (existingConv && existingConv.userId !== userId) {
        await prisma.conversation.create({
          data: {
            id: convIdToUse,
            userId,
            title: input.conversation.title,
            autoTitle: input.conversation.autoTitle,
            userSymbol: input.conversation.userSymbol,
            systemPurposeId: input.conversation.systemPurposeId,
            isArchived: input.conversation.isArchived,
            isIncognito: input.conversation.isIncognito,
            created: new Date(input.conversation.created),
            updated: input.conversation.updated ? new Date(input.conversation.updated) : new Date(input.conversation.created),
          },
        });
      } else {
        await prisma.conversation.upsert({
          where: { id: convIdToUse },
          update: {
            title: input.conversation.title,
            autoTitle: input.conversation.autoTitle,
            userSymbol: input.conversation.userSymbol,
            systemPurposeId: input.conversation.systemPurposeId,
            isArchived: input.conversation.isArchived,
            updated: input.conversation.updated ? new Date(input.conversation.updated) : new Date(),
          },
          create: {
            id: convIdToUse,
            userId,
            title: input.conversation.title,
            autoTitle: input.conversation.autoTitle,
            userSymbol: input.conversation.userSymbol,
            systemPurposeId: input.conversation.systemPurposeId,
            isArchived: input.conversation.isArchived,
            isIncognito: input.conversation.isIncognito,
            created: new Date(input.conversation.created),
            updated: input.conversation.updated ? new Date(input.conversation.updated) : new Date(input.conversation.created),
          },
        });
      }

      if (!input.messages?.length)
        return { success: true, conversationId: convIdToUse, messageCount: 0 };

      // Find existing messages to detect collisions
      const ids = input.messages.map(m => m.id);
      const existingMsgs = await prisma.message.findMany({
        where: { id: { in: ids } },
        select: { id: true, userId: true, conversationId: true },
      });
      const existingMap = new Map(existingMsgs.map(m => [m.id, m] as const));

      // Chunked upserts to avoid long transactions
      const BATCH_SIZE = 25;
      for (let i = 0; i < input.messages.length; i += BATCH_SIZE) {
        const chunk = input.messages.slice(i, i + BATCH_SIZE);
        const ops = chunk.map(messageData => {
          const collision = messageData.id ? existingMap.get(messageData.id) : undefined;
          const isCollision = !!collision && (collision.userId !== userId || collision.conversationId !== convIdToUse);
          if (isCollision) {
            // Create new message (new ID auto-generated) under forked/current conversation
            const { id: _omit, conversationId: _omit2, ...rest } = messageData as any;
            return prisma.message.create({
              data: {
                ...rest,
                conversationId: convIdToUse,
                userId,
                role: messageData.role as MessageRole,
                created: new Date(messageData.created),
                updated: messageData.updated ? new Date(messageData.updated) : undefined,
              },
            });
          }
          // Upsert normally
          return prisma.message.upsert({
            where: { id: messageData.id },
            update: {
              content: messageData.content,
              purposeId: messageData.purposeId,
              metadata: messageData.metadata,
              userFlags: messageData.userFlags,
              tokenCount: messageData.tokenCount,
              generator: messageData.generator,
              pendingIncomplete: messageData.pendingIncomplete,
              updated: messageData.updated ? new Date(messageData.updated) : new Date(),
            },
            create: {
              id: messageData.id,
              conversationId: convIdToUse,
              userId,
              role: messageData.role as MessageRole,
              content: messageData.content,
              purposeId: messageData.purposeId,
              metadata: messageData.metadata,
              userFlags: messageData.userFlags,
              tokenCount: messageData.tokenCount,
              generator: messageData.generator,
              pendingIncomplete: messageData.pendingIncomplete,
              created: new Date(messageData.created),
              updated: messageData.updated ? new Date(messageData.updated) : undefined,
            },
          });
        });
        try {
          await prisma.$transaction(ops);
        } catch (txErr: any) {
          // Fallback: run sequential upserts when transaction times out or is unavailable
          const code = (txErr && (txErr.code || txErr?.meta?.code)) || '';
          if (code === 'P2028' || ('' + txErr?.message).toLowerCase().includes('transaction')) {
            for (const op of ops) {
              try { await op; } catch (opErr) { console.error('Upsert failed (sequential):', opErr); }
            }
          } else {
            throw txErr;
          }
        }
      }

      console.log(`✅ Saved complete conversation ${convIdToUse} with ${input.messages.length} messages`);
      return { success: true, conversationId: convIdToUse, messageCount: input.messages.length };
    } catch (error) {
      console.error('❌ Error saving complete conversation:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save complete conversation' });
    }
  }); 