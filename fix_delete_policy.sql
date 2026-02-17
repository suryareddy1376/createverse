-- =====================================================
-- FIX ADMIN DELETE PERMISSIONS
-- =====================================================

-- 1. Enable DELETE for authenticated users on 'teams' table
-- This allows admins to delete a team (registration).
CREATE POLICY "Enable delete for authenticated users on teams"
ON teams
FOR DELETE
TO authenticated
USING (true);

-- 2. Enable DELETE for authenticated users on 'team_members' table
-- This allows admins to delete members directly if needed,
-- and ensures ON DELETE CASCADE works when deleting a team.
CREATE POLICY "Enable delete for authenticated users on team_members"
ON team_members
FOR DELETE
TO authenticated
USING (true);
