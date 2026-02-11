-- =====================================================
-- COMPLETE RLS FIX — Run in Supabase SQL Editor
-- Fixes: registrations, attendance, and settings tables
-- =====================================================

-- =====================================================
-- STEP 1: Ensure reg_number is TEXT (not integer)
-- =====================================================
ALTER TABLE registrations ALTER COLUMN reg_number TYPE TEXT;

-- =====================================================
-- STEP 2: Fix REGISTRATIONS table policies
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public insert on registrations" ON registrations;
DROP POLICY IF EXISTS "Allow public insert" ON registrations;
DROP POLICY IF EXISTS "Allow public read" ON registrations;
DROP POLICY IF EXISTS "Allow public select on registrations" ON registrations;
DROP POLICY IF EXISTS "Allow public delete" ON registrations;
DROP POLICY IF EXISTS "Allow authenticated select on registrations" ON registrations;
DROP POLICY IF EXISTS "Allow authenticated delete on registrations" ON registrations;

-- Enable RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT (public registration form)
CREATE POLICY "Allow public insert on registrations"
ON registrations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Anyone can SELECT (needed for registration count check on public form)
CREATE POLICY "Allow public select on registrations"
ON registrations FOR SELECT
TO anon, authenticated
USING (true);

-- Only authenticated users can DELETE (admin reset)
CREATE POLICY "Allow authenticated delete on registrations"
ON registrations FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- STEP 3: Fix ATTENDANCE table policies
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated select on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow authenticated insert on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow authenticated delete on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public insert on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public select on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public delete on attendance" ON attendance;

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can SELECT attendance
CREATE POLICY "Allow authenticated select on attendance"
ON attendance FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can INSERT (mark attendance)
CREATE POLICY "Allow authenticated insert on attendance"
ON attendance FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only authenticated users can DELETE (clear attendance)
CREATE POLICY "Allow authenticated delete on attendance"
ON attendance FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- STEP 4: Verify SETTINGS table policies are correct
-- =====================================================

-- Drop any dangerous wildcard policy
DROP POLICY IF EXISTS "Allow all on settings" ON settings;

-- Ensure correct policies exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'settings' 
        AND policyname = 'Allow public select on settings'
    ) THEN
        CREATE POLICY "Allow public select on settings"
        ON settings FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'settings' 
        AND policyname = 'Allow authenticated insert on settings'
    ) THEN
        CREATE POLICY "Allow authenticated insert on settings"
        ON settings FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'settings' 
        AND policyname = 'Allow authenticated update on settings'
    ) THEN
        CREATE POLICY "Allow authenticated update on settings"
        ON settings FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- =====================================================
-- STEP 5: Verify all policies
-- =====================================================
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('registrations', 'attendance', 'settings')
ORDER BY tablename, policyname;

-- =====================================================
-- EXPECTED:
--
-- registrations:
--   ✅ Allow public insert on registrations    → INSERT → {anon,authenticated}
--   ✅ Allow public select on registrations    → SELECT → {anon,authenticated}
--   ✅ Allow authenticated delete              → DELETE → {authenticated}
--
-- attendance:
--   ✅ Allow authenticated select on attendance → SELECT → {authenticated}
--   ✅ Allow authenticated insert on attendance → INSERT → {authenticated}
--   ✅ Allow authenticated delete on attendance → DELETE → {authenticated}
--
-- settings:
--   ✅ Allow public select on settings          → SELECT → {anon,authenticated}
--   ✅ Allow authenticated insert on settings   → INSERT → {authenticated}
--   ✅ Allow authenticated update on settings   → UPDATE → {authenticated}
-- =====================================================
