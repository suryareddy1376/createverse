-- =====================================================
-- DEBUG & FIX (DROP TRIGGERS, FIX SETTINGS)
-- =====================================================

-- 1. DROP ALL TRIGGERS ON REGISTRATIONS
-- If there's a trigger trying to insert into another table (like logs or emails)
-- and THAT table has restrictive RLS, the whole transaction fails.
DROP TRIGGER IF EXISTS on_registration_created ON registrations;
DROP TRIGGER IF EXISTS send_email_on_registration ON registrations;
DROP TRIGGER IF EXISTS log_registration ON registrations;

-- 2. ENSURE SETTINGS TABLE IS ACCESSIBLE
-- The form loads settings first. If this fails, the UI might break or
-- the subsequent insert might carry invalid state.
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE settings TO anon, authenticated;

DROP POLICY IF EXISTS "Enable read access for all users" ON settings;
CREATE POLICY "Enable read access for all users"
ON settings FOR SELECT
TO public
USING (true);

-- 3. RE-APPLY REGISTRATIONS PERMISSIONS (Just to be 100% sure)
GRANT ALL ON TABLE registrations TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE registrations_id_seq TO anon, authenticated;

-- 4. ENSURE PUBLIC INSERT POLICY EXISTS
DROP POLICY IF EXISTS "Enable public insert" ON registrations;
CREATE POLICY "Enable public insert"
ON registrations FOR INSERT
TO public
WITH CHECK (true);
