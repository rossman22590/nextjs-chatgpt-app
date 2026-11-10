// GENERATED FILE - DO NOT EDIT
// Per-vendor model-defs versions, derived from the runtime semantics of the files claimed by
// ../llms.defs.manifest.ts - regenerate with: node tools/develop/gen-llms-defs/generate-llms-defs.mjs
// (next dev / next build regenerate it automatically; commit the result)

import type { ModelVendorId } from '../../vendors/vendors.registry';

export type LlmsDefsVersions = Readonly<Record<ModelVendorId | '_shared' | '_openaiCompat', string>>;

export const LLMS_DEFS_VERSIONS = {
  _openaiCompat: '7d702a993b98',
  _shared: 'c932fb1e3799',
  alibaba: '3dc7d500dee5',
  anthropic: 'eeaed225d636',
  azure: '4c7a7662e925',
  bedrock: 'f3f3366bd6ac',
  cerebras: 'd4a7d3928634',
  cohere: '22a53bf23e9b',
  deepseek: 'c9a839dc696b',
  googleai: '23f99130ad57',
  groq: '56ee278e312f',
  lmstudio: '91decf635ee6',
  localai: 'ac0e6cabeaa7',
  metaai: '531aa4bf86ae',
  minimax: '1c526544ffc7',
  mistral: 'a0e912850620',
  modular: '5ede24e0aa0a',
  moonshot: 'a75e871992dc',
  nvidianim: 'd38e815ce095',
  ollama: 'd593c7e7f016',
  openai: '99064528884f',
  openrouter: '02b875876517',
  perplexity: '24d8919bfebd',
  sakanaai: '681e7ef515f9',
  togetherai: '02218a5be005',
  xai: '53d8ffa8d073',
  zai: '891ee3b8eba8',
} as const satisfies LlmsDefsVersions;
