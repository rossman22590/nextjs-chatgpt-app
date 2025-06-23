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
      console.log(`💾 Saving conversation "${conversation.userTitle || conversation.autoTitle || 'Untitled'}" to database...`);
      
      // First, save the conversation metadata
      const conversationResult = await apiAsyncNode.trade.saveConversation.mutate({
        id: conversation.id,
        title: conversation.userTitle,
        autoTitle: conversation.autoTitle,
        userSymbol: conversation.userSymbol,
        systemPurposeId: conversation.systemPurposeId || 'Generic',
        isArchived: conversation.isArchived || false,
        isIncognito: conversation._isIncognito || false,
        created: conversation.created,
        updated: conversation.updated || undefined,
      });
      
      if (conversationResult.success) {
        console.log(`✅ Conversation saved to database`);
        
        // Then, save all messages in the conversation
        if (conversation.messages && conversation.messages.length > 0) {
          for (const message of conversation.messages) {
            try {
              // Check if message is actually complete - if it has content and no placeholder fragments, it's complete
              const hasRealContent = message.fragments && message.fragments.length > 0 && 
                message.fragments.some(f => f.ft === 'content' || f.ft === 'attachment');
              const isActuallyComplete = hasRealContent && !message.pendingIncomplete;
              
              await apiAsyncNode.trade.saveMessage.mutate({
                id: message.id,
                conversationId: conversation.id,
                role: convertMessageRole(message.role),
                content: message.fragments, // Store fragments as JSON
                purposeId: message.purposeId,
                metadata: message.metadata,
                userFlags: message.userFlags || [],
                tokenCount: message.tokenCount || 0,
                generator: message.generator,
                pendingIncomplete: !isActuallyComplete, // Force false if message has real content
                created: message.created,
                updated: message.updated || undefined, // Convert null to undefined
              });
              
              console.log(`💬 Saved message ${message.id} (${message.role})`);
            } catch (messageError) {
              console.error(`❌ Error saving message ${message.id}:`, messageError);
            }
          }
          
          console.log(`✅ Saved ${conversation.messages.length} messages for conversation "${conversation.userTitle || conversation.autoTitle || 'Untitled'}"`);
        }
        
        // Update sync metadata
        syncedConversationsRef.current.set(conversation.id, {
          localId: conversation.id,
          cloudId: conversation.id, // Using the same ID for simplicity
          lastSyncedAt: Date.now()
        });
        
        return true;
      }
    } catch (error) {
      console.error('❌ Error saving conversation to database:', error);
      return false;
    }
    
    return false;
  }, []);
  
  // Function to load conversations from the new database structure
  const loadConversationsFromDatabase = useCallback(async () => {
    if (!session?.user?.email) {
      console.log('No user session, skipping database chat load');
      return;
    }
    
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
            
            console.log(`🔄 Updated existing conversation from database: ${cloudConversation.userTitle || cloudConversation.autoTitle || 'Untitled'}`);
          }
        }
      }
      
      // If we have new or updated chats, update the store
      if (hasNewChats) {
        useChatStore.setState({ conversations: Array.from(newConversationMap.values()) });
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
      console.log('User not authenticated, skipping database sync setup');
      return;
    }

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
          console.log(`⏳ Skipping sync for conversation with thinking/incomplete messages: "${conversation.userTitle || conversation.autoTitle || 'Untitled'}"`);
          return;
        }
        
        const syncData = syncMap.get(conversation.id);
        const conversationUpdatedAt = conversation.updated || conversation.created;
        
        // If we've never synced this conversation or it's been updated since last sync
        if (!syncData || (conversationUpdatedAt && conversationUpdatedAt > syncData.lastSyncedAt)) {
          console.log(`🚀 Auto-syncing conversation "${conversation.userTitle || conversation.autoTitle || 'Untitled'}" to database...`);
          
          const success = await saveConversationToDatabase(conversation);
          if (success) {
            console.log(`✅ Successfully synced conversation to database`);
          }
        }
      });
    }, 1000); // 1 second debounce to batch rapid changes
    
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
