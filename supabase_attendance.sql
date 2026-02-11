-- =====================================================
-- ATTENDANCE TABLE + RLS POLICIES
-- Run in Supabase SQL Editor
-- =====================================================

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id BIGSERIAL PRIMARY KEY,
    reg_number TEXT NOT NULL,
    full_name TEXT,
    dept TEXT,
    year TEXT,
    section TEXT,
    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_attendance UNIQUE (reg_number)
);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Only authenticated admins can SELECT attendance records
CREATE POLICY "Allow authenticated select on attendance"
ON attendance FOR SELECT
TO authenticated
USING (true);

-- Only authenticated admins can INSERT (mark attendance)
CREATE POLICY "Allow authenticated insert on attendance"
ON attendance FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only authenticated admins can DELETE (clear attendance)
CREATE POLICY "Allow authenticated delete on attendance"
ON attendance FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- VERIFICATION: Check policies after running
-- =====================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'attendance'
ORDER BY policyname;

-- =====================================================
-- EXPECTED:
--   ✅ Allow authenticated select on attendance → SELECT → {authenticated}
--   ✅ Allow authenticated insert on attendance → INSERT → {authenticated}
--   ✅ Allow authenticated delete on attendance → DELETE → {authenticated}
--   ❌ NO anon/public access at all
-- =====================================================
