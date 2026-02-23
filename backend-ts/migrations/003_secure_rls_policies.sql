-- Migration: Secure RLS Policies for SIPREMS
-- Run this in Supabase SQL Editor (SQL Tools > New Query)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENABLE RLS ON ALL TABLES
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RESET EXISTING POLICIES
-- ─────────────────────────────────────────────────────────────────────────────
-- Drop permissive policies from previous migrations
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Allow insert for user creation" ON users;
DROP POLICY IF EXISTS "Allow delete" ON users;
DROP POLICY IF EXISTS "Anyone can read store settings" ON store_settings;
DROP POLICY IF EXISTS "Authenticated users can update store settings" ON store_settings;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. APPLY STRICTOR POLICIES
-- ─────────────────────────────────────────────────────────────────────────────
-- General Strategy: The database is locked for public/anon access.
-- The backend uses the 'service_role' (which bypasses RLS) as the sole gatekeeper.

-- USERS TABLE
CREATE POLICY "Users table: Deny all public access" ON users
  FOR ALL TO public/anon/authenticated USING (false);

-- STORE_SETTINGS TABLE
CREATE POLICY "Store Settings: Read-only for everyone" ON store_settings
  FOR SELECT TO public/anon/authenticated USING (true);
CREATE POLICY "Store Settings: Write-only for service_role (via backend)" ON store_settings
  FOR ALL TO public/anon/authenticated USING (false);

-- PRODUCTS TABLE
CREATE POLICY "Products: Read-only for authenticated users" ON products
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Products: Write-only via backend" ON products
  FOR ALL TO public/anon/authenticated USING (false);

-- TRANSACTIONS TABLE
CREATE POLICY "Transactions: Deny all public access" ON transactions
  FOR ALL TO public/anon/authenticated USING (false);

-- CALENDAR_EVENTS TABLE
CREATE POLICY "Calendar Events: Deny all public access" ON calendar_events
  FOR ALL TO public/anon/authenticated USING (false);

-- CATEGORIES TABLE
CREATE POLICY "Categories: Read-only for everyone" ON categories
  FOR SELECT TO public/anon/authenticated USING (true);
CREATE POLICY "Categories: Write-only via backend" ON categories
  FOR ALL TO public/anon/authenticated USING (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: 'service_role' key used by the backend automatically bypasses RLS.
-- This ensures the backend can still perform all operations while
-- the database is protected from direct client manipulation.
-- ─────────────────────────────────────────────────────────────────────────────
