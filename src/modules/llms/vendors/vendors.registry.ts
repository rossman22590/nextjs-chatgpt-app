import type { AixAPI_Access } from '~/modules/aix/server/api/aix.wiretypes';

import { ModelVendorAlibaba } from './alibaba/alibaba.vendor';
import { ModelVendorAnthropic } from './anthropic/anthropic.vendor';
import { ModelVendorAzure } from './azure/azure.vendor';
import { ModelVendorBedrock } from './bedrock/bedrock.vendor';
import { ModelVendorDeepseek } from './deepseek/deepseekai.vendor';
import { ModelVendorGemini } from './gemini/gemini.vendor';
import { ModelVendorGroq } from './groq/groq.vendor';
import { ModelVendorLMStudio } from './lmstudio/lmstudio.vendor';
import { ModelVendorLocalAI } from './localai/localai.vendor';
import { ModelVendorMistral } from './mistral/mistral.vendor';
import { ModelVendorMoonshot } from './moonshot/moonshot.vendor';
import { ModelVendorOllama } from './ollama/ollama.vendor';
import { ModelVendorOpenAI } from './openai/openai.vendor';
import { ModelVendorOpenRouter } from './openrouter/openrouter.vendor';
import { ModelVendorPerplexity } from './perplexity/perplexity.vendor';
import { ModelVendorTogetherAI } from './togetherai/togetherai.vendor';
import { ModelVendorXAI } from './xai/xai.vendor';
import { ModelVendorZAI } from './zai/zai.vendor';

import type { IModelVendor } from './IModelVendor';


export type ModelVendorId =
  | 'alibaba'
  | 'anthropic'
  | 'azure'
  | 'bedrock'
  | 'deepseek'
  | 'googleai'
  | 'groq'
  | 'lmstudio'
  | 'localai'
  | 'mistral'
  | 'moonshot'
  | 'ollama'
  | 'openai'
  | 'openrouter'
  | 'perplexity'
  | 'togetherai'
  | 'xai'
  | 'zai'
  ;

/** Global: Vendor Instances Registry (`satisfies` validates keys, TS preserves specific vendor types) **/
const MODEL_VENDOR_REGISTRY = {
  alibaba: ModelVendorAlibaba,
  anthropic: ModelVendorAnthropic,
  azure: ModelVendorAzure,
  bedrock: ModelVendorBedrock,
  deepseek: ModelVendorDeepseek,
  googleai: ModelVendorGemini,
  groq: ModelVendorGroq,
  lmstudio: ModelVendorLMStudio,
  localai: ModelVendorLocalAI,
  mistral: ModelVendorMistral,
  moonshot: ModelVendorMoonshot,
  ollama: ModelVendorOllama,
  openai: ModelVendorOpenAI,
  openrouter: ModelVendorOpenRouter,
  perplexity: ModelVendorPerplexity,
  togetherai: ModelVendorTogetherAI,
  xai: ModelVendorXAI,
  zai: ModelVendorZAI,
} as const satisfies Record<ModelVendorId, IModelVendor>;


// --- Type Helpers - for Id -> concrete type mappings ---
// NOTE: we haven't ported the full system to type inference, this is just a way forward
export type ModelVendorOf<V extends ModelVendorId> = (typeof MODEL_VENDOR_REGISTRY)[V];
export type ModelVendorAccessOf<V extends ModelVendorId> = ModelVendorOf<V> extends IModelVendor<any, infer TAccess> ? TAccess : never;


/**
 * Vendors this deployment offers. OpenRouter (free models only) is the sole provider.
 *
 * The other vendors stay in the registry on purpose: shared server code and the
 * OpenRouter model parser still read their model definitions. They simply cannot be
 * added as services, are never auto-configured from server keys, and any service
 * persisted from an earlier build is pruned on load (see store-llms rehydration).
 */
const ENABLED_MODEL_VENDOR_IDS = new Set<ModelVendorId>([
  'openrouter',
]);

export function isModelVendorEnabled(vendorId?: ModelVendorId): boolean {
  return !!vendorId && ENABLED_MODEL_VENDOR_IDS.has(vendorId);
}

export function findAllModelVendors(): IModelVendor[] {
  const modelVendors = Object.values(MODEL_VENDOR_REGISTRY).filter(vendor => isModelVendorEnabled(vendor.id));
  modelVendors.sort((a, b) => a.displayRank - b.displayRank);
  return modelVendors;
}

export function findModelVendor<TServiceSettings extends object = {}, TAccess = AixAPI_Access>(
  vendorId?: ModelVendorId,
): IModelVendor<TServiceSettings, TAccess> | null {
  return vendorId ? (MODEL_VENDOR_REGISTRY[vendorId] as IModelVendor<TServiceSettings, TAccess>) ?? null : null;
}

// export function getDefaultModelVendor(): IModelVendor {
//   return MODEL_VENDOR_REGISTRY.openai;
// }