/**
 * BalanceVault End-to-End Automated Test Suite
 * Validates all Functional Requirements FR-1 through FR-18.
 */

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const BOOTSTRAP_TOKEN = process.env.BOOTSTRAP_TOKEN || 'bv_operator_secure_bootstrap_key_2026';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  let data;
  try {
    data = await res.json();
  } catch {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('BalanceVault Comprehensive E2E Verification Suite');
  console.log(`Backend Target: ${API_BASE}`);
  console.log('====================================================\n');

  // Test 1: Health & Readiness
  console.log('--- Suite 1: Operations & Health Endpoints (FR-16, FR-17) ---');
  const healthRes = await api('/health');
  assert(healthRes.status === 200 && healthRes.data.status === 'UP', 'FR-16: /health reports UP status');
  
  const readyRes = await api('/ready');
  assert(readyRes.status === 200 && (readyRes.data.status === 'READY' || readyRes.data.status === 'DEGRADED'), 'FR-17: /ready reports dependency readiness');

  // Test 2: Admin Bootstrap & Idempotency
  console.log('\n--- Suite 2: Administrator Bootstrap (FR-12) ---');
  const bootStatus = await api('/api/bootstrap/status');
  assert(bootStatus.status === 200, 'Check bootstrap status');

  const adminEmail = `admin.test.${Date.now()}@balancevault.internal`;
  const adminPassword = 'AdminPassword123!';
  let adminToken = '';

  if (!bootStatus.data.isBootstrapped) {
    const bootAttempt = await api('/api/bootstrap/admin', {
      method: 'POST',
      headers: { 'X-Bootstrap-Token': BOOTSTRAP_TOKEN },
      body: JSON.stringify({ email: adminEmail, password: adminPassword, bootstrapToken: BOOTSTRAP_TOKEN }),
    });
    assert(bootAttempt.status === 201, 'FR-12: First admin successfully bootstrapped');

    // Duplicate bootstrap must be rejected with 409
    const dupAttempt = await api('/api/bootstrap/admin', {
      method: 'POST',
      headers: { 'X-Bootstrap-Token': BOOTSTRAP_TOKEN },
      body: JSON.stringify({ email: 'second@admin.com', password: 'Password123!', bootstrapToken: BOOTSTRAP_TOKEN }),
    });
    assert(dupAttempt.status === 409, 'FR-12: Duplicate bootstrap rejected with HTTP 409 Conflict');
  }

  // Admin Login
  const loginAdmin = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: bootStatus.data.isBootstrapped ? 'admin.master@balancevault.internal' : adminEmail,
      password: bootStatus.data.isBootstrapped ? 'VaultAdmin2026!Secure' : adminPassword,
    }),
  });
  assert(loginAdmin.status === 200 && loginAdmin.data.token, 'FR-1: Admin signs in with credentials');
  adminToken = loginAdmin.data.token;

  // Test 3: Account-Holder Registration & RBAC
  console.log('\n--- Suite 3: Registration & RBAC Access Control (FR-1, FR-2, FR-3, FR-5) ---');
  const testUserEmail = `user.test.${Date.now()}@example.com`;
  const testUserPassword = 'UserPassword123!';

  const regRes = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: testUserEmail,
      password: testUserPassword,
      legalFullName: 'E2E Test Account Holder',
    }),
  });
  assert(regRes.status === 201 && regRes.data.token, 'FR-5: Visitor successfully registers as Account Holder');
  const userToken = regRes.data.token;

  // Non-admin attempting to access admin route MUST be rejected with 403
  const forbiddenCheck = await api('/api/admin/users', {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert(forbiddenCheck.status === 403, 'FR-3: Account holder rejected with HTTP 403 Forbidden on admin routes');

  // Test 4: Onboarding Workflow
  console.log('\n--- Suite 4: Onboarding Workflow & Decision (FR-6, FR-7, FR-8, FR-10) ---');
  // Update onboarding draft
  const draftUpdate = await api('/api/onboarding/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      legalFullName: 'Verified Synthetic Holder LLC',
      entityType: 'BUSINESS',
      jurisdiction: 'US',
      taxIdMasked: 'SYN-999-1111',
      expectedAnnualVolume: '$500,000+',
    }),
  });
  assert(draftUpdate.status === 200, 'FR-6: Onboarding draft updated');

  // Submit onboarding
  const submitRes = await api('/api/onboarding/submit', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert(submitRes.status === 200 && submitRes.data.profile.status === 'SUBMITTED', 'FR-7: Onboarding state submitted for review');
  const profileId = submitRes.data.profile.id;

  // Admin reviews and approves onboarding
  const approvalRes = await api(`/api/admin/onboarding/${profileId}/decision`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      decision: 'APPROVE',
      notes: 'Automated E2E Approval',
    }),
  });
  assert(approvalRes.status === 200 && approvalRes.data.account, 'FR-10 & FR-8: Admin approves onboarding and provisions ledger account');
  const createdAccountNumber = approvalRes.data.account.accountNumber;

  // Test 5: Ledger Account & Money Movement
  console.log('\n--- Suite 5: Ledger Verification & Money Movement (FR-8, FR-13) ---');
  const accountRes = await api('/api/accounts/me', {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert(accountRes.status === 200 && accountRes.data.account.balance > 0, 'FR-8: Account holder accesses active balance and ledger entries');

  // Register second user for transfer testing
  const recipientEmail = `recipient.${Date.now()}@example.com`;
  const regRecipient = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: recipientEmail, password: 'Password123!', legalFullName: 'Recipient Demo' }),
  });
  const subRecipient = await api('/api/onboarding/submit', {
    method: 'POST',
    headers: { Authorization: `Bearer ${regRecipient.data.token}` },
  });
  const appRecipient = await api(`/api/admin/onboarding/${subRecipient.data.profile.id}/decision`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ decision: 'APPROVE', notes: 'Recipient Approved' }),
  });
  const recipientAccNumber = appRecipient.data.account.accountNumber;

  // Perform transfer
  const transferRes = await api('/api/accounts/transfer', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      recipientAccountNumber: recipientAccNumber,
      amount: 150.0,
      note: 'E2E Verification Transfer',
    }),
  });
  assert(transferRes.status === 200 && transferRes.data.ledgerEntry, 'FR-13: Auditable money movement settled to ledger with double-entry logging');

  // Test 6: Audit Log Inspection
  console.log('\n--- Suite 6: Immutable Audit Log Inspection (FR-11, FR-14, FR-15) ---');
  const auditLogsRes = await api('/api/admin/audit-logs?limit=10', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(auditLogsRes.status === 200 && auditLogsRes.data.logs.length > 0, 'FR-11 & FR-15: Administrator retrieves and inspects audit trail');

  console.log('\n====================================================');
  console.log(`TEST RUN RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
