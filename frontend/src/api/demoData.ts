/**
 * BalanceVault Demonstration & Auditor Data Registry
 * Provides provable sample datasets for Refused Attempts, Duplicate Idempotency Replays,
 * and Append-Only Hash-Chain Verifications according to the PRD specification.
 */

export interface RefusedAttempt {
  id: string;
  accountId: string;
  accountNumber: string;
  initiatorEmail: string;
  attemptType: 'TRANSFER' | 'WITHDRAWAL' | 'CROSS_ACCOUNT_ACCESS';
  amountPaise: number;
  reason: 'INSUFFICIENT_FUNDS' | 'ACCOUNT_FROZEN' | 'UNAUTHORIZED_CROSS_USER' | 'RATE_LIMIT_EXCEEDED';
  idempotencyKey: string;
  requestHash: string;
  createdAt: string;
}

export interface DuplicateRequestRecord {
  id: string;
  idempotencyKey: string;
  userEmail: string;
  requestPath: string;
  requestBodyHash: string;
  originalExecutionTime: string;
  replayedAt: string;
  statusReturned: number;
  result: 'REPLAYED_CACHED_RESULT' | 'REJECTED_DIFFERENT_BODY' | 'CONCURRENT_IN_FLIGHT_BLOCKED';
}

export interface ReconciliationReport {
  timestamp: string;
  totalInternalAccounts: number;
  totalInternalBalancePaise: number;
  totalExternalDepositsPaise: number;
  totalExternalWithdrawalsPaise: number;
  expectedConservationSumPaise: number;
  recomputedLedgerSumPaise: number;
  driftPaise: number;
  status: 'BALANCED' | 'DRIFT_DETECTED';
  lastReconciledBlockHeight: number;
}

export const initialRefusedAttempts: RefusedAttempt[] = [
  {
    id: 'ref-001',
    accountId: 'acc-101',
    accountNumber: 'BV-1082-9412',
    initiatorEmail: 'alice.holder@example.com',
    attemptType: 'TRANSFER',
    amountPaise: 50000000, // ₹5,00,000
    reason: 'INSUFFICIENT_FUNDS',
    idempotencyKey: '8a91c24e-4e31-4822-bdf9-0092fa7711a1',
    requestHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'ref-002',
    accountId: 'acc-102',
    accountNumber: 'BV-1044-3319',
    initiatorEmail: 'mallory.attacker@test.net',
    attemptType: 'CROSS_ACCOUNT_ACCESS',
    amountPaise: 1000000, // ₹10,000
    reason: 'UNAUTHORIZED_CROSS_USER',
    idempotencyKey: '1b88e144-8841-4cfa-9df3-1029ba8811d2',
    requestHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'ref-003',
    accountId: 'acc-103',
    accountNumber: 'BV-1099-5512',
    initiatorEmail: 'bob.holder@example.com',
    attemptType: 'WITHDRAWAL',
    amountPaise: 2500000, // ₹25,000
    reason: 'ACCOUNT_FROZEN',
    idempotencyKey: '7c44d192-3321-4112-aae1-5541ba9922c1',
    requestHash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export const initialDuplicateRequests: DuplicateRequestRecord[] = [
  {
    id: 'dup-001',
    idempotencyKey: '9e33b141-8f92-4290-bfa1-cc38941211e4',
    userEmail: 'alice.holder@example.com',
    requestPath: '/api/transfers',
    requestBodyHash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    originalExecutionTime: new Date(Date.now() - 1800000).toISOString(),
    replayedAt: new Date(Date.now() - 1795000).toISOString(),
    statusReturned: 200,
    result: 'REPLAYED_CACHED_RESULT',
  },
  {
    id: 'dup-002',
    idempotencyKey: '9e33b141-8f92-4290-bfa1-cc38941211e4',
    userEmail: 'alice.holder@example.com',
    requestPath: '/api/transfers',
    requestBodyHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    originalExecutionTime: new Date(Date.now() - 1800000).toISOString(),
    replayedAt: new Date(Date.now() - 1200000).toISOString(),
    statusReturned: 422,
    result: 'REJECTED_DIFFERENT_BODY',
  },
];

export const demoReconciliationReport: ReconciliationReport = {
  timestamp: new Date().toISOString(),
  totalInternalAccounts: 48,
  totalInternalBalancePaise: 480000000, // ₹48,00,000.00
  totalExternalDepositsPaise: 500000000, // ₹50,00,000.00
  totalExternalWithdrawalsPaise: 20000000, // ₹2,00,000.00
  expectedConservationSumPaise: 480000000, // ₹48,00,000.00
  recomputedLedgerSumPaise: 480000000,
  driftPaise: 0, // Exactly 0 drift
  status: 'BALANCED',
  lastReconciledBlockHeight: 142,
};
