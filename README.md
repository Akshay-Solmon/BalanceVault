# BalanceVault 🏛️
**Money movement with a ledger you can prove.**  
*Hackathon demonstration build. Synthetic data only. Not a production financial service and not for handling real funds.*

[![Status](https://img.shields.io/badge/Status-Implemented%20%26%20Verified-brightgreen)](#)
[![Security](https://img.shields.io/badge/Security-RBAC%20%7C%20Least%20Privilege-blue)](#)
[![Database](https://img.shields.io/badge/Postgres-Neon%20Compatible-00e599)](#)

---

## 1. Overview
BalanceVault is a secure financial account management web application that combines **server-enforced role-based access control (RBAC)**, **structured onboarding workflows**, and an **append-only, provable double-entry audit ledger**.

Every sensitive action is strictly attributable to an authenticated user, verified by their role on the backend, and permanently recorded in an immutable audit trail.

---

## 2. Key Architecture & Features

### 🔐 Security & Role-Based Access Control (FR-1, FR-2, FR-3, FR-4)
- **Server-Side Enforcement**: All protected endpoints enforce identity and role middleware on the backend.
- **Roles**:
  - `ACCOUNT_HOLDER`: Registers, completes onboarding, views own ledger, transfers synthetic funds.
  - `ADMIN`: Manages users, inspects & acts on onboarding applications, inspects filterable audit logs.
  - `BOOTSTRAP_OPERATOR`: Restricted role used exclusively to initialize the first administrator.
- **Fail-Closed Rate Limiting**: Redis-backed sliding window limiter with fail-closed policy on sensitive authentication routes (`/api/auth/*`, `/api/bootstrap/*`).

### 🐘 PostgreSQL Least-Privilege & Neon Compatibility (FR-12, FR-14)
In managed PostgreSQL environments like Neon, cloud tenant owner roles lack superuser privileges. Attempting to alter credentials or administer roles often throws `SQLSTATE 42501` (insufficient privilege).

BalanceVault solves this through **`SECURITY DEFINER` function scoping**:
1. **Schema Owner (`neondb_owner`)**: Owns tables, migrations, and the `bootstrap_first_admin` function.
2. **Application Role (`bv_app_runtime`)**: Has `SELECT`, `INSERT`, `UPDATE` on operational tables, but has `REVOKE UPDATE, DELETE ON "AuditLog"` to guarantee append-only ledger integrity.
3. **Bootstrap Operator Role (`bootstrap_operator`)**: Only has `GRANT EXECUTE ON FUNCTION bootstrap_first_admin(...)`. Cannot arbitrarily query or mutate user tables.

See [`scripts/neon_bootstrap.sql`](file:///C:/Users/AKSHAY/.gemini/antigravity/scratch/balancevault/scripts/neon_bootstrap.sql) for the exact DDL.

### 📝 Guided Onboarding Workflow (FR-6, FR-7, FR-8, FR-10)
- Account holders advance through a defined state machine:
  $$\text{DRAFT} \longrightarrow \text{SUBMITTED} \longrightarrow \text{UNDER\_REVIEW} \longrightarrow \text{APPROVED / REJECTED}$$
- Administrator approval automatically provisions an active account number (e.g. `BV-1084-3912`) and credits an initial demonstration balance with an immutable ledger entry.

### 📜 Provable Double-Entry Ledger & Audit Trail (FR-11, FR-13, FR-14, FR-15)
- All money movement performs atomic debit and credit entries with balance-after checkpoints.
- Audit entries record `actorId`, `actorEmail`, `actorRole`, `action`, `targetType`, `targetId`, `outcome`, `ipAddress`, `userAgent`, and contextual `metadata`.

---

## 3. Project Structure

```
balancevault/
├── PRD.md                         # Product Requirements Document
├── package.json                   # Workspace root orchestration
├── README.md                      # Documentation & Architecture
├── scripts/
│   ├── neon_bootstrap.sql         # Production Neon PostgreSQL role model & DDL
│   ├── verify_bootstrap.js        # Milestone M6 & M7 CLI verification tool
│   └── test_e2e.js                # Complete E2E integration test suite
├── backend/                       # Node.js + Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma          # Prisma schema (SQLite dev / PostgreSQL prod)
│   │   └── schema.postgres.prisma # PostgreSQL/Neon schema
│   └── src/
│       ├── config.ts              # Environment configuration
│       ├── db.ts                  # Prisma Client with append-only audit enforcement
│       ├── redis.ts               # Redis client & in-memory fallback
│       ├── middleware/            # Auth, RBAC, Rate Limiting, Audit Logger
│       ├── routes/                # Health, Auth, Bootstrap, Onboarding, Accounts, Admin
│       ├── seed.ts                # Demo data seeder
│       └── server.ts              # Express server
└── frontend/                      # React 18 + Vite + TypeScript UI
    ├── src/
    │   ├── api/client.ts          # Type-safe API client
    │   ├── context/AuthContext.tsx# Authentication and session state
    │   ├── components/            # SyntheticBanner, Navbar, StatCards
    │   └── pages/                 # Dashboard, Onboarding, AdminUsers, AdminAudit, Health, Bootstrap
    └── vite.config.ts             # Vite proxy to backend API
```

---

## 4. Getting Started

### Prerequisites
- Node.js v18+ (tested on Node.js v22)
- npm or pnpm

### Installation
From the project root:
```bash
# 1. Install backend dependencies
cd backend
npm install
npm run db:push
npm run db:seed

# 2. Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

**Option A: Start Backend and Frontend together**
From the root directory:
```bash
# Start backend (Port 5000)
npm run dev:backend

# In a separate terminal, start frontend (Port 5173)
npm run dev:frontend
```

Open your browser to: [http://localhost:5173](http://localhost:5173)

---

## 5. Verifying Milestones M6, M7 & M8

### Verify First-Admin Bootstrap (Milestone M6 & M7)
Run the dedicated verification CLI:
```bash
node scripts/verify_bootstrap.js
```
This CLI verifies:
1. `/health` and `/ready` endpoints.
2. Controlled bootstrap creation of the initial administrator (`admin.master@balancevault.internal`).
3. Rejection of duplicate bootstrap attempts (`HTTP 409 Conflict`).
4. Sign-in and session token generation.
5. Administrative access to `/api/admin/users` and `/api/admin/audit-logs`.

### Run Comprehensive End-to-End Test Suite (Milestone M8)
Run the full automated test suite validating all Functional Requirements (FR-1 through FR-18):
```bash
npm test
```

---

## 6. Pre-Seeded Hackathon Demo Accounts

| Role | Email | Password | Status |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `admin.master@balancevault.internal` | `VaultAdmin2026!Secure` | Root Admin |
| **Account Holder (Approved)** | `alice.holder@example.com` | `password123` | Active Account (`$2,500.00`) |
| **Account Holder (Pending)** | `bob.applicant@example.com` | `password123` | Submitted Onboarding |

---

## 7. AI Assistance Disclosure
Per Section 15 of the PRD:
- Assisted by Antigravity (Google DeepMind pair programming assistant).
- Built adhering strictly to the Neon least-privilege model, resolving `SQLSTATE 42501` through `SECURITY DEFINER` functions, and implementing complete append-only audit trail immutability.
