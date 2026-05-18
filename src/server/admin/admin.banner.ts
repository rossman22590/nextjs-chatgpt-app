import * as z from 'zod/v4';
import { randomUUID } from 'crypto';

import { LinkStorageDataType, LinkStorageVisibility } from '@prisma/client';

import { prisma } from '~/server/prisma/prisma-client';


export const ADMIN_BANNER_STORAGE_TITLE = '__big_agi_admin_banner_v1__';

const bannerToneSchema = z.enum(['neutral', 'primary', 'success', 'warning', 'danger']);

export const adminBannerInputSchema = z.object({
  enabled: z.boolean(),
  tone: bannerToneSchema,
  title: z.string().trim().max(80).nullable(),
  message: z.string().trim().max(320),
  ctaLabel: z.string().trim().max(40).nullable(),
  ctaUrl: z.string().trim().max(240).nullable(),
  expiresAt: z.string().datetime().nullable(),
});

const adminBannerStoredSchema = adminBannerInputSchema.extend({
  updatedAt: z.string().datetime(),
  updatedBy: z.string().nullable(),
});

export type AdminBanner = z.infer<typeof adminBannerStoredSchema>;

const emptyBanner: AdminBanner = {
  enabled: false,
  tone: 'warning',
  title: null,
  message: '',
  ctaLabel: null,
  ctaUrl: null,
  expiresAt: null,
  updatedAt: new Date(0).toISOString(),
  updatedBy: null,
};

function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const time = new Date(expiresAt).getTime();
  return Number.isFinite(time) && time <= Date.now();
}

function normalizeNullable(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function isAllowedBannerUrl(value: string | null | undefined): boolean {
  if (!value) return true;
  return value.startsWith('/') || /^https?:\/\//i.test(value);
}

export async function readAdminBanner(): Promise<AdminBanner> {
  const record = await prisma.linkStorage.findFirst({
    where: {
      dataTitle: ADMIN_BANNER_STORAGE_TITLE,
      dataType: LinkStorageDataType.CHAT_V1,
      isDeleted: false,
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      data: true,
      updatedAt: true,
    },
  });

  if (!record) return emptyBanner;

  const parsed = adminBannerStoredSchema.safeParse(record.data);
  if (!parsed.success) return { ...emptyBanner, updatedAt: record.updatedAt.toISOString() };

  const banner = parsed.data;
  return isExpired(banner.expiresAt) ? { ...banner, enabled: false } : banner;
}

export async function readPublicAdminBanner(): Promise<AdminBanner | null> {
  const banner = await readAdminBanner();
  if (!banner.enabled || !banner.message.trim()) return null;
  return banner;
}

export async function writeAdminBanner(input: z.infer<typeof adminBannerInputSchema>, updatedBy: string): Promise<AdminBanner> {
  const now = new Date();
  const banner: AdminBanner = {
    enabled: input.enabled && !isExpired(input.expiresAt),
    tone: input.tone,
    title: normalizeNullable(input.title),
    message: input.message.trim(),
    ctaLabel: normalizeNullable(input.ctaLabel),
    ctaUrl: normalizeNullable(input.ctaUrl),
    expiresAt: input.expiresAt,
    updatedAt: now.toISOString(),
    updatedBy,
  };
  const dataSize = JSON.stringify(banner).length;
  const expiresAt = banner.expiresAt ? new Date(banner.expiresAt) : null;

  const existing = await prisma.linkStorage.findFirst({
    where: {
      dataTitle: ADMIN_BANNER_STORAGE_TITLE,
      dataType: LinkStorageDataType.CHAT_V1,
      isDeleted: false,
    },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });

  if (existing) {
    await prisma.linkStorage.update({
      where: { id: existing.id },
      data: {
        visibility: LinkStorageVisibility.PRIVATE,
        data: banner,
        dataSize,
        expiresAt,
      },
    });
  } else {
    await prisma.linkStorage.create({
      data: {
        ownerId: updatedBy,
        visibility: LinkStorageVisibility.PRIVATE,
        dataType: LinkStorageDataType.CHAT_V1,
        dataTitle: ADMIN_BANNER_STORAGE_TITLE,
        dataSize,
        data: banner,
        expiresAt,
        deletionKey: randomUUID(),
        isDeleted: false,
      },
    });
  }

  return banner;
}
