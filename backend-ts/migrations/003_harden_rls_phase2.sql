-- Phase 2: RLS hardening baseline
-- Goal: remove permissive USING (true) policies and replace with JWT/store-aware policies.
-- Note:
-- 1) Backend should use SUPABASE_SERVICE_ROLE_KEY for trusted server access.
-- 2) JWT claim `sub` is expected to carry firebase UID when direct client access is used.
-- 3) Optional custom claim `app_role` can be used for admin-level access from JWT.

BEGIN;

-- Helper to read JWT claims safely.
CREATE OR REPLACE FUNCTION public.app_jwt_claim(claim_name TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(auth.jwt() ->> claim_name, '');
$$;

-- ===============================
-- USERS TABLE POLICIES
-- ===============================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Allow insert for user creation" ON users;
DROP POLICY IF EXISTS "Allow delete" ON users;

CREATE POLICY "users_select_self_or_admin"
ON users
FOR SELECT
USING (
  auth.role() = 'service_role'
  OR firebase_uid = public.app_jwt_claim('sub')
  OR public.app_jwt_claim('app_role') = 'admin'
);

CREATE POLICY "users_insert_self_default_role"
ON users
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
  OR (
    firebase_uid = public.app_jwt_claim('sub')
    AND COALESCE(role, 'user') = 'user'
  )
);

CREATE POLICY "users_update_self_or_admin"
ON users
FOR UPDATE
USING (
  auth.role() = 'service_role'
  OR firebase_uid = public.app_jwt_claim('sub')
  OR public.app_jwt_claim('app_role') = 'admin'
)
WITH CHECK (
  auth.role() = 'service_role'
  OR (
    firebase_uid = public.app_jwt_claim('sub')
    AND COALESCE(role, 'user') = 'user'
  )
  OR public.app_jwt_claim('app_role') = 'admin'
);

CREATE POLICY "users_delete_admin_only"
ON users
FOR DELETE
USING (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('app_role') = 'admin'
);

-- ===============================
-- STORE SETTINGS POLICIES
-- ===============================
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read store settings" ON store_settings;
DROP POLICY IF EXISTS "Authenticated users can update store settings" ON store_settings;

CREATE POLICY "store_settings_read_public"
ON store_settings
FOR SELECT
USING (true);

CREATE POLICY "store_settings_update_admin_only"
ON store_settings
FOR UPDATE
USING (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('app_role') = 'admin'
)
WITH CHECK (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('app_role') = 'admin'
);

COMMIT;
