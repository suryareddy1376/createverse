-- =====================================================
-- FIX: Lock down registration data from public access
-- Run in Supabase SQL Editor
-- =====================================================

-- STEP 1: Create a secure function that only returns the count
-- This runs with SECURITY DEFINER (bypasses RLS) so anon can
-- get the count without being able to read the actual rows.
CREATE OR REPLACE FUNCTION get_registration_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM registrations;
$$;

-- Grant execute permission to anon and authenticated
GRANT EXECUTE ON FUNCTION get_registration_count() TO anon, authenticated;

-- STEP 2: Lock down the SELECT policy to authenticated-only
-- This prevents anyone with just the anon key from reading rows
DROP POLICY IF EXISTS "Allow public select on registrations" ON registrations;
DROP POLICY IF EXISTS "Allow public read" ON registrations;
DROP POLICY IF EXISTS "Allow public select" ON registrations;

CREATE POLICY "Allow authenticated select on registrations"
ON registrations FOR SELECT
TO authenticated
USING (true);

-- STEP 3: Verify the policies
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'registrations'
ORDER BY policyname;

-- =====================================================
-- EXPECTED:
--   ✅ Allow authenticated delete on registrations → DELETE → {authenticated}
--   ✅ Allow authenticated select on registrations → SELECT → {authenticated}
--   ✅ Allow public insert on registrations        → INSERT → {anon,authenticated}
--
-- The public can still:
--   ✅ INSERT (registration form)
--   ✅ Get the count (via get_registration_count() function)
--
-- The public can NO LONGER:
--   ❌ SELECT/read actual registration rows (names, emails, phones)
-- =====================================================
