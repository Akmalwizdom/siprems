-- Phase 2: RLS hardening for remaining tables
-- Extends 003_harden_rls_phase2.sql to cover products, transactions,
-- transaction_items, categories, and calendar_events.
-- Pattern: service_role bypasses all; reads are open for authenticated;
--          writes are admin-only on master data, authenticated on transactional data.

BEGIN;

-- ===============================
-- PRODUCTS TABLE
-- ===============================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_insert_admin" ON products;
DROP POLICY IF EXISTS "products_update_admin" ON products;
DROP POLICY IF EXISTS "products_delete_admin" ON products;

-- Anyone (including anon for public catalog) can read products
CREATE POLICY "products_select"
ON products FOR SELECT
USING (true);

-- Only service_role or admin can insert/update/delete
CREATE POLICY "products_insert_admin"
ON products FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('app_role') = 'admin'
);

CREATE POLICY "products_update_admin"
ON products FOR UPDATE
USING (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('app_role') = 'admin'
)
WITH CHECK (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('app_role') = 'admin'
);

CREATE POLICY "products_delete_admin"
ON products FOR DELETE
USING (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('app_role') = 'admin'
);

-- ===============================
-- TRANSACTIONS TABLE
-- ===============================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select" ON transactions;
DROP POLICY IF EXISTS "transactions_insert" ON transactions;
DROP POLICY IF EXISTS "transactions_delete_admin" ON transactions;

-- Authenticated users can read transactions (server-side date filtering applies)
CREATE POLICY "transactions_select"
ON transactions FOR SELECT
USING (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('sub') != ''
);

-- Authenticated users can create transactions
CREATE POLICY "transactions_insert"
ON transactions FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('sub') != ''
);

-- Only admin/service_role can delete transactions
CREATE POLICY "transactions_delete_admin"
ON transactions FOR DELETE
USING (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('app_role') = 'admin'
);

-- ===============================
-- TRANSACTION_ITEMS TABLE
-- ===============================
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transaction_items_select" ON transaction_items;
DROP POLICY IF EXISTS "transaction_items_insert" ON transaction_items;

-- Same access pattern as transactions
CREATE POLICY "transaction_items_select"
ON transaction_items FOR SELECT
USING (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('sub') != ''
);

CREATE POLICY "transaction_items_insert"
ON transaction_items FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('sub') != ''
);

-- ===============================
-- CATEGORIES TABLE
-- ===============================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public') THEN
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "categories_select" ON categories;
    DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
    DROP POLICY IF EXISTS "categories_update_admin" ON categories;
    DROP POLICY IF EXISTS "categories_delete_admin" ON categories;

    EXECUTE 'CREATE POLICY "categories_select" ON categories FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "categories_insert_admin" ON categories FOR INSERT WITH CHECK (auth.role() = ''service_role'' OR public.app_jwt_claim(''app_role'') = ''admin'')';
    EXECUTE 'CREATE POLICY "categories_update_admin" ON categories FOR UPDATE USING (auth.role() = ''service_role'' OR public.app_jwt_claim(''app_role'') = ''admin'') WITH CHECK (auth.role() = ''service_role'' OR public.app_jwt_claim(''app_role'') = ''admin'')';
    EXECUTE 'CREATE POLICY "categories_delete_admin" ON categories FOR DELETE USING (auth.role() = ''service_role'' OR public.app_jwt_claim(''app_role'') = ''admin'')';
  END IF;
END $$;

-- ===============================
-- CALENDAR_EVENTS TABLE
-- ===============================
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_events_select" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_insert_admin" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_update_admin" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_delete_admin" ON calendar_events;

-- Public read for calendar data
CREATE POLICY "calendar_events_select"
ON calendar_events FOR SELECT
USING (true);

-- Only admin/service_role can manage events
CREATE POLICY "calendar_events_insert_admin"
ON calendar_events FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('app_role') = 'admin'
);

CREATE POLICY "calendar_events_update_admin"
ON calendar_events FOR UPDATE
USING (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('app_role') = 'admin'
)
WITH CHECK (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('app_role') = 'admin'
);

CREATE POLICY "calendar_events_delete_admin"
ON calendar_events FOR DELETE
USING (
  auth.role() = 'service_role'
  OR public.app_jwt_claim('app_role') = 'admin'
);

-- ===============================
-- PERFORMANCE INDEXES (Phase 3B preview)
-- ===============================
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items (transaction_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

COMMIT;
