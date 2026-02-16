-- Drop obsolete registrations table
-- (registration_stats is PRESERVED and will be migrated to track teams)
DROP TABLE IF EXISTS registrations CASCADE;
