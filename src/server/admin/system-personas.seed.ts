import type { Prisma } from '@prisma/client';

import { SystemPurposes } from '../../data';

export type SystemPersonaSeedRow = {
  id: string;
  title: string;
  description: string | null;
  systemMessage: string;
  systemMessageNotes: string | null;
  symbol: string | null;
  imageUri: string | null;
  examples: Prisma.InputJsonValue | undefined;
  highlighted: boolean;
  isActive: boolean;
  call: Prisma.InputJsonValue | undefined;
  voices: Prisma.InputJsonValue | undefined;
  sortOrder: number;
};

function textOrNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function jsonOrUndefined(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function getSystemPersonaSeedRows(): SystemPersonaSeedRow[] {
  return Object.entries(SystemPurposes).map(([id, persona], index) => ({
    id,
    title: persona.title,
    description: typeof persona.description === 'string' ? textOrNull(persona.description) : null,
    systemMessage: persona.systemMessage,
    systemMessageNotes: textOrNull(persona.systemMessageNotes),
    symbol: textOrNull(persona.symbol),
    imageUri: textOrNull(persona.imageUri),
    examples: jsonOrUndefined(persona.examples),
    highlighted: !!persona.highlighted,
    isActive: true,
    call: jsonOrUndefined(persona.call),
    voices: jsonOrUndefined(persona.voices),
    sortOrder: index,
  }));
}
