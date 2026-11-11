-- ============================================================================
-- BalanceVault: Production/Neon PostgreSQL Bootstrap & Least-Privilege DDL
-- Solves SQLSTATE 42501 by decoupling role administration from execution.
-- ============================================================================

-- 1. Create Dedicated Application & Bootstrap Roles (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bootstrap_operator') THEN
        CREATE ROLE bootstrap_operator NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bv_app_runtime') THEN
        CREATE ROLE bv_app_runtime NOLOGIN;
    END IF;
END $$;

-- 2. Audit Trail Immutability (Append-Only)
-- Ensure runtime application role can INSERT and SELECT audit records,
-- but cannot alter or delete past history.
REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM bv_app_runtime;
GRANT SELECT, INSERT ON "AuditLog" TO bv_app_runtime;

-- 3. Controlled First-Admin Bootstrap Function
-- Executes with SECURITY DEFINER (runs with the owner privileges of the function author),
-- eliminating the need for the caller to have broad table writes or superuser privileges.
CREATE OR REPLACE FUNCTION bootstrap_first_admin(
    p_email TEXT,
    p_password_hash TEXT,
    p_ip_address TEXT DEFAULT '127.0.0.1',
    p_user_agent TEXT DEFAULT 'BootstrapCLI/1.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_admin_count INT;
    v_user_id TEXT;
    v_audit_id TEXT;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Check if an administrator already exists
    SELECT COUNT(*) INTO v_admin_count FROM "User" WHERE "role" = 'ADMIN';
    IF v_admin_count > 0 THEN
        RAISE EXCEPTION 'FIRST_ADMIN_ALREADY_EXISTS: An administrator account is already provisioned.'
            USING ERRCODE = 'P0001';
    END IF;

    -- Generate a unique identifier (UUID v4 format)
    v_user_id := gen_random_uuid()::TEXT;
    v_audit_id := gen_random_uuid()::TEXT;

    -- Insert the first administrator
    INSERT INTO "User" (
        "id", "email", "passwordHash", "role", "status", "createdAt", "updatedAt"
    ) VALUES (
        v_user_id, LOWER(TRIM(p_email)), p_password_hash, 'ADMIN', 'ACTIVE', v_now, v_now
    );

    -- Record the immutable audit log entry
    INSERT INTO "AuditLog" (
        "id", "timestamp", "actorId", "actorEmail", "actorRole",
        "action", "targetType", "targetId", "outcome", "ipAddress", "userAgent", "metadata"
    ) VALUES (
        v_audit_id, v_now, v_user_id, LOWER(TRIM(p_email)), 'BOOTSTRAP_OPERATOR',
        'ADMIN_BOOTSTRAP', 'USER', v_user_id, 'SUCCESS', p_ip_address, p_user_agent,
        jsonb_build_object(
            'message', 'Initial platform administrator bootstrapped via controlled function',
            'actorRole', 'BOOTSTRAP_OPERATOR'
        )::TEXT
    );

    RETURN jsonb_build_object(
        'success', true,
        'userId', v_user_id,
        'email', LOWER(TRIM(p_email)),
        'role', 'ADMIN',
        'bootstrappedAt', v_now
    );
END;
$$;

-- 4. Grant Narrow Execution Right to the Bootstrap Operator Role
REVOKE ALL ON FUNCTION bootstrap_first_admin(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION bootstrap_first_admin(TEXT, TEXT, TEXT, TEXT) TO bootstrap_operator;

-- 5. Verification Query
SELECT 
    proname AS function_name, 
    prosecdef AS is_security_definer,
    rolname AS owner_role
FROM pg_proc 
JOIN pg_roles ON pg_proc.proowner = pg_roles.oid
WHERE proname = 'bootstrap_first_admin';
