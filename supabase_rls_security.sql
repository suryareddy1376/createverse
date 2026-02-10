-- =====================================================
-- ROW-LEVEL SECURITY (RLS) for CREATEVERSE
-- Execute this in Supabase SQL Editor to protect your data
-- =====================================================

-- =====================================================
-- 1. REGISTRATIONS TABLE
-- =====================================================

-- Enable RLS on registrations table
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT (public registration form)
CREATE POLICY "Allow public insert on registrations"
ON registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow ONLY authenticated users to SELECT (admin dashboard)
CREATE POLICY "Allow authenticated select on registrations"
ON registrations
FOR SELECT
TO authenticated
USING (true);

-- Allow ONLY authenticated users to DELETE (admin reset)
CREATE POLICY "Allow authenticated delete on registrations"
ON registrations
FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- 2. SETTINGS TABLE
-- =====================================================

-- Enable RLS on settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to SELECT settings (public needs to check if registrations are open)
CREATE POLICY "Allow public select on settings"
ON settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow ONLY authenticated users to INSERT settings
CREATE POLICY "Allow authenticated insert on settings"
ON settings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow ONLY authenticated users to UPDATE settings (toggle registrations, set limit)
CREATE POLICY "Allow authenticated update on settings"
ON settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- DONE! Your data is now protected.
-- 
-- Public users can:
--   ✅ Submit registrations (INSERT)
--   ✅ Read settings (to check if registrations are open)
--   ❌ Cannot read registration data
--   ❌ Cannot delete registrations
--   ❌ Cannot modify settings
--
-- Authenticated admins can:
--   ✅ Do everything above, plus:
--   ✅ View all registrations (SELECT)
--   ✅ Delete registrations (DELETE)
--   ✅ Update settings (UPDATE)
-- =====================================================
