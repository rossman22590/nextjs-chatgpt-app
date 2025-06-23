import { createHash, randomBytes } from 'crypto';

/**
 * Simple password hashing function
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  // Generate a random salt if not provided
  const useSalt = salt || randomBytes(16).toString('hex');
  
  // Create hash using password and salt
  const hash = createHash('sha256')
    .update(password + useSalt)
    .digest('hex');
  
  return { hash, salt: useSalt };
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const hashVerify = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  
  return hashVerify === hash;
}

/**
 * Generate a session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}
