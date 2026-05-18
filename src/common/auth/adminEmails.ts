export const ADMIN_EMAILS = ['rcohen@mytsi.org', 'nkukaj@mytsi.org',] as const;

const ADMIN_EMAIL_SET = new Set<string>(ADMIN_EMAILS);

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAIL_SET.has(email.trim().toLowerCase());
}
