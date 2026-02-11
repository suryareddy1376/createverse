-- =====================================================
-- 🚨 EMERGENCY RLS FIX — Run in Supabase SQL Editor
-- Created: 2026-02-11
-- Purpose: Remove dangerous public policies and secure data
-- =====================================================

-- =====================================================
-- STEP 1: Remove ALL dangerous policies
-- =====================================================

-- Remove public DELETE on registrations (CRITICAL — anyone can delete all data)
DROP POLICY IF EXISTS "Allow public delete" ON registrations;

-- Remove public SELECT on registrations (CRITICAL — exposes all student PII)
DROP POLICY IF EXISTS "Allow public read" ON registrations;

-- Remove duplicate public INSERT (will be replaced with correct one)
DROP POLICY IF EXISTS "Allow public insert" ON registrations;

-- Remove wildcard ALL policy on settings (CRITICAL — anyone can modify settings)
DROP POLICY IF EXISTS "Allow all on settings" ON settings;

-- =====================================================
-- STEP 2: Verify correct policies exist on REGISTRATIONS
-- =====================================================

-- Allow public INSERT (so the registration form works)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'registrations' 
        AND policyname = 'Allow public insert on registrations'
    ) THEN
        CREATE POLICY "Allow public insert on registrations"
        ON registrations FOR INSERT
        TO anon, authenticated
        WITH CHECK (true);
    END IF;
END $$;

-- Allow only authenticated users to SELECT (admin dashboard)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'registrations' 
        AND policyname = 'Allow authenticated select on registrations'
    ) THEN
        CREATE POLICY "Allow authenticated select on registrations"
        ON registrations FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;

-- Allow only authenticated users to DELETE (admin reset)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'registrations' 
        AND policyname = 'Allow authenticated delete on registrations'
    ) THEN
        CREATE POLICY "Allow authenticated delete on registrations"
        ON registrations FOR DELETE
        TO authenticated
        USING (true);
    END IF;
END $$;

-- =====================================================
-- STEP 3: Verify correct policies exist on SETTINGS
-- =====================================================

-- Allow public SELECT on settings (public needs to check if registrations are open)
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

-- Allow only authenticated users to INSERT settings
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

-- Allow only authenticated users to UPDATE settings
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
-- STEP 4: Add database-level constraints
-- =====================================================

-- Prevent duplicate registrations by reg_number
ALTER TABLE registrations 
ADD CONSTRAINT unique_reg_number UNIQUE (reg_number);

-- Prevent duplicate registrations by email
ALTER TABLE registrations 
ADD CONSTRAINT unique_email UNIQUE (email);

-- Server-side email format validation
ALTER TABLE registrations
ADD CONSTRAINT check_email CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- Server-side mobile number validation (10 digits)
ALTER TABLE registrations
ADD CONSTRAINT check_mobile CHECK (mobile ~ '^\d{10}$');

-- =====================================================
-- STEP 5: Verification — Run this to confirm policies
-- =====================================================

-- Check all active policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('registrations', 'settings')
ORDER BY tablename, policyname;

-- =====================================================
-- EXPECTED RESULT after running this script:
--
-- registrations:
--   ✅ Allow public insert on registrations    → INSERT → {anon,authenticated}
--   ✅ Allow authenticated select on registrations → SELECT → {authenticated}
--   ✅ Allow authenticated delete on registrations → DELETE → {authenticated}
--   ❌ NO public delete
--   ❌ NO public read/select
--
-- settings:
--   ✅ Allow public select on settings          → SELECT → {anon,authenticated}
--   ✅ Allow authenticated insert on settings   → INSERT → {authenticated}
--   ✅ Allow authenticated update on settings   → UPDATE → {authenticated}
--   ❌ NO "Allow all" policy
-- =====================================================
