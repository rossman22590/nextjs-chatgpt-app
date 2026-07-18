//
// Admin-controlled model availability.
//
// Stored as a JSON blob in the existing LinkStorage table (same trick as admin.banner.ts),
// so this needs NO new Prisma model and NO migration. The blob holds the list of model ids
// (DLLM ids) an admin has turned OFF; those models are filtered out of every user's model
// selector and rejected server-side.
//

import { randomUUID } from 'crypto';

import { LinkStorageDataType, LinkStorageVisibility } from '@prisma/client';

import { prisma } from '~/server/prisma/prisma-client';


export const ADMIN_DISABLED_MODELS_STORAGE_TITLE = '__big_agi_admin_disabled_models_v1__';

export type AdminDisabledModels = {
  disabledIds: string[];
  updatedAt: string;
  updatedBy: string | null;
};

const _empty: AdminDisabledModels = { disabledIds: [], updatedAt: new Date(0).toISOString(), updatedBy: null };

function _parse(data: unknown): string[] {
  if (data && typeof data === 'object' && Array.isArray((data as any).disabledIds))
    return (data as any).disabledIds.filter((id: unknown): id is string => typeof id === 'string');
  return [];
}

export async function readDisabledModels(): Promise<AdminDisabledModels> {
  const record = await prisma.linkStorage.findFirst({
    where: {
      dataTitle: ADMIN_DISABLED_MODELS_STORAGE_TITLE,
      dataType: LinkStorageDataType.CHAT_V1,
      isDeleted: false,
    },
    orderBy: { updatedAt: 'desc' },
    select: { data: true, updatedAt: true },
  });

  if (!record) return _empty;
  const stored = record.data as { updatedBy?: string | null } | null;
  return {
    disabledIds: _parse(record.data),
    updatedAt: record.updatedAt.toISOString(),
    updatedBy: stored?.updatedBy ?? null,
  };
}

// --- Server-side hot-path cache ---
// The AIX guard checks this on every generation; a short TTL keeps it off the DB per-request
// while staying fresh enough (a newly disabled model takes effect within a few seconds server-side,
// and immediately on the next client model-list refresh).
let _cache: { ids: Set<string>; at: number } | null = null;
const _CACHE_TTL_MS = 15_000;

export async function isModelDisabledCached(modelId: string): Promise<boolean> {
  const now = Date.now();
  if (!_cache || (now - _cache.at) > _CACHE_TTL_MS) {
    const { disabledIds } = await readDisabledModels();
    _cache = { ids: new Set(disabledIds), at: now };
  }
  return _cache.ids.has(modelId);
}

function _invalidateCache(): void {
  _cache = null;
}

export async function writeDisabledModels(disabledIds: string[], updatedBy: string): Promise<AdminDisabledModels> {
  // dedupe + drop empties, keep it bounded and deterministic
  const cleanIds = Array.from(new Set(disabledIds.filter((id) => typeof id === 'string' && id.trim().length > 0)));
  const now = new Date();
  const blob: AdminDisabledModels = { disabledIds: cleanIds, updatedAt: now.toISOString(), updatedBy };
  const dataSize = JSON.stringify(blob).length;

  const existing = await prisma.linkStorage.findFirst({
    where: {
      dataTitle: ADMIN_DISABLED_MODELS_STORAGE_TITLE,
      dataType: LinkStorageDataType.CHAT_V1,
      isDeleted: false,
    },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });

  if (existing) {
    await prisma.linkStorage.update({
      where: { id: existing.id },
      data: { visibility: LinkStorageVisibility.PRIVATE, data: blob, dataSize },
    });
  } else {
    await prisma.linkStorage.create({
      data: {
        ownerId: updatedBy,
        visibility: LinkStorageVisibility.PRIVATE,
        dataType: LinkStorageDataType.CHAT_V1,
        dataTitle: ADMIN_DISABLED_MODELS_STORAGE_TITLE,
        dataSize,
        data: blob,
        deletionKey: randomUUID(),
        isDeleted: false,
      },
    });
  }

  _invalidateCache(); // reflect the change immediately on the next guard check
  return blob;
}
