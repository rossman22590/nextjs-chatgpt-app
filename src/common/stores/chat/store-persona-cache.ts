import { create } from 'zustand';

/**
 * In-memory cache of user personas from persona.list.
 * Populated by the chat bar persona dropdown when authenticated.
 * Used by ConversationHandler to resolve persona:uuid system prompts.
 */

export interface CachedPersona {
  id: string;
  name: string | null;
  systemPrompt: string;
  symbol: string | null;
}

interface PersonaCacheState {
  byId: Record<string, CachedPersona>;
  setPersonas: (personas: Array<{ id: string; name: string | null; systemPrompt: string; symbol: string | null }>) => void;
  getPersona: (id: string) => CachedPersona | undefined;
}

export const usePersonaCacheStore = create<PersonaCacheState>()((set, get) => ({
  byId: {},
  setPersonas: (personas) =>
    set({
      byId: personas.reduce<Record<string, CachedPersona>>((acc, p) => {
        acc[p.id] = { id: p.id, name: p.name, systemPrompt: p.systemPrompt, symbol: p.symbol };
        return acc;
      }, {}),
    }),
  getPersona: (id) => get().byId[id],
}));
