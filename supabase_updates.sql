-- =====================================================
-- SQL Updates for CREATEVERSE Registration System
-- Execute these in Supabase SQL Editor
-- =====================================================

-- 1. Add 'year' column to registrations table
-- This adds a new column to store the student's year (1st, 2nd, 3rd, 4th)
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS year TEXT;

-- 2. Add registration_limit setting to settings table
-- Value '0' means unlimited registrations
-- Any positive number sets the maximum registration count
INSERT INTO settings (key, value) 
VALUES ('registration_limit', '0')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- NOTES:
-- - 'year' column will accept text values like '1', '2', '3', '4'
-- - Registration limit of '0' means no limit (unlimited)
-- - Set registration_limit to any positive number to cap registrations
-- - Admins can update the limit from the dashboard after this migration
-- =====================================================
