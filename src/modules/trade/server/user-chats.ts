import { z } from 'zod';
import { LinkStorageDataType } from '@prisma/client';

import { prisma } from '~/server/prisma/prisma-client';
import { protectedProcedure } from '~/server/trpc/trpc.server';
import { ADMIN_BANNER_STORAGE_TITLE } from '~/server/admin/admin.banner';

/**
 * Returns all chat objects for the authenticated user
 */
export const listUserChatsProcedure = 
  protectedProcedure
    .output(z.array(z.object({
      objectId: z.string(),
      dataTitle: z.string().nullable(),
      dataObject: z.any(),
      createdAt: z.date(),
      updatedAt: z.date(),
      expiresAt: z.date().nullable(),
    })))
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      // Fetch all chat entries for the user
      const chats = await prisma.linkStorage.findMany({
        select: {
          id: true,
          dataTitle: true,
          data: true,
          createdAt: true,
          updatedAt: true,
          expiresAt: true,
        },
        where: {
          ownerId: userId,
          dataType: LinkStorageDataType.CHAT_V1,
          OR: [{ dataTitle: null }, { dataTitle: { not: ADMIN_BANNER_STORAGE_TITLE } }],
          isDeleted: false,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return chats.map((chat: any) => ({
        objectId: chat.id,
        dataTitle: chat.dataTitle,
        dataObject: chat.data,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        expiresAt: chat.expiresAt,
      }));
    });
