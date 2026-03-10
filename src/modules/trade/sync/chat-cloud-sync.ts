import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef } from 'react';

import { DConversation, DConversationId } from '~/common/stores/chat/chat.conversation';
import { DMessage } from '~/common/stores/chat/chat.message';
import { useChatStore } from '~/common/stores/chat/store-chats';
import { useAuthStore } from '~/common/state/store-appstate';
import { apiAsyncNode } from '~/common/util/trpc.client';
import { useLinkStorageOwnerId } from '../link/store-share-link';


interface CloudSyncMetadata {
  localId: DConversationId;
  cloudId: string;
  lastSyncedAt: number;
}


const SYNC_DEBOUNCE_MS = 1000;
const REQUEUE_DEBOUNCE_MS = 250;
const CLOUD_LOAD_BATCH_SIZE = 50;


function convertMessageRole(role: string): 'USER' | 'ASSISTANT' | 'SYSTEM' {
  switch (role.toLowerCase()) {
    case 'user':
      return 'USER';
    case 'assistant':
      return 'ASSISTANT';
    case 'system':
      return 'SYSTEM';
    default:
      return 'USER';
  }
}


function hasRealMessageContent(message: DMessage): boolean {
  return !!message.fragments?.length
    && message.fragments.some(fragment => fragment.ft === 'content' || fragment.ft === 'attachment');
}


function isConversationSyncable(conversation: DConversation | undefined | null): conversation is DConversation {
  if (!conversation)
    return false;

  if (conversation._isIncognito || conversation.messages.length === 0)
    return false;

  return !conversation.messages.some(message => message.pendingIncomplete);
}


function getConversationSyncStamp(conversation: DConversation): number {
  let latest = conversation.updated || conversation.created || 0;

  for (const message of conversation.messages)
    latest = Math.max(latest, message.updated || message.created || 0);

  return latest;
}


function indexConversationStamps(conversations: DConversation[]): Map<string, number> {
  const indexed = new Map<string, number>();
  conversations.forEach(conversation => {
    indexed.set(conversation.id, getConversationSyncStamp(conversation));
  });
  return indexed;
}


function textFromMessage(message: DMessage | undefined): string {
  if (!message?.fragments?.length)
    return '';

  return message.fragments
    .map(fragment => {
      if (fragment.ft === 'content')
        return JSON.stringify(fragment.part ?? '');
      if (fragment.ft === 'attachment')
        return JSON.stringify(fragment.part ?? 'attachment');
      return '';
    })
    .join('|')
    .slice(0, 240);
}


