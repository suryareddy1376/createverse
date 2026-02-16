-- 1. Reset registration_stats to track 'teams' count
TRUNCATE TABLE registration_stats;
INSERT INTO registration_stats (id, total_count)
SELECT 1, COUNT(*) FROM teams;

-- 2. Update stats maintenance function
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

-- 3. Create/Update Triggers on TEAMS table
DROP TRIGGER IF EXISTS check_limit_before_insert ON teams;
CREATE TRIGGER check_limit_before_insert
BEFORE INSERT ON teams
FOR EACH ROW EXECUTE FUNCTION check_registration_limit();

DROP TRIGGER IF EXISTS update_stats_after_change ON teams;
CREATE TRIGGER update_stats_after_change
AFTER INSERT OR DELETE ON teams
FOR EACH ROW EXECUTE FUNCTION maintain_registration_stats();
