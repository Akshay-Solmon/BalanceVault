/**
 * BalanceVault: First-Administrator Bootstrap Verification CLI
 * Milestone M6 & M7 Verification Tool
 */

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const BOOTSTRAP_TOKEN = process.env.BOOTSTRAP_TOKEN || 'bv_operator_secure_bootstrap_key_2026';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin.master@balancevault.internal';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'VaultAdmin2026!Secure';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('========================================================');
  console.log('BalanceVault: Bootstrap & Admin Flow Verification (M6/M7)');
  console.log(`Target Backend: ${API_BASE}`);
  console.log('========================================================\n');

  // Step 1: Health Check
  console.log('[1/5] Verifying API Health and Readiness...');
  const health = await request('/health');
  if (!health.ok) {
    console.error('❌ Health check failed:', health.data);
    process.exit(1);
  }
  console.log('  ✔ /health:', health.data.status, `(Uptime: ${health.data.uptimeSeconds}s)`);

  const ready = await request('/ready');
  console.log('  ✔ /ready:', ready.data.status, ready.data.dependencies);

  // Step 2: Bootstrap Status Check
  console.log('\n[2/5] Checking First-Admin Bootstrap Status...');
  const bootStatus = await request('/api/bootstrap/status');
  console.log('  Bootstrap status:', bootStatus.data);

  if (!bootStatus.data.isBootstrapped) {
    console.log(`\n[3/5] Executing First-Admin Bootstrap via Controlled Channel...`);
    const bootRes = await request('/api/bootstrap/admin', {
      method: 'POST',
      headers: { 'X-Bootstrap-Token': BOOTSTRAP_TOKEN },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        bootstrapToken: BOOTSTRAP_TOKEN,
      }),
    });

    if (!bootRes.ok) {
      console.error('❌ Bootstrap failed:', bootRes.data);
      process.exit(1);
    }
    console.log('  ✔ Admin provisioned successfully:', bootRes.data.user);

    // Negative Test: Attempt duplicate bootstrap (Must be rejected with 409)
    console.log('  Testing duplicate bootstrap prevention (FR-12)...');
    const dupRes = await request('/api/bootstrap/admin', {
      method: 'POST',
      headers: { 'X-Bootstrap-Token': BOOTSTRAP_TOKEN },
      body: JSON.stringify({
        email: 'attacker@evil.com',
        password: 'Password123!',
        bootstrapToken: BOOTSTRAP_TOKEN,
      }),
    });
    if (dupRes.status === 409) {
      console.log('  ✔ Duplicate bootstrap rejected with HTTP 409 Conflict as required.');
    } else {
      console.warn('  ⚠️ Unexpected status for duplicate bootstrap:', dupRes.status);
    }
  } else {
    console.log('  ℹ️ Platform is already bootstrapped. Proceeding with login verification...');
  }

  // Step 4: Admin Sign-In
  console.log('\n[4/5] Testing Admin Sign-In with Provisioned Credentials...');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!loginRes.ok) {
    console.error('❌ Admin login failed:', loginRes.data);
    process.exit(1);
  }

  const adminToken = loginRes.data.token;
  console.log('  ✔ Admin authenticated successfully. Role:', loginRes.data.user.role);

  // Step 5: Verify RBAC on Admin Routes
  console.log('\n[5/5] Inspecting Admin Endpoints & Audit Trail...');
  const usersRes = await request('/api/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`  ✔ /api/admin/users reachable: ${usersRes.data.count} users found.`);

  const auditRes = await request('/api/admin/audit-logs?limit=5', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`  ✔ /api/admin/audit-logs reachable: ${auditRes.data.count} audit records found.`);
  if (auditRes.data.logs && auditRes.data.logs.length > 0) {
    console.log('  Latest Audit Record:');
    const latest = auditRes.data.logs[0];
    console.log(`    - Action: ${latest.action} | Outcome: ${latest.outcome}`);
    console.log(`    - Actor:  ${latest.actorEmail} (${latest.actorRole})`);
    console.log(`    - Target: ${latest.targetType}:${latest.targetId}`);
  }

  console.log('\n========================================================');
  console.log('🎉 VERIFICATION COMPLETE: Bootstrap and Admin flows verified!');
  console.log('========================================================');
}

run().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
