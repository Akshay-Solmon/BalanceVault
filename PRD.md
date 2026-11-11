# BalanceVault: Product Requirements Document
**Money movement with a ledger you can prove. Hackathon demonstration build, synthetic data only.**

- **Version**: 0.1 (draft)
- **Status**: Implemented & Ready for Verification
- **Scope**: Demonstration only. Not a production financial service and not for handling real funds.

---

## 1. Overview
BalanceVault is a secure account management web application that combines controlled access, guided onboarding, and auditable account operations. It treats financial account management as more than data storage: every important action must be attributable to an authenticated user, permitted by their role, and recorded in a reviewable audit trail.

---

## 2. Problem Statement
Managing financial accounts requires:
- **Controlled access**: Only the right people can see or change the right things.
- **Secure authentication**: Identity must be established reliably before any sensitive operation.
- **Clear onboarding**: Account holders need a structured path from registration to an active account.
- **Accountability**: Important actions must leave a trustworthy record that administrators can inspect.

Many simple account tools handle one or two of these and leave the rest to convention. BalanceVault brings all four together in one structured platform.

---

## 3. Goals and Non-Goals

### Goals
- Provide role-based access control (RBAC) enforced on the backend, not just hidden in the UI.
- Let account holders register and complete an onboarding workflow.
- Give administrators tools for user management, onboarding review, and audit-log access.
- Record auditable events for sensitive operations with append-only integrity.
- Separate database responsibilities using distinct PostgreSQL roles (least privilege) that operate reliably within managed PostgreSQL providers (such as Neon).
- Protect the API with rate limiting and expose health (`/health`) and readiness (`/ready`) endpoints for operations.

### Non-Goals (for this release)
- Handling real money, real customer data, or real payment rails.
- Regulatory compliance claims (KYC/AML, PCI, SOC 2, and similar).
- Production-grade monitoring, alerting, and disaster recovery.
- Mobile native apps.

---

## 4. Users and Roles
| Role | Description | Key Capabilities |
| :--- | :--- | :--- |
| **Account holder** | End user who registers and owns an account | Register, sign in, complete onboarding, view own account & ledger, transfer demo funds |
| **Administrator** | Operator of the platform | Manage users, review & decide onboarding requests, inspect filterable audit logs |
| **Bootstrap operator** | Restricted DB/system role used only to create the first admin | Execute the admin bootstrap function only; inactive once the first admin exists |

---

## 5. Architecture & Database Role Model

### 5.1 System Architecture
- **Frontend**: React single-page application built with modern component styling and responsive views.
- **Backend**: Node.js/Express TypeScript API service with route-level JWT authentication, strict RBAC middleware, and rate limiting.
- **Database**: PostgreSQL accessed through Prisma ORM (with local SQLite option for zero-dependency local testing).
- **Cache & Rate Limiting**: Redis with fail-closed policy on sensitive auth routes and fail-open with logging on general endpoints.
- **Health & Operations**: `/health` (liveness) and `/ready` (dependency connectivity checks for PostgreSQL and Redis).

### 5.2 Database Role Model & Neon Compatibility
In managed PostgreSQL environments such as Neon, owner roles do not hold superuser privileges, and operations like modifying passwords or administering other roles trigger `SQLSTATE 42501` (insufficient privilege). BalanceVault resolves this through strict `SECURITY DEFINER` function scoping:

1. **Project Owner (`neondb_owner`)**: Owns tables and migrations. Owns the `bootstrap_admin` function.
2. **Application Role (`app_user`)**: Runtime backend queries. Has `SELECT`, `INSERT`, `UPDATE` on operational tables, but strictly `REVOKE UPDATE, DELETE ON "AuditLog"` to guarantee append-only integrity.
3. **Bootstrap Operator Role (`bootstrap_operator`)**: Only has `GRANT EXECUTE ON FUNCTION bootstrap_admin(...)`. Cannot read or write arbitrary tables directly.

---

## 6. Functional Requirements Matrix
- **FR-1**: Users sign in with credentials and receive an authenticated session/token.
- **FR-2**: Every protected API route enforces caller identity and role on the server.
- **FR-3**: Account holders can only access their own resources; admin routes reject non-admin callers (HTTP 403).
- **FR-4**: Failed or unauthorized attempts return consistent error formats without leaking internal state.
- **FR-5**: A visitor can register as an account holder.
- **FR-6**: Registered users move through a defined onboarding workflow (`REGISTERED` $\rightarrow$ `SUBMITTED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `APPROVED` or `REJECTED`).
- **FR-7**: Onboarding state changes are performed through controlled endpoints and audited.
- **FR-8**: An approved onboarding automatically provisions an active account with a ledger.
- **FR-9**: Administrators can list, inspect, and filter users.
- **FR-10**: Administrators can review and act on onboarding requests.
- **FR-11**: Administrators can view and filter the immutable audit log.
- **FR-12**: The first administrator is created through a controlled bootstrap function/endpoint, executable only once, without exposing an open admin registration endpoint.
- **FR-13**: Sensitive actions write audit entries (actor, role, action, target, timestamp, IP, outcome, metadata).
- **FR-14**: Audit records are append-only.
- **FR-15**: Audit logs are readable only by administrators.
- **FR-16**: `/health` reports process liveness.
- **FR-17**: `/ready` reports dependency connectivity.
- **FR-18**: Rate limiting applied to authentication and sensitive routes.
