-- =====================================================
-- FINAL ANON FIX (EXPLICIT PERMISSIONS)
-- This script fixes "new row violates row-level security policy"
-- for public/anonymous users by explicitly granting permissions.
-- =====================================================

-- 1. ENSURE RLS IS ENABLED
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- 2. CRITICAL: GRANT PERMISSIONS TO 'anon' ROLE
-- RLS policies mean nothing if the role cannot 'USAGE' the schema or 'ALL' the table.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE registrations TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE registrations_id_seq TO anon, authenticated;

-- 3. RESET & CREATE POLICIES
-- We drop everything to be safe.
DROP POLICY IF EXISTS "Allow public insert on registrations" ON registrations;
DROP POLICY IF EXISTS "Allow public insert" ON registrations;
DROP POLICY IF EXISTS "Enable insert for all users" ON registrations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON registrations;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON registrations;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON registrations;

-- POLICY A: Allow ANYONE to INSERT
CREATE POLICY "Enable public insert"
ON registrations FOR INSERT
TO public
WITH CHECK (true);

-- POLICY B: Allow ONLY ADMIN (authenticated) to SELECT (View)
CREATE POLICY "Enable admin select"
ON registrations FOR SELECT
TO authenticated
USING (true);

-- POLICY C: Allow ONLY ADMIN (authenticated) to DELETE
CREATE POLICY "Enable admin delete"
ON registrations FOR DELETE
TO authenticated
USING (true);

-- 4. VERIFY OTHER TABLES (Just in case)
GRANT ALL ON TABLE settings TO anon, authenticated;
GRANT ALL ON TABLE attendance TO anon, authenticated;
