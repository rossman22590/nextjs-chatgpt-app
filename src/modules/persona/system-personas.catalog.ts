import { SystemPurposeData, SystemPurposeExample, SystemPurposes } from '../../data';

export type RuntimeSystemPersona = {
  id: string;
  title: string;
  description: string | null;
  systemMessage: string;
  systemMessageNotes: string | null;
  symbol: string | null;
  imageUri: string | null;
  examples: unknown;
  highlighted: boolean;
  call: unknown;
  voices: unknown;
  sortOrder: number;
};

export type SystemPersonaCatalog = Record<string, SystemPurposeData>;

let runtimeCatalog: SystemPersonaCatalog | null = null;

function isSystemPurposeExample(value: unknown): value is SystemPurposeExample {
  return typeof value === 'string' || (!!value && typeof value === 'object' && 'prompt' in value && typeof (value as { prompt?: unknown }).prompt === 'string');
}

function normalizeExamples(examples: unknown): SystemPurposeExample[] | undefined {
  if (!Array.isArray(examples)) return undefined;
  const normalized = examples.filter(isSystemPurposeExample);
  return normalized.length ? normalized : undefined;
}

function rowToSystemPurpose(row: RuntimeSystemPersona): SystemPurposeData {
  return {
    title: row.title,
    description: row.description ?? '',
    systemMessage: row.systemMessage,
    systemMessageNotes: row.systemMessageNotes ?? undefined,
    symbol: row.symbol ?? '🎭',
    imageUri: row.imageUri ?? undefined,
    examples: normalizeExamples(row.examples),
    highlighted: row.highlighted || undefined,
    call: (row.call as SystemPurposeData['call']) ?? undefined,
    voices: (row.voices as SystemPurposeData['voices']) ?? undefined,
  };
}

export function applySystemPersonaRows(rows: RuntimeSystemPersona[]): SystemPersonaCatalog {
  runtimeCatalog = rows.reduce<SystemPersonaCatalog>((catalog, row) => {
    catalog[row.id] = rowToSystemPurpose(row);
    return catalog;
  }, {});

  return getSystemPersonaCatalog();
}

export function getSystemPersonaCatalog(): SystemPersonaCatalog {
  return runtimeCatalog && Object.keys(runtimeCatalog).length ? runtimeCatalog : SystemPurposes;
}

export function getSystemPurpose(purposeId: string | null | undefined): SystemPurposeData | null {
  if (!purposeId) return null;
  if (purposeId === 'Custom') return SystemPurposes.Custom ?? getSystemPersonaCatalog().Custom ?? null;
  return getSystemPersonaCatalog()[purposeId] ?? SystemPurposes[purposeId as keyof typeof SystemPurposes] ?? null;
}

export function setCustomSystemPurposeMessage(systemMessage: string) {
  if (!SystemPurposes.Custom) return;
  SystemPurposes.Custom.systemMessage = systemMessage;
}
