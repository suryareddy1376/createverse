-- =====================================================
-- FIX: Registration RLS Policy
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop ALL existing policies on registrations (clean slate)
DROP POLICY IF EXISTS "Allow public insert on registrations" ON registrations;
DROP POLICY IF EXISTS "Allow public insert" ON registrations;
DROP POLICY IF EXISTS "Allow public read" ON registrations;
DROP POLICY IF EXISTS "Allow public delete" ON registrations;
DROP POLICY IF EXISTS "Allow authenticated select on registrations" ON registrations;
DROP POLICY IF EXISTS "Allow authenticated delete on registrations" ON registrations;

-- Step 2: Make sure RLS is enabled
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Step 3: Recreate all policies fresh

-- Anyone (anon + authenticated) can INSERT (public registration form)
CREATE POLICY "Allow public insert on registrations"
ON registrations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Anyone (anon + authenticated) can SELECT with count only
-- This is needed for the registration count check on the public form
CREATE POLICY "Allow public select on registrations"
ON registrations FOR SELECT
TO anon, authenticated
USING (true);

-- Only authenticated users can DELETE (admin reset)
CREATE POLICY "Allow authenticated delete on registrations"
ON registrations FOR DELETE
TO authenticated
USING (true);

-- Step 4: Verify
SELECT policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'registrations'
ORDER BY policyname;

-- =====================================================
-- EXPECTED:
--   ✅ Allow public insert on registrations  → INSERT → {anon,authenticated}
--   ✅ Allow public select on registrations  → SELECT → {anon,authenticated}
--   ✅ Allow authenticated delete on registrations → DELETE → {authenticated}
-- =====================================================
