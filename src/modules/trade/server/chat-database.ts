import { z } from 'zod';
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
    const userId = ctx.session.user.id;
    
    try {
      const conversation = await prisma.conversation.upsert({
        where: { id: input.id },
        update: {
          title: input.title,
          autoTitle: input.autoTitle,
          userSymbol: input.userSymbol,
          systemPurposeId: input.systemPurposeId,
          isArchived: input.isArchived,
          updated: input.updated ? new Date(input.updated) : new Date(),
        },
        create: {
          id: input.id,
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
      throw new Error('Failed to save conversation');
    }
  });

/**
 * Save a message to the database
 */
export const saveMessageProcedure = protectedProcedure
  .input(saveMessageSchema)
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    
    try {
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

      console.log(`✅ Saved message ${input.id} to database`);
      return { success: true, messageId: message.id };
    } catch (error) {
      console.error('❌ Error saving message:', error);
      throw new Error('Failed to save message');
    }
  });

/**
 * Get all conversations for the authenticated user
 */
export const getUserConversationsProcedure = protectedProcedure
  .input(getConversationsSchema)
  .query(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    
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
    const userId = ctx.session.user.id;
    
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
    const userId = ctx.session.user.id;
    
    try {
      await prisma.$transaction(async (tx) => {
        // Save conversation
        await tx.conversation.upsert({
          where: { id: input.conversation.id },
          update: {
            title: input.conversation.title,
            autoTitle: input.conversation.autoTitle,
            userSymbol: input.conversation.userSymbol,
            systemPurposeId: input.conversation.systemPurposeId,
            isArchived: input.conversation.isArchived,
            updated: input.conversation.updated ? new Date(input.conversation.updated) : new Date(),
          },
          create: {
            id: input.conversation.id,
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

        // Save all messages
        for (const messageData of input.messages) {
          await tx.message.upsert({
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
              conversationId: messageData.conversationId,
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
        }
      });

      console.log(`✅ Saved complete conversation ${input.conversation.id} with ${input.messages.length} messages`);
      return { success: true, conversationId: input.conversation.id, messageCount: input.messages.length };
    } catch (error) {
      console.error('❌ Error saving complete conversation:', error);
      throw new Error('Failed to save complete conversation');
    }
  }); 