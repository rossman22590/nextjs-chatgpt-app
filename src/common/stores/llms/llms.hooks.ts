import { useShallow } from 'zustand/react/shallow';

import type { DModelsServiceId } from './llms.service.types';
import { DLLM, DLLMId, isLLMVisible } from './llms.types';
import { isOpenRouterCuratedModelRef, OPENROUTER_VISIBLE_MODELS_LIMIT, openRouterCuratedModelRank } from './llms.model-limits';
import { isLLMChatFree_cached } from './llms.pricing';
import { useModelsStore } from './store-llms';


export function useLLM(llmId: undefined | DLLMId | null): DLLM | undefined {
  return useModelsStore(state => !llmId ? undefined : state.llms.find(llm => llm.id === llmId));
}

export function useLLMExists(llmId: undefined | DLLMId | null): boolean {
  return useModelsStore(state => !llmId ? false : state.llms.some(llm => llm.id === llmId));
}

export function useLLMs(llmIds: ReadonlyArray<DLLMId>): ReadonlyArray<DLLM | undefined> {
  return useModelsStore(useShallow(state => {
    return llmIds.map(llmId => !llmId ? undefined : state.llms.find(llm => llm.id === llmId));
  }));
}

function _sortStarredFirstComparator(a: { userStarred?: boolean }, b: { userStarred?: boolean }) {
  if (a.userStarred && !b.userStarred) return -1;
  if (!a.userStarred && b.userStarred) return 1;
  return 0;
}

export function useLLMsByService(serviceId: false | DModelsServiceId): DLLM[] {
  return useModelsStore(useShallow(
    state => !serviceId ? state.llms : state.llms.filter(llm => llm.sId === serviceId),
  ));
}

function _limitOpenRouterVisibleLLMs<T extends DLLM>(llms: ReadonlyArray<T>): T[] {
  const visibleOpenRouterLlms = llms
    .map((llm, index) => ({ llm, index }))
    .filter(({ llm }) => llm.vId === 'openrouter' && isOpenRouterCuratedModelRef(llm.initialParameters?.llmRef))
    .sort((a, b) =>
      openRouterCuratedModelRank(a.llm.initialParameters?.llmRef) - openRouterCuratedModelRank(b.llm.initialParameters?.llmRef)
      || a.index - b.index,
    )
    .slice(0, OPENROUTER_VISIBLE_MODELS_LIMIT)
    .map(({ llm }) => llm);

  const output: T[] = [];
  let injectedOpenRouterLlms = false;

  for (const llm of llms) {
    if (llm.vId !== 'openrouter') {
      output.push(llm);
      continue;
    }

    if (!injectedOpenRouterLlms) {
      output.push(...visibleOpenRouterLlms);
      injectedOpenRouterLlms = true;
    }
  }

  return output;
}

export function useVisibleLLMs(includeLlmId: undefined | DLLMId | null, starredOnly: boolean, starredFirst: boolean): { llms: ReadonlyArray<DLLM>; hasStarred: boolean } {
  // for performance, we don't include this in the memo selector, as they'll change in tandem anyway
  let hasStarred = false;

  const llms = useModelsStore(useShallow(({ llms }) => {
    // filter by visibility and starred status
    const filtered = llms.filter((llm) => {
      // finds out if any starred LLM exists
      if (llm.userStarred) hasStarred = true;

      // always include the specified LLM ID if provided
      if (includeLlmId && llm.id === includeLlmId) return true;

      // OpenRouter is curated after this filter; keep factory-hidden models eligible so old persisted caps do not shrink it.
      if (llm.vId === 'openrouter') return llm.userHidden !== true && (!starredOnly || llm.userStarred);

      // visibility filter
      return isLLMVisible(llm) && (!starredOnly || llm.userStarred);
    });

    const capped = _limitOpenRouterVisibleLLMs(filtered);

    // sort starred first if requested
    return !starredFirst ? capped : capped.sort(_sortStarredFirstComparator);
  }));

  return { llms, hasStarred };
}

export function useHasLLMs(): boolean {
  return useModelsStore(state => !!state.llms.length);
}

export function useHasFreeLLMs(serviceId: false | DModelsServiceId | null): boolean {
  return useModelsStore(state => {
    if (serviceId === null) return false; // explicitly no service, so no free llms
    const llms = !serviceId ? state.llms : state.llms.filter(llm => llm.sId === serviceId);
    return llms.some(isLLMChatFree_cached);
  });
}

export function useModelsServices() {
  return useModelsStore(useShallow(state => ({
    modelsServices: state.sources,
    confServiceId: state.confServiceId,
    setConfServiceId: state.setConfServiceId,
  })));
}
