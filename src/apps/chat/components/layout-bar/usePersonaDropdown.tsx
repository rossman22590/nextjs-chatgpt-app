import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useShallow } from 'zustand/react/shallow';

import type { OptimaDropdownItems } from '~/common/layout/optima/bar/OptimaBarDropdown';
import { SystemPurposeId, SystemPurposes } from '../../../../data';

import type { ConversationPurposeId } from '~/common/stores/chat/chat.conversation';
import { CUSTOM_PERSONA_PREFIX } from '~/common/stores/chat/chat.conversation';
import { DConversationId } from '~/common/stores/chat/chat.conversation';
import { usePersonaCacheStore } from '~/common/stores/chat/store-persona-cache';
import { OptimaBarControlMethods, OptimaBarDropdownMemo } from '~/common/layout/optima/bar/OptimaBarDropdown';
import { useChatStore } from '~/common/stores/chat/store-chats';
import { useUIComplexityIsMinimal } from '~/common/stores/store-ui';
import { apiAsyncNode } from '~/common/util/trpc.client';

import { usePurposeStore } from '../persona-selector/store-purposes';


function PersonaDropdown(props: {
  dropdownRef: React.Ref<OptimaBarControlMethods>,
  systemPurposeId: ConversationPurposeId | null,
  setSystemPurposeId: (systemPurposeId: ConversationPurposeId | null) => void,
  customPersonas: Array<{ id: string; name: string | null; symbol: string | null; llmLabel: string | null }>,
}) {

  // external state
  const hiddenPurposeIDs = usePurposeStore(state => state.hiddenPurposeIDs);
  const zenMode = useUIComplexityIsMinimal();


  // Built-in purposes: filter by hidden, or include if currently active (so current selection always visible)
  const visibleSystemPurposesEntries = React.useMemo(() => {
    return Object.keys(SystemPurposes)
      .filter(key => !hiddenPurposeIDs.includes(key as SystemPurposeId) || key === props.systemPurposeId)
      .map(key => {
        const p = SystemPurposes[key as SystemPurposeId];
        return [key, { title: p.title, symbol: p.symbol }] as const;
      });
  }, [hiddenPurposeIDs, props.systemPurposeId]);

  // Custom personas as dropdown items (persona:uuid -> { title, symbol })
  const customPersonaEntries = React.useMemo(() =>
    props.customPersonas.map(p => [
      `${CUSTOM_PERSONA_PREFIX}${p.id}` as const,
      { title: p.name || p.llmLabel || 'Persona', symbol: p.symbol || '🎭' },
    ] as const),
  [props.customPersonas]);

  const items: OptimaDropdownItems = React.useMemo(() => {
    const acc: OptimaDropdownItems = {};
    for (const [key, val] of visibleSystemPurposesEntries)
      acc[key] = val;
    for (const [key, val] of customPersonaEntries)
      acc[key] = val;
    return acc;
  }, [visibleSystemPurposesEntries, customPersonaEntries]);

  const handleSystemPurposeChange = React.useCallback((value: string | null) => {
    props.setSystemPurposeId(value as (ConversationPurposeId | null));
  }, [props]);

  return (
    <OptimaBarDropdownMemo
      ref={props.dropdownRef}
      items={items}
      value={props.systemPurposeId}
      onChange={handleSystemPurposeChange}
      showSymbols={!zenMode}
    />
  );

}

export function usePersonaIdDropdown(conversationId: DConversationId | null, dropdownRef: React.Ref<OptimaBarControlMethods>) {

  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const [customPersonas, setCustomPersonas] = React.useState<Array<{ id: string; name: string | null; symbol: string | null; llmLabel: string | null }>>([]);
  const setPersonasCache = usePersonaCacheStore(state => state.setPersonas);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    apiAsyncNode.persona.list.query()
      .then((list) => {
        if (cancelled) return;
        setCustomPersonas(list.map(p => ({ id: p.id, name: p.name, symbol: p.symbol, llmLabel: p.llmLabel })));
        setPersonasCache(list.map(p => ({ id: p.id, name: p.name, systemPrompt: p.systemPrompt, symbol: p.symbol })));
      })
      .catch(() => { if (!cancelled) setCustomPersonas([]); });
    return () => { cancelled = true; };
  }, [isAuthenticated, setPersonasCache]);

  const { systemPurposeId } = useChatStore(useShallow(state => {
    const conversation = state.conversations.find(conversation => conversation.id === conversationId);
    return {
      systemPurposeId: conversation?.systemPurposeId ?? null,
    };
  }));

  const handleSetSystemPurposeId = React.useCallback((systemPurposeId: ConversationPurposeId | null) => {
    if (!conversationId || !systemPurposeId) return;
    useChatStore.getState().setSystemPurposeId(conversationId, systemPurposeId);
    if (systemPurposeId.startsWith(CUSTOM_PERSONA_PREFIX)) {
      const personaId = systemPurposeId.slice(CUSTOM_PERSONA_PREFIX.length);
      const persona = customPersonas.find(p => p.id === personaId);
      useChatStore.getState().setUserSymbol(conversationId, persona?.symbol ?? null);
    } else {
      useChatStore.getState().setUserSymbol(conversationId, null);
    }
  }, [conversationId, customPersonas]);

  const personaDropdown = React.useMemo(() => (
    <PersonaDropdown
      dropdownRef={dropdownRef}
      systemPurposeId={systemPurposeId}
      setSystemPurposeId={handleSetSystemPurposeId}
      customPersonas={customPersonas}
    />
  ), [dropdownRef, handleSetSystemPurposeId, systemPurposeId, customPersonas]);

  return { personaDropdown };
}