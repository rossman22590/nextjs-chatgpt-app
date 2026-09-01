// GENERATED FILE - DO NOT EDIT
// Per-vendor model-defs versions, derived from the runtime semantics of the files claimed by
// ../llms.defs.manifest.ts - regenerate with: node tools/develop/gen-llms-defs/generate-llms-defs.mjs
// (next dev / next build regenerate it automatically; commit the result)

import type { ModelVendorId } from '../../vendors/vendors.registry';

export type LlmsDefsVersions = Readonly<Record<ModelVendorId | '_shared' | '_openaiCompat', string>>;

export const LLMS_DEFS_VERSIONS = {
  _openaiCompat: 'de7d203fd0c5',
  _shared: '1a397e70b32f',
  alibaba: 'cfbf5d6f697e',
  anthropic: '6ed5d3c26843',
  azure: '79df0a22d188',
  bedrock: 'd7be83388574',
  cerebras: 'eeb4b947da11',
  cohere: '4524701dd0d9',
  deepseek: '1f193df59000',
  googleai: '80fe61592f84',
  groq: '85a7a982836a',
  lmstudio: 'ed67bfb1273c',
  localai: 'c71f1cc64011',
  minimax: 'e4de7c17ce74',
  mistral: '3ab9628d437f',
  modular: 'b3785de868be',
  moonshot: '7777c3a42011',
  nvidianim: '42ef4496be84',
  ollama: 'bc2e2f2e58e4',
  openai: '62426f1d78c6',
  openrouter: 'ebbfc8d1c9b2',
  perplexity: 'b9ac408db451',
  sakanaai: '4afb3004e616',
  togetherai: '4f0637a5d7d9',
  xai: '1aec599f08bf',
  zai: 'cc2d8aef4d57',
} as const satisfies LlmsDefsVersions;
