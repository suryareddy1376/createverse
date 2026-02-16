-- =====================================================
-- ENFORCE REGISTRATION LIMIT (SERVER-SIDE)
-- =====================================================

-- 1. CREATE REGISTRATION_STATS TABLE
-- This table tracks the count separately for performance and triggers.
CREATE TABLE IF NOT EXISTS registration_stats (
    id int PRIMARY KEY DEFAULT 1,
    total_count int DEFAULT 0,
    updated_at timestamptz DEFAULT now()
);

-- Initialize with current count (if empty)
INSERT INTO registration_stats (id, total_count)
SELECT 1, COUNT(*) FROM registrations
ON CONFLICT (id) DO UPDATE SET total_count = EXCLUDED.total_count;

-- Enable RLS
ALTER TABLE registration_stats ENABLE ROW LEVEL SECURITY;

-- Allow public read (for UI limit checks)
CREATE POLICY "Allow public read on stats"
ON registration_stats FOR SELECT
TO public
USING (true);

-- 2. CREATE LIMIT CHECK FUNCTION (BEFORE INSERT)
CREATE OR REPLACE FUNCTION check_registration_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner to check limits even if user has restricted access
AS $$
DECLARE
    limit_val int;
    current_count int;
BEGIN
    -- Get the limit from settings
    SELECT value::int INTO limit_val FROM settings WHERE key = 'registration_limit';
    
    -- Get current count from stats table
    SELECT total_count INTO current_count FROM registration_stats WHERE id = 1;
    
    -- If limit is set (> 0) and we've reached it, block insert
    IF limit_val > 0 AND current_count >= limit_val THEN
        RAISE EXCEPTION 'REGISTRATION_LIMIT_REACHED';
    END IF;
    
    RETURN NEW;
END;
$$;

-- 3. CREATE STATS MAINTENANCE FUNCTION (AFTER INSERT/DELETE)
CREATE OR REPLACE FUNCTION maintain_registration_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE registration_stats SET total_count = total_count + 1 WHERE id = 1;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE registration_stats SET total_count = total_count - 1 WHERE id = 1;
    END IF;
    RETURN NULL;
END;
$$;

-- 4. CREATE TRIGGERS
-- A) Check limit BEFORE insert
DROP TRIGGER IF EXISTS check_limit_before_insert ON registrations;
CREATE TRIGGER check_limit_before_insert
BEFORE INSERT ON registrations
FOR EACH ROW EXECUTE FUNCTION check_registration_limit();

-- B) Update stats AFTER insert/delete
DROP TRIGGER IF EXISTS update_stats_after_change ON registrations;
CREATE TRIGGER update_stats_after_change
AFTER INSERT OR DELETE ON registrations
FOR EACH ROW EXECUTE FUNCTION maintain_registration_stats();

-- 5. GRANT PERMISSIONS
GRANT ALL ON TABLE registration_stats TO anon, authenticated;
