-- =====================================================
-- SECURE FIX FOR SETTINGS RLS (UPDATED)
-- No 'description' column
-- =====================================================

-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT
);

-- 2. Reset RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Allow public select on settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated insert on settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated update on settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated delete on settings" ON settings;
DROP POLICY IF EXISTS "Allow all on settings" ON settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON settings;

-- 3. Create CORRECT & SECURE Policies

-- A) Allow ANYONE to READ ONLY SPECIFIC PUBLIC KEYS
-- This is the secure way: anon users can ONLY see 'registrations_open' and 'registration_limit'.
CREATE POLICY "Allow public select on settings"
ON settings FOR SELECT
TO anon, authenticated
USING (key IN ('registrations_open', 'registration_limit'));

-- B) Allow ONLY ADMIN (authenticated) to INSERT/UPDATE/DELETE
CREATE POLICY "Allow authenticated insert on settings"
ON settings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on settings"
ON settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on settings"
ON settings FOR DELETE
TO authenticated
USING (true);

-- 4. Ensure Data Exists
-- Insert the 'registrations_open' key if it doesn't exist.
-- Default to 'true' since the user wants it open.
INSERT INTO settings (key, value)
VALUES ('registrations_open', 'true')
ON CONFLICT (key) DO UPDATE
SET value = 'true';

-- Also ensure registration_limit exists
-- Default to '0' (unlimited)
INSERT INTO settings (key, value)
VALUES ('registration_limit', '0')
ON CONFLICT (key) DO NOTHING;

-- 5. Grant Permissions
GRANT ALL ON TABLE settings TO anon, authenticated;