function normalizeConversationTitle(conversation: DConversation): string {
  return (conversation.userTitle || conversation.autoTitle || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}


function duplicateConversationKey(conversation: DConversation): string {
  const firstMessage = conversation.messages[0];
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  return [
    normalizeConversationTitle(conversation),
    conversation.systemPurposeId,
    conversation.messages.length,
    firstMessage?.role || '',
    textFromMessage(firstMessage),
    lastMessage?.role || '',
    textFromMessage(lastMessage),
  ].join('::');
}


function scoreConversationForDisplay(conversation: DConversation): number {
  return (
    getConversationSyncStamp(conversation) * 10
    + conversation.messages.length
    + (conversation.userTitle ? 2 : 0)
    + (conversation.autoTitle ? 1 : 0)
  );
}


function dedupeConversationsForDisplay(conversations: DConversation[]): { visible: DConversation[]; hiddenIds: Set<string> } {
  const winners = new Map<string, DConversation>();
  const hiddenIds = new Set<string>();

  for (const conversation of conversations) {
    const key = duplicateConversationKey(conversation);
    const currentWinner = winners.get(key);
    if (!currentWinner) {
      winners.set(key, conversation);
      continue;
    }

    const candidateWins = scoreConversationForDisplay(conversation) > scoreConversationForDisplay(currentWinner);
    if (candidateWins) {
      hiddenIds.add(currentWinner.id);
      hiddenIds.delete(conversation.id);
      winners.set(key, conversation);
    } else {
      hiddenIds.add(conversation.id);
    }
  }

  return {
    visible: conversations.filter(conversation => !hiddenIds.has(conversation.id)),
    hiddenIds,
  };
}


export const useChatCloudSync = () => {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const userId = session?.user?.id;

  const { setUser, setAuthenticated } = useAuthStore();
  const conversations = useChatStore(state => state.conversations);
  const { linkStorageOwnerId, setLinkStorageOwnerId } = useLinkStorageOwnerId();

  const syncedConversationsRef = useRef<Map<string, CloudSyncMetadata>>(new Map());
  const observedConversationStampsRef = useRef<Map<string, number>>(new Map());
  const syncDebounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const syncInFlightRef = useRef<Set<string>>(new Set());
  const syncPendingRef = useRef<Set<string>>(new Set());
  const hydrationCompleteRef = useRef(false);
  const hydrationInFlightRef = useRef(false);
  const scheduleConversationSyncRef = useRef<((conversationId: string, delayMs?: number) => void) | null>(null);

  const saveConversationToDatabase = useCallback(async (conversation: DConversation) => {
    if (!isConversationSyncable(conversation))
      return false;

    try {
      console.log(`[cloud-sync] Saving conversation "${conversation.userTitle || conversation.autoTitle || 'Untitled'}" (${conversation.messages.length} messages)`);

      const result = await apiAsyncNode.trade.saveCompleteConversation.mutate({
        conversation: {
          id: conversation.id,
          title: conversation.userTitle,
          autoTitle: conversation.autoTitle,
          userSymbol: conversation.userSymbol,
          systemPurposeId: conversation.systemPurposeId || 'Generic',
          isArchived: conversation.isArchived || false,
          isIncognito: conversation._isIncognito || false,
          created: conversation.created,
          updated: conversation.updated || undefined,
        },
        messages: conversation.messages.map(message => ({
          id: message.id,
          conversationId: conversation.id,
          role: convertMessageRole(message.role),
          content: message.fragments,
          purposeId: message.purposeId,
          metadata: message.metadata,
          userFlags: message.userFlags || [],
          tokenCount: message.tokenCount || 0,
          generator: message.generator,
          pendingIncomplete: !(hasRealMessageContent(message) && !message.pendingIncomplete),
          created: message.created,
          updated: message.updated || undefined,
        })),
      });

      if (!result.success)
        return false;

      const lastSyncedAt = getConversationSyncStamp(conversation);
      syncedConversationsRef.current.set(conversation.id, {
        localId: conversation.id,
        cloudId: conversation.id,
        lastSyncedAt,
      });
      observedConversationStampsRef.current.set(conversation.id, lastSyncedAt);

      console.log(`[cloud-sync] Saved conversation ${conversation.id} in one batch`);
      return true;
    } catch (error) {
      console.error('[cloud-sync] Error saving conversation:', error);
      return false;
    }
  }, []);

  const runConversationSync = useCallback(async (conversationId: string) => {
    const inFlight = syncInFlightRef.current;
    const pending = syncPendingRef.current;

    if (inFlight.has(conversationId)) {
      pending.add(conversationId);
      return;
    }

    const conversation = useChatStore.getState().conversations.find(item => item.id === conversationId);
    if (!isConversationSyncable(conversation))
      return;

    const conversationStamp = getConversationSyncStamp(conversation);
    const syncData = syncedConversationsRef.current.get(conversationId);
    if (syncData && conversationStamp <= syncData.lastSyncedAt)
      return;

    inFlight.add(conversationId);
    pending.delete(conversationId);

    try {
      const success = await saveConversationToDatabase(conversation);
      if (success)
        console.log(`[cloud-sync] Conversation ${conversationId} synced`);
    } finally {
      inFlight.delete(conversationId);

      if (pending.delete(conversationId))
        scheduleConversationSyncRef.current?.(conversationId, REQUEUE_DEBOUNCE_MS);
    }
  }, [saveConversationToDatabase]);

  const scheduleConversationSync = useCallback((conversationId: string, delayMs: number = SYNC_DEBOUNCE_MS) => {
    const timers = syncDebounceTimersRef.current;
    const existingTimer = timers.get(conversationId);
    if (existingTimer)
      clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      timers.delete(conversationId);
      void runConversationSync(conversationId);
    }, delayMs);

    timers.set(conversationId, timer);
  }, [runConversationSync]);

  useEffect(() => {
    scheduleConversationSyncRef.current = scheduleConversationSync;
  }, [scheduleConversationSync]);

  const loadConversationsFromDatabase = useCallback(async () => {
    if (!session?.user?.email || !userId) {
      console.log('[cloud-sync] No user session, skipping database chat load');
      return;
    }

    if (hydrationInFlightRef.current)
      return;

    hydrationInFlightRef.current = true;
    console.log('[cloud-sync] Loading conversations from database');

    try {
      const dbConversations: any[] = [];
      let offset = 0;

      while (true) {
        const page = await apiAsyncNode.trade.getUserConversations.query({
          limit: CLOUD_LOAD_BATCH_SIZE,
          offset,
        });

        dbConversations.push(...page);

        if (page.length < CLOUD_LOAD_BATCH_SIZE)
          break;

        offset += CLOUD_LOAD_BATCH_SIZE;
      }
      const { conversations: localConversations } = useChatStore.getState();
      const localConversationMap = new Map<string, DConversation>();
      localConversations.forEach(conversation => {
        localConversationMap.set(conversation.id, conversation);
      });

      const newConversationMap = new Map<string, DConversation>(localConversationMap);
      const syncMap = syncedConversationsRef.current;
      let hasStoreChanges = false;

      for (const dbConversation of dbConversations || []) {
        const existingConversation = localConversationMap.get(dbConversation.id);

        const cloudConversation: DConversation = {
          id: dbConversation.id,
          messages: dbConversation.messages.map((dbMsg: any): DMessage => {
            const fragments = dbMsg.content as any;
            const hasRealContent = fragments && fragments.length > 0
              && fragments.some((fragment: any) => fragment.ft === 'content' || fragment.ft === 'attachment');

            return {
              id: dbMsg.id,
              role: dbMsg.role.toLowerCase() as any,
              fragments,
              purposeId: dbMsg.purposeId || undefined,
              metadata: dbMsg.metadata as any,
              userFlags: dbMsg.userFlags as any,
              tokenCount: dbMsg.tokenCount,
              generator: dbMsg.generator as any,
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
          tokenCount: dbConversation.messages.reduce((sum: number, message: any) => sum + message.tokenCount, 0),
          _abortController: null,
        };

        syncMap.set(cloudConversation.id, {
          localId: cloudConversation.id,
          cloudId: dbConversation.id,
          lastSyncedAt: getConversationSyncStamp(cloudConversation),
        });

        if (!existingConversation) {
          newConversationMap.set(cloudConversation.id, cloudConversation);
          hasStoreChanges = true;
          console.log(`[cloud-sync] Added conversation from database: ${cloudConversation.userTitle || cloudConversation.autoTitle || 'Untitled'}`);
          continue;
        }

        const localUpdatedAt = getConversationSyncStamp(existingConversation);
        const cloudUpdatedAt = getConversationSyncStamp(cloudConversation);
        if (cloudUpdatedAt > localUpdatedAt) {
          newConversationMap.set(cloudConversation.id, cloudConversation);
          hasStoreChanges = true;
          console.log(`[cloud-sync] Updated conversation from database: ${cloudConversation.userTitle || cloudConversation.autoTitle || 'Untitled'}`);
        }
      }

      const mergedConversations = hasStoreChanges ? Array.from(newConversationMap.values()) : localConversations;
      const { visible: finalConversations, hiddenIds } = dedupeConversationsForDisplay(mergedConversations);

      hiddenIds.forEach(conversationId => {
        syncMap.delete(conversationId);
      });

      observedConversationStampsRef.current = indexConversationStamps(finalConversations);
      hydrationCompleteRef.current = true;

      if (hiddenIds.size)
        console.log(`[cloud-sync] Hiding ${hiddenIds.size} probable duplicate conversations from the local view`);

      if (hasStoreChanges) {
        useChatStore.setState({ conversations: finalConversations });
        console.log(`[cloud-sync] Updated local chat store with ${dbConversations?.length || 0} conversations`);
      } else if (finalConversations.length !== localConversations.length) {
        useChatStore.setState({ conversations: finalConversations });
        console.log('[cloud-sync] Removed probable duplicate conversations from the local view');
      } else {
        console.log('[cloud-sync] Cloud hydration complete with no local store changes');
      }
    } catch (error) {
      console.error('[cloud-sync] Error loading conversations from database:', error);
    } finally {
      hydrationInFlightRef.current = false;
    }
  }, [session?.user?.email, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      console.log('[cloud-sync] User not authenticated, skipping database sync setup');
      return;
    }

    console.log(`[cloud-sync] Setting up database sync for authenticated user: ${userId}`);

    if (!linkStorageOwnerId)
      setLinkStorageOwnerId(userId);

    if (!hydrationCompleteRef.current && !hydrationInFlightRef.current)
      void loadConversationsFromDatabase();
  }, [isAuthenticated, userId, linkStorageOwnerId, setLinkStorageOwnerId, loadConversationsFromDatabase]);

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      setUser(session.user);
      setAuthenticated(true);

      if (userId && userId !== linkStorageOwnerId)
        setLinkStorageOwnerId(userId);
    } else {
      setAuthenticated(false);
    }
  }, [isAuthenticated, session, userId, linkStorageOwnerId, setUser, setAuthenticated, setLinkStorageOwnerId]);

  useEffect(() => {
    if (!isAuthenticated || !userId || !hydrationCompleteRef.current)
      return;

    const activeConversationIds = new Set(conversations.map(conversation => conversation.id));

    for (const [conversationId, timer] of syncDebounceTimersRef.current.entries()) {
      if (!activeConversationIds.has(conversationId)) {
        clearTimeout(timer);
        syncDebounceTimersRef.current.delete(conversationId);
        syncPendingRef.current.delete(conversationId);
        observedConversationStampsRef.current.delete(conversationId);
      }
    }

    conversations.forEach(conversation => {
      const conversationId = conversation.id;
      const conversationStamp = getConversationSyncStamp(conversation);
      const previousObservedStamp = observedConversationStampsRef.current.get(conversationId);
      observedConversationStampsRef.current.set(conversationId, conversationStamp);

      if (!isConversationSyncable(conversation))
        return;

      if (previousObservedStamp !== undefined && conversationStamp <= previousObservedStamp)
        return;

      const syncData = syncedConversationsRef.current.get(conversationId);
      if (syncData && conversationStamp <= syncData.lastSyncedAt)
        return;

      scheduleConversationSync(conversationId);
    });
  }, [conversations, isAuthenticated, userId, scheduleConversationSync]);

  useEffect(() => {
    const debounceTimers = syncDebounceTimersRef.current;
    const pending = syncPendingRef.current;
    const inFlight = syncInFlightRef.current;
    return () => {
      debounceTimers.forEach(timer => clearTimeout(timer));
      debounceTimers.clear();
      pending.clear();
      inFlight.clear();
    };
  }, []);

  const syncStatus = {
    isEnabled: isAuthenticated,
    lastSync: syncedConversationsRef.current.size > 0
      ? Math.max(...Array.from(syncedConversationsRef.current.values()).map(sync => sync.lastSyncedAt))
      : null,
    syncedCount: syncedConversationsRef.current.size,
  };

  return {
    isAuthenticated,
    syncStatus,
    loadFromCloud: loadConversationsFromDatabase,
    syncToCloud: saveConversationToDatabase,
  };
};
