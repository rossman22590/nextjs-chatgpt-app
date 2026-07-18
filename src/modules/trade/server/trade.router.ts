import { createTRPCRouter } from '~/server/trpc/trpc.server';

import { storageGetProcedure, storageMarkAsDeletedProcedure, storagePutProcedure, storageUpdateDeletionKeyProcedure } from './link';
import { listUserChatsProcedure } from './user-chats';
import { 
  saveConversationProcedure, 
  saveMessageProcedure, 
  getUserConversationsProcedure, 
  deleteConversationProcedure, 
  saveCompleteConversationProcedure 
} from './chat-database';

export const tradeRouter = createTRPCRouter({

  /**
   * Write an object to storage, and return the ID, owner, and deletion key
   */
  storagePut: storagePutProcedure,

  /**
   * Read a stored object by ID (optional owner)
   */
  storageGet: storageGetProcedure,

  /**
   * Delete a stored object by ID and deletion key
   */
  storageDelete: storageMarkAsDeletedProcedure,

  /**
   * Update the deletion Key of a stored object by ID and deletion key
   */
  storageUpdateDeletionKey: storageUpdateDeletionKeyProcedure,

  /**
   * Save a conversation to the database
   */
  saveConversation: saveConversationProcedure,

  /**
   * Save a message to the database
   */
  saveMessage: saveMessageProcedure,

  /**
   * Get all conversations for the authenticated user
   */
  getUserConversations: getUserConversationsProcedure,

  /**
   * Delete a conversation and all its messages
   */
  deleteConversation: deleteConversationProcedure,

  /**
   * Save a complete conversation with all its messages
   */
  saveCompleteConversation: saveCompleteConversationProcedure,

});
