import { findModelVendor } from '~/modules/llms/vendors/vendors.registry';

import type { DLLM, DLLMId } from '../llms.types';
import type { DModelsServiceId } from '../llms.service.types';
import { findModelsServiceOrNull } from '../store-llms';
import { getLLMLabel, isLLMVisible } from '../llms.types';
import { isOpenRouterCuratedModelRef, OPENROUTER_VISIBLE_MODELS_LIMIT, openRouterCuratedModelRank } from '../llms.model-limits';


export function limitOpenRouterDropdownLLMs<T extends DLLM>(
  llms: ReadonlyArray<T>,
  _currentModelId?: DLLMId | null,
): T[] {
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


/**
 * Filter LLMs for dropdown display.
 * Respects starred/search/visibility filters, then applies provider-specific dropdown caps.
 */
export function filterLLMsForDropdown(
  llms: ReadonlyArray<DLLM>,
  options: {
    currentModelId?: DLLMId | null,
    searchString?: string | null,
    starredOnly?: boolean,
  },
): DLLM[] {
  const lcSearch = options.searchString?.toLowerCase();
  const filtered = llms.filter(llm => {
    // Always include the currently selected model
    if (options.currentModelId && llm.id === options.currentModelId) return true;

    // Filter by starred status
    if (options.starredOnly && !llm.userStarred) return false;

    // Filter by search string
    if (lcSearch && !getLLMLabel(llm).toLowerCase().includes(lcSearch)) return false;

    // OpenRouter is curated below; keep its factory-hidden models eligible so persisted old caps do not shrink the list.
    if (llm.vId === 'openrouter') return llm.userHidden !== true;

    // Show visible models, or all if actively searching
    return lcSearch ? true : isLLMVisible(llm);
  });

  return limitOpenRouterDropdownLLMs(filtered, options.currentModelId);
}


export interface LLMServiceGroup {
  serviceId: DModelsServiceId;
  serviceLabel: string;
  models: DLLM[];
}

/**
 * Resolve display label for each unique service in the input.
 * Fallback chain: service.label -> vendor.name -> service.id.
 */
function _resolveServiceLabels(llms: ReadonlyArray<DLLM>): Map<DModelsServiceId, string> {
  const labelById = new Map<DModelsServiceId, string>();
  for (const llm of llms) {
    if (labelById.has(llm.sId)) continue;
    const vendor = findModelVendor(llm.vId);
    labelById.set(llm.sId, findModelsServiceOrNull(llm.sId)?.label || vendor?.name || llm.sId);
  }
  return labelById;
}

/**
 * Stably sort LLMs by their service label (alphabetical, locale-aware).
 * Preserves intra-service order (e.g. starred-first), since JS sort is stable.
 */
export function sortLLMsByServiceLabel<T extends DLLM>(llms: ReadonlyArray<T>): T[] {
  if (llms.length < 2) return [...llms];
  const labelById = _resolveServiceLabels(llms);
  return [...llms].sort((a, b) => labelById.get(a.sId)!.localeCompare(labelById.get(b.sId)!));
}

/**
 * Group LLMs by service, alphabetically sorted by service label.
 * Preserves intra-service order.
 */
export function groupLLMsByService(llms: ReadonlyArray<DLLM>): LLMServiceGroup[] {
  const labelById = _resolveServiceLabels(llms);
  if (llms.length >= 2)
    llms = [...llms].sort((a, b) => labelById.get(a.sId)!.localeCompare(labelById.get(b.sId)!));

  const groups: LLMServiceGroup[] = [];
  let currentGroup: LLMServiceGroup | null = null;

  for (const llm of llms) {
    if (!currentGroup || currentGroup.serviceId !== llm.sId) {
      currentGroup = { serviceId: llm.sId, serviceLabel: labelById.get(llm.sId)!, models: [] };
      groups.push(currentGroup);
    }
    currentGroup.models.push(llm);
  }

  return groups;
}
