import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useShallow } from 'zustand/react/shallow';

import { SystemPurposeId } from '../../../../data';

import {
  ConversationPurposeId,
  CUSTOM_PERSONA_PREFIX,
  getPersonaIdFromPurposeId,
  isCustomPersonaPurposeId,
} from '~/common/stores/chat/chat.conversation';
import { DConversationId } from '~/common/stores/chat/chat.conversation';
import { usePersonaCacheStore } from '~/common/stores/chat/store-persona-cache';
import { OptimaBarControlMethods, OptimaBarDropdownMemo } from '~/common/layout/optima/bar/OptimaBarDropdown';
import { useChatStore } from '~/common/stores/chat/store-chats';
import { useUIComplexityIsMinimal } from '~/common/stores/store-ui';
import { apiAsyncNode } from '~/common/util/trpc.client';
import { useSystemPersonaCatalog } from '~/modules/persona/useSystemPersonaCatalog';

import { usePurposeStore } from '../persona-selector/store-purposes';

function PersonaDropdown(props: {
  dropdownRef: React.Ref<OptimaBarControlMethods>;
  systemPurposeId: ConversationPurposeId | null;
  setSystemPurposeId: (systemPurposeId: ConversationPurposeId | null) => void;
}) {
  const hiddenPurposeIDs = usePurposeStore((state) => state.hiddenPurposeIDs);
  const zenMode = useUIComplexityIsMinimal();
  const systemPersonaCatalog = useSystemPersonaCatalog();
  const personaById = usePersonaCacheStore((state) => state.byId);

  const visiblePurposes = React.useMemo(() => {
    const items: Record<string, { title: string; symbol?: string }> = Object.keys(systemPersonaCatalog)
      .filter((key) => !hiddenPurposeIDs.includes(key as SystemPurposeId) || key === props.systemPurposeId)
      .reduce(
        (obj, key) => {
          obj[key] = systemPersonaCatalog[key];
          return obj;
        },
        {} as Record<string, { title: string; symbol?: string }>,
      );

    for (const p of Object.values(personaById)) {
      const purposeId = `${CUSTOM_PERSONA_PREFIX}${p.id}`;
      items[purposeId] = { title: p.name ?? 'My persona', symbol: p.symbol ?? '🎭' };
    }

    if (props.systemPurposeId && isCustomPersonaPurposeId(props.systemPurposeId) && !items[props.systemPurposeId]) {
      const personaId = getPersonaIdFromPurposeId(props.systemPurposeId);
      const cached = personaId ? personaById[personaId] : undefined;
      items[props.systemPurposeId] = {
        title: cached?.name ?? 'My persona',
        symbol: cached?.symbol ?? '🎭',
      };
    }

    return items;
  }, [hiddenPurposeIDs, personaById, props.systemPurposeId, systemPersonaCatalog]);

  const handleSystemPurposeChange = React.useCallback(
    (value: string | null) => {
      props.setSystemPurposeId(value as ConversationPurposeId | null);
    },
    [props],
  );

  return (
    <OptimaBarDropdownMemo
      ref={props.dropdownRef}
      items={visiblePurposes}
      value={props.systemPurposeId}
      onChange={handleSystemPurposeChange}
      showSymbols={!zenMode}
    />
  );
}

export function usePersonaIdDropdown(conversationId: DConversationId | null, dropdownRef: React.Ref<OptimaBarControlMethods>) {
  const { data: session } = useSession();
  const setPersonasCache = usePersonaCacheStore((state) => state.setPersonas);

  const { systemPurposeId } = useChatStore(
    useShallow((state) => {
      const conversation = state.conversations.find((conversation) => conversation.id === conversationId);
      return {
        systemPurposeId: conversation?.systemPurposeId ?? null,
      };
    }),
  );

  React.useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    void apiAsyncNode.persona.list
      .query()
      .then((list) => {
        if (cancelled) return;
        setPersonasCache(list.map((p) => ({ id: p.id, name: p.name, systemPrompt: p.systemPrompt, symbol: p.symbol })));
      })
      .catch(() => { /* best-effort */ });
    return () => {
      cancelled = true;
    };
  }, [session?.user, setPersonasCache]);

  const handleSetSystemPurposeId = React.useCallback(
    (purposeId: ConversationPurposeId | null) => {
      if (conversationId && purposeId) useChatStore.getState().setSystemPurposeId(conversationId, purposeId);
    },
    [conversationId],
  );

  const personaDropdown = React.useMemo(() => {
    return <PersonaDropdown dropdownRef={dropdownRef} systemPurposeId={systemPurposeId} setSystemPurposeId={handleSetSystemPurposeId} />;
  }, [dropdownRef, handleSetSystemPurposeId, systemPurposeId]);

  return { personaDropdown };
}
