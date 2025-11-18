import { useSession } from 'next-auth/react';
import { useEffect, useRef, useCallback } from 'react';

import { DConversation, DConversationId } from '~/common/stores/chat/chat.conversation';
import { DMessage } from '~/common/stores/chat/chat.message';
import { useChatStore } from '~/common/stores/chat/store-chats';
import { useAuthStore } from '~/common/state/store-appstate';
import { apiAsyncNode } from '~/common/util/trpc.client';
import { LinkStorageDataType } from '@prisma/client';
import { useShareLinkStore, useLinkStorageOwnerId } from '../link/store-share-link';

// Interface for tracking cloud-synced conversation metadata
interface CloudSyncMetadata {
  localId: DConversationId;
  cloudId: string;
  lastSyncedAt: number; // timestamp
}

/**
 * React hook for syncing chat conversations between local state and cloud storage.
 * 
 * Features:
 * - Auto-saves local conversations to cloud storage when they change
 * - Loads user chats from cloud storage when authenticated
 * - Maintains sync metadata to avoid unnecessary updates
 * - Saves individual conversations and messages to dedicated database tables
 * 
 * @returns Object containing sync status information and methods
 */
export const useChatCloudSync = () => {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const userId = session?.user?.id;
  
  // Access the auth store
  const { setUser, setAuthenticated } = useAuthStore();
  
  // Chat store for accessing conversations
  const conversations = useChatStore(state => state.conversations);
  
  // Link storage state
  const { linkStorageOwnerId, setLinkStorageOwnerId } = useLinkStorageOwnerId();
  
  // Track which conversations have been synced to avoid duplicate operations
  const syncedConversationsRef = useRef<Map<string, CloudSyncMetadata>>(new Map());
  const completedCountRef = useRef<Map<string, number>>(new Map());
  const periodicSyncRunningRef = useRef(false);
  
  // Helper function to convert DMessage role to database enum
  const convertMessageRole = (role: string): 'USER' | 'ASSISTANT' | 'SYSTEM' => {
    switch (role.toLowerCase()) {
      case 'user': return 'USER';
      case 'assistant': return 'ASSISTANT';
      case 'system': return 'SYSTEM';
      default: return 'USER';
    }
  };
  
  // Helper function to save a conversation to the new database structure
  const saveConversationToDatabase = useCallback(async (conversation: DConversation) => {
    if (!conversation || conversation._isIncognito) return;
    
    try {
      if (process.env.NODE_ENV !== 'production' && (process.env.DEBUG_CLOUD_SYNC === 'true' || process.env.NEXT_PUBLIC_DEBUG_CLOUD_SYNC === 'true'))
        console.log(`💾 Saving conversation "${conversation.userTitle || conversation.autoTitle || 'Untitled'}" (batched) to database...`);

      // Build payloads for batched save
      const conversationPayload = {
        id: conversation.id,
        title: conversation.userTitle,
        autoTitle: conversation.autoTitle,
        userSymbol: conversation.userSymbol,
        systemPurposeId: conversation.systemPurposeId || 'Generic',
        isArchived: conversation.isArchived || false,
        isIncognito: conversation._isIncognito || false,
        created: conversation.created,
        updated: conversation.updated || undefined,
      } as const;

      const messagesPayload = (conversation.messages || []).map((message): any => {
        const hasRealContent = message.fragments && message.fragments.length > 0 &&
          message.fragments.some(f => f.ft === 'content' || f.ft === 'attachment');
        const isActuallyComplete = hasRealContent && !message.pendingIncomplete;
        return {
          id: message.id,
          conversationId: conversation.id,
          role: convertMessageRole(message.role),
          content: message.fragments,
          purposeId: message.purposeId,
          metadata: message.metadata,
          userFlags: message.userFlags || [],
          tokenCount: message.tokenCount || 0,
          generator: message.generator,
          pendingIncomplete: !isActuallyComplete,
          created: message.created,
          updated: message.updated || undefined,
        };
      });

      // Try single batched request first
      try {
        const result = await apiAsyncNode.trade.saveCompleteConversation.mutate({
          conversation: conversationPayload,
          messages: messagesPayload,
        });

        if (result?.success) {
          if (process.env.NODE_ENV !== 'production' && (process.env.DEBUG_CLOUD_SYNC === 'true' || process.env.NEXT_PUBLIC_DEBUG_CLOUD_SYNC === 'true'))
            console.log(`✅ Saved conversation and ${messagesPayload.length} messages (batched)`);

          // Update sync metadata
          syncedConversationsRef.current.set(conversation.id, {
            localId: conversation.id,
            cloudId: conversation.id,
            lastSyncedAt: Date.now()
          });

          return true;
        }
      } catch (batchedError) {
        console.warn('⚠️ Batch save failed, falling back to per-message save:', batchedError);

        // Fallback: save conversation, then messages individually
        const conversationResult = await apiAsyncNode.trade.saveConversation.mutate(conversationPayload);
        if (conversationResult?.success) {
          for (const msg of messagesPayload) {
            try {
              await apiAsyncNode.trade.saveMessage.mutate(msg);
            } catch (msgErr) {
              console.error('❌ Fallback: error saving message', msg.id, msgErr);
            }
          }

          syncedConversationsRef.current.set(conversation.id, {
            localId: conversation.id,
            cloudId: conversation.id,
            lastSyncedAt: Date.now()
          });

          return true;
        }
      }
      // If neither batched nor fallback succeeded
      return false;
    } catch (error) {
      console.error('❌ Error saving conversation to database:', error);
      return false;
    }
  }, []);
  
  // Auto-sync immediately when a message completes in a conversation
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    conversations.forEach((conversation) => {
      if (!conversation || conversation._isIncognito) return;

      const completeCount = (conversation.messages || []).reduce((acc, m) => {
        const hasRealContent = !!(m.fragments && m.fragments.length && m.fragments.some(f => (f as any).ft === 'content' || (f as any).ft === 'attachment'));
        const complete = hasRealContent && !m.pendingIncomplete;
        return acc + (complete ? 1 : 0);
      }, 0);

      const prev = completedCountRef.current.get(conversation.id) || 0;
      if (completeCount > prev) {
        completedCountRef.current.set(conversation.id, completeCount);

        const last = syncedConversationsRef.current.get(conversation.id)?.lastSyncedAt || 0;
        const now = Date.now();
        if (now - last > 1500) {
          void saveConversationToDatabase(conversation);
        }
      }
    });
  }, [conversations, isAuthenticated, userId, saveConversationToDatabase]);

  // Periodic 30s sync as a safety net
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const interval = setInterval(() => {
      if (periodicSyncRunningRef.current) return;
      periodicSyncRunningRef.current = true;
      (async () => {
        try {
          for (const conversation of conversations) {
            if (!conversation || conversation._isIncognito) continue;
            const last = syncedConversationsRef.current.get(conversation.id)?.lastSyncedAt || 0;
            const updatedAt = conversation.updated || conversation.created;
            if (updatedAt > last) {
              await saveConversationToDatabase(conversation);
            }
          }
        } finally {
          periodicSyncRunningRef.current = false;
        }
      })();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, userId, conversations, saveConversationToDatabase]);

  // Function to load conversations from the new database structure
  const loadConversationsFromDatabase = useCallback(async () => {
    if (!session?.user?.email) {
      console.log('No user session, skipping database chat load');
      return;
    }
    
      if (process.env.NODE_ENV !== 'production' && (process.env.DEBUG_CLOUD_SYNC === 'true' || process.env.NEXT_PUBLIC_DEBUG_CLOUD_SYNC === 'true'))
        console.log('📚 Loading conversations from database...');
    
    try {
      // Fetch all user conversations from the new database structure
      const dbConversations = await apiAsyncNode.trade.getUserConversations.query({});
      
      if (!dbConversations || dbConversations.length === 0) {
        console.log('No conversations found in database');
        return;
      }
      
      // Convert database format back to DConversation format
      const { conversations: localConversations } = useChatStore.getState();
      const localConversationMap = new Map<string, DConversation>();
      localConversations.forEach(conversation => {
        localConversationMap.set(conversation.id, conversation);
      });
      
      let hasNewChats = false;
      const newConversationMap = new Map<string, DConversation>(localConversationMap);
      const syncMap = syncedConversationsRef.current;
      
      // Process each database conversation
      for (const dbConversation of dbConversations) {
        const existingConversation = localConversationMap.get(dbConversation.id);
        
        // Convert database conversation to DConversation format
        const cloudConversation: DConversation = {
          id: dbConversation.id,
          messages: dbConversation.messages.map((dbMsg: any): DMessage => {
            const fragments = dbMsg.content as any;
            // Check if message has real content (not just placeholders)
            const hasRealContent = fragments && fragments.length > 0 && 
              fragments.some((f: any) => f.ft === 'content' || f.ft === 'attachment');
            
            return {
              id: dbMsg.id,
              role: dbMsg.role.toLowerCase() as any,
              fragments: fragments, // Convert JSON back to fragments
              purposeId: dbMsg.purposeId || undefined,
              metadata: dbMsg.metadata as any,
              userFlags: dbMsg.userFlags as any,
              tokenCount: dbMsg.tokenCount,
              generator: dbMsg.generator as any,
              // Only mark as pending if it truly has no real content
              pendingIncomplete: dbMsg.pendingIncomplete && !hasRealContent ? true : undefined,
              created: new Date(dbMsg.created).getTime(),
              updated: dbMsg.updated ? new Date(dbMsg.updated).getTime() : null,
            };
          }),
          userTitle: dbConversation.title || undefined,
          autoTitle: dbConversation.autoTitle || undefined,
          userSymbol: dbConversation.userSymbol || undefined,
          systemPurposeId: dbConversation.systemPurposeId as any,
          isArchived: dbConversation.isArchived,
          _isIncognito: dbConversation.isIncognito,
          created: new Date(dbConversation.created).getTime(),
          updated: new Date(dbConversation.updated).getTime(),
          tokenCount: dbConversation.messages.reduce((sum: number, msg: any) => sum + msg.tokenCount, 0),
          _abortController: null,
        };
        
        if (!existingConversation) {
          // New conversation from database - add to local
          newConversationMap.set(cloudConversation.id, cloudConversation);
          hasNewChats = true;
          
          // Update sync metadata
          syncMap.set(cloudConversation.id, {
            localId: cloudConversation.id,
            cloudId: dbConversation.id,
            lastSyncedAt: Date.now()
          });
          
          if (process.env.NODE_ENV !== 'production' && (process.env.DEBUG_CLOUD_SYNC === 'true' || process.env.NEXT_PUBLIC_DEBUG_CLOUD_SYNC === 'true'))
            console.log(`📥 Added new conversation from database: ${cloudConversation.userTitle || cloudConversation.autoTitle || 'Untitled'}`);
        } else {
          // Conversation exists locally, check which is newer
          const localUpdatedAt = existingConversation.updated || existingConversation.created;
          const cloudUpdatedAt = cloudConversation.updated || cloudConversation.created;
          
          if (cloudUpdatedAt > localUpdatedAt) {
            // Cloud version is newer, update local
            newConversationMap.set(cloudConversation.id, cloudConversation);
            hasNewChats = true;
            
            // Update sync metadata
            syncMap.set(cloudConversation.id, {
              localId: cloudConversation.id,
              cloudId: dbConversation.id,
              lastSyncedAt: Date.now()
            });
            
            if (process.env.NODE_ENV !== 'production' && (process.env.DEBUG_CLOUD_SYNC === 'true' || process.env.NEXT_PUBLIC_DEBUG_CLOUD_SYNC === 'true'))
              console.log(`🔄 Updated existing conversation from database: ${cloudConversation.userTitle || cloudConversation.autoTitle || 'Untitled'}`);
          }
        }
      }
      
      // If we have new or updated chats, update the store
      if (hasNewChats) {
        useChatStore.setState({ conversations: Array.from(newConversationMap.values()) });
        if (process.env.NODE_ENV !== 'production' && (process.env.DEBUG_CLOUD_SYNC === 'true' || process.env.NEXT_PUBLIC_DEBUG_CLOUD_SYNC === 'true'))
          console.log(`✅ Updated local chat store with ${dbConversations.length} conversations from database`);
      }
      
    } catch (error) {
      console.error('❌ Error loading conversations from database:', error);
    }
  }, [session?.user?.email]);
  
  // Initial load and setup effect
  useEffect(() => {
    // Skip if not authenticated
    if (!isAuthenticated || !userId) {
      if (process.env.NODE_ENV !== 'production' && (process.env.DEBUG_CLOUD_SYNC === 'true' || process.env.NEXT_PUBLIC_DEBUG_CLOUD_SYNC === 'true'))
        console.log('User not authenticated, skipping database sync setup');
      return;
    }

    if (process.env.NODE_ENV !== 'production' && (process.env.DEBUG_CLOUD_SYNC === 'true' || process.env.NEXT_PUBLIC_DEBUG_CLOUD_SYNC === 'true'))
      console.log('🔧 Setting up database sync for authenticated user:', userId);
    
    // Initialize link storage owner ID if not already set
    if (!linkStorageOwnerId) {
      setLinkStorageOwnerId(userId);
    }
    
    // Load existing conversations from database when authenticated
    loadConversationsFromDatabase();
    
  }, [isAuthenticated, userId, linkStorageOwnerId, setLinkStorageOwnerId, loadConversationsFromDatabase]);
  
  // When user authenticates, update our state
  useEffect(() => {
    if (isAuthenticated && session?.user) {
      setUser(session.user);
      setAuthenticated(true);
      if (userId && userId !== linkStorageOwnerId) {
        setLinkStorageOwnerId(userId);
      }
    } else {
      setAuthenticated(false);
    }
  }, [isAuthenticated, session, userId, linkStorageOwnerId, setUser, setAuthenticated, setLinkStorageOwnerId]);
  
  // Watch for conversations that need to be synced to database
  useEffect(() => {
    // Only sync if user is authenticated
    if (!isAuthenticated || !userId) return;
    
    const syncMap = syncedConversationsRef.current;
    
    // Debounce sync operations to avoid hammering the server
    const debounceTimeout = setTimeout(() => {
      // Check each conversation to see if it needs syncing
      conversations.forEach(async (conversation) => {
        // Skip empty conversations or incognito conversations
        if (conversation.messages.length === 0 || conversation._isIncognito) return;
        
        // Skip conversations with incomplete messages (thinking animation/auto-title generation in progress)
        const hasIncompleteMessages = conversation.messages.some(msg => msg.pendingIncomplete);
        if (hasIncompleteMessages) {
          if (process.env.NODE_ENV !== 'production' && (process.env.DEBUG_CLOUD_SYNC === 'true' || process.env.NEXT_PUBLIC_DEBUG_CLOUD_SYNC === 'true'))
            console.log(`⏳ Skipping sync for conversation with thinking/incomplete messages: "${conversation.userTitle || conversation.autoTitle || 'Untitled'}"`);
          return;
        }
        
        const syncData = syncMap.get(conversation.id);
        const conversationUpdatedAt = conversation.updated || conversation.created;
        
        // If we've never synced this conversation or it's been updated since last sync
        if (!syncData || (conversationUpdatedAt && conversationUpdatedAt > syncData.lastSyncedAt)) {
          if (process.env.NODE_ENV !== 'production' && (process.env.DEBUG_CLOUD_SYNC === 'true' || process.env.NEXT_PUBLIC_DEBUG_CLOUD_SYNC === 'true'))
            console.log(`🚀 Auto-syncing conversation "${conversation.userTitle || conversation.autoTitle || 'Untitled'}" to database...`);
          
          const success = await saveConversationToDatabase(conversation);
          if (success) {
            if (process.env.NODE_ENV !== 'production' && (process.env.DEBUG_CLOUD_SYNC === 'true' || process.env.NEXT_PUBLIC_DEBUG_CLOUD_SYNC === 'true'))
              console.log(`✅ Successfully synced conversation to database`);
          }
        }
      });
    }, 3000); // Debounce more aggressively to reduce request load
    
    // Cleanup timeout on effect cleanup
    return () => clearTimeout(debounceTimeout);
    
  }, [conversations, isAuthenticated, userId, saveConversationToDatabase]);
  
  // Define sync status based on current state
  const syncStatus = {
    isEnabled: isAuthenticated,
    lastSync: syncedConversationsRef.current.size > 0 ? 
      Math.max(...Array.from(syncedConversationsRef.current.values()).map(s => s.lastSyncedAt)) : 
      null,
    syncedCount: syncedConversationsRef.current.size
  };
  
  // Return sync status and functions
  return {
    isAuthenticated,
    syncStatus,
    loadFromCloud: loadConversationsFromDatabase,
    syncToCloud: saveConversationToDatabase,
  };
};
