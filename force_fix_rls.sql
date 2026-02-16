-- =====================================================
-- FORCE FIX RLS (DESTRUCTIVE RESET)
-- This script forcefully resets RLS to ensure public INSERT works.
-- =====================================================

-- 1. DROP ALL EXISTING POLICIES ON REGISTRATIONS
-- We iterate through known policy names to be sure they are gone.
DROP POLICY IF EXISTS "Allow public insert on registrations" ON registrations;
DROP POLICY IF EXISTS "Allow public insert" ON registrations;
DROP POLICY IF EXISTS "Allow public read" ON registrations;
DROP POLICY IF EXISTS "Allow authenticated select on registrations" ON registrations;
DROP POLICY IF EXISTS "Allow authenticated delete on registrations" ON registrations;
DROP POLICY IF EXISTS "Allow authenticated update on registrations" ON registrations;
-- Drop any potentially conflicting ones
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON registrations;
DROP POLICY IF EXISTS "Enable read access for all users" ON registrations;

-- 2. ENSURE RLS IS ENABLED
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- 3. GRANT PERMISSIONS (Critical Step)
-- Ensure the 'anon' and 'authenticated' roles actually have permission to perform actions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE registrations TO anon, authenticated;
GRANT ALL ON SEQUENCE registrations_id_seq TO anon, authenticated;

-- 4. CREATE NEW POLICIES

-- A) UNCONDITIONAL INSERT
-- This allows ANYONE (public or logged in) to insert a row.
CREATE POLICY "Enable insert for all users"
ON registrations FOR INSERT
TO public
WITH CHECK (true);

-- B) SELECT (View) - Only for ADMIN (Authenticated)
CREATE POLICY "Enable select for authenticated users only"
ON registrations FOR SELECT
TO authenticated
USING (true);

-- C) DELETE - Only for ADMIN (Authenticated)
CREATE POLICY "Enable delete for authenticated users only"
ON registrations FOR DELETE
TO authenticated
USING (true);

-- 5. VERIFY SETTINGS TABLE
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE settings TO anon, authenticated;

DROP POLICY IF EXISTS "Allow public select on settings" ON settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON settings;

CREATE POLICY "Enable read access for all users"
ON settings FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on settings" ON settings;
CREATE POLICY "Enable insert for authenticated users only"
ON settings FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on settings" ON settings;
CREATE POLICY "Enable update for authenticated users only"
ON settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. VERIFY ATTENDANCE TABLE
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE attendance TO anon, authenticated; -- Ensure permissions

DROP POLICY IF EXISTS "Allow authenticated select on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow authenticated insert on attendance" ON attendance;

CREATE POLICY "Enable select for authenticated users only"
ON attendance FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON attendance FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only"
ON attendance FOR DELETE
TO authenticated
USING (true);
