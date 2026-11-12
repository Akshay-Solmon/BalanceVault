/**
 * BalanceVault Idempotency Key Manager
 * Generates standards-compliant RFC4122 v4 UUIDs for all write operations.
 * Caches previous results to detect when a key replay produces a cached result (duplicate detection).
 */

export function generateIdempotencyKey(): string {
  // Use crypto.randomUUID if available, with robust fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type RequestStatus = 'idle' | 'submitting' | 'success' | 'refused' | 'duplicate';

export interface RequestState<T = any> {
  status: RequestStatus;
  key: string;
  response?: T | null;
  errorMessage?: string | null;
  isRetry?: boolean;
}

// In-memory session log of sent keys for duplicate detection in demonstration
const idempotencyKeyRegistry = new Map<string, { bodyHash: string; response: any; timestamp: number }>();

export function recordIdempotencyExecution(key: string, body: any, response: any) {
  const bodyHash = JSON.stringify(body);
  idempotencyKeyRegistry.set(key, {
    bodyHash,
    response,
    timestamp: Date.now(),
  });
}

export function checkIdempotencyDuplicate(key: string, body: any): { isDuplicate: boolean; priorResponse?: any } {
  const record = idempotencyKeyRegistry.get(key);
  if (!record) return { isDuplicate: false };

  const bodyHash = JSON.stringify(body);
  if (record.bodyHash === bodyHash) {
    return { isDuplicate: true, priorResponse: record.response };
  }
  return { isDuplicate: false };
}
