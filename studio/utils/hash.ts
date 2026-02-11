import { createHash } from 'node:crypto';

/**
 * Compute SHA-256 hash of data with 'sha256:' prefix
 */
export function computeHash(data: unknown): string {
  const json = JSON.stringify(data, null, 0);
  const hash = createHash('sha256').update(json).digest('hex');
  return `sha256:${hash}`;
}

/**
 * Compute hash of a string directly
 */
export function computeStringHash(str: string): string {
  const hash = createHash('sha256').update(str).digest('hex');
  return `sha256:${hash}`;
}

/**
 * Verify that a hash matches the data
 */
export function verifyHash(data: unknown, expectedHash: string): boolean {
  const actualHash = computeHash(data);
  return actualHash === expectedHash;
}

/**
 * Extract the hex portion of a sha256: prefixed hash
 */
export function extractHashHex(hash: string): string {
  return hash.startsWith('sha256:') ? hash.substring(7) : hash;
}
