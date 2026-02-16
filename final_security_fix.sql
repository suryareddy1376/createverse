-- =====================================================
-- FINAL SECURITY FIX FOR ALL TABLES
-- This script resets all policies to the most secure, functional state.
-- Run this in your Supabase SQL Editor.
-- =====================================================

-- 1. REGISTRATIONS TABLE (Public Form)
-- -----------------------------------------------------
-- RESET existing policies
DROP POLICY IF EXISTS "Allow public insert on registrations" ON registrations;
DROP POLICY IF EXISTS "Allow public insert" ON registrations;
DROP POLICY IF EXISTS "Allow public select on registrations" ON registrations;
DROP POLICY IF EXISTS "Allow public read" ON registrations;
DROP POLICY IF EXISTS "Allow authenticated select on registrations" ON registrations;
DROP POLICY IF EXISTS "Allow authenticated delete on registrations" ON registrations;
DROP POLICY IF EXISTS "Allow authenticated update on registrations" ON registrations;

-- ENABLE RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- NEW POLICIES:
-- a) Anyone can INSERT (needed for the public registration form)
CREATE POLICY "Allow public insert on registrations"
ON registrations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- b) Only ADMIN (authenticated) can SELECT/VIEW the data
CREATE POLICY "Allow authenticated select on registrations"
ON registrations FOR SELECT
TO authenticated
USING (true);

-- c) Only ADMIN (authenticated) can DELETE entries
CREATE POLICY "Allow authenticated delete on registrations"
ON registrations FOR DELETE
TO authenticated
USING (true);


-- 2. ATTENDANCE TABLE (Private Admin Only)
-- -----------------------------------------------------
-- RESET existing policies
DROP POLICY IF EXISTS "Allow authenticated select on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow authenticated insert on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow authenticated delete on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public insert on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public select on attendance" ON attendance;

-- ENABLE RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- NEW POLICIES:
-- a) Only ADMIN can SELECT attendance
CREATE POLICY "Allow authenticated select on attendance"
ON attendance FOR SELECT
TO authenticated
USING (true);

-- b) Only ADMIN can INSERT (mark attendance)
CREATE POLICY "Allow authenticated insert on attendance"
ON attendance FOR INSERT
TO authenticated
WITH CHECK (true);

-- c) Only ADMIN can DELETE (clear attendance)
CREATE POLICY "Allow authenticated delete on attendance"
ON attendance FOR DELETE
TO authenticated
USING (true);


-- 3. SETTINGS TABLE (Config Values)
-- -----------------------------------------------------
-- RESET existing policies
DROP POLICY IF EXISTS "Allow all on settings" ON settings;
DROP POLICY IF EXISTS "Allow public select on settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated insert on settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated update on settings" ON settings;

-- ENABLE RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- NEW POLICIES:
-- a) Anyone can READ settings (needed to check if "registrations_open" is true)
CREATE POLICY "Allow public select on settings"
ON settings FOR SELECT
TO anon, authenticated
USING (true);

-- b) Only ADMIN can INSERT/UPDATE settings
CREATE POLICY "Allow authenticated insert on settings"
ON settings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on settings"
ON settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);


-- 4. SECURE COUNT FUNCTION (Public API)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_registration_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM registrations;
$$;

-- Grant execute permission so public form can check the count
GRANT EXECUTE ON FUNCTION get_registration_count() TO anon, authenticated;
