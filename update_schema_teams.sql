-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    reg_number BIGINT NOT NULL,
    gender TEXT NOT NULL,
    dept TEXT NOT NULL,
    year TEXT NOT NULL,
    section TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile BIGINT NOT NULL,
    is_leader BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for teams
-- Allow anyone to insert (register)
CREATE POLICY "Allow public insert to teams" ON teams FOR INSERT WITH CHECK (true);

-- Allow admins to view all teams (assuming admins are authenticated via Supabase Auth)
-- For public dashboard or similar, you might want to allow public select, but typically teams are private/admin only.
-- However, for now, let's allow public read if needed, or restricting to anon if using the service role for admin.
-- Based on existing pattern, we'll allow public select for now to be safe, or just authenticated.
-- The prompt implies a public registration form.
-- Let's stick to the previous pattern: anon can insert, anon can select (for now, or restrict).

-- Allow anon to see teams? Maybe not necessary for the form itself, but for duplicate checks.
CREATE POLICY "Allow public select on teams" ON teams FOR SELECT USING (true);


-- Create policies for team_members
CREATE POLICY "Allow public insert to team_members" ON team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on team_members" ON team_members FOR SELECT USING (true);


-- Create function to get team count for limits (if needed)
CREATE OR REPLACE FUNCTION get_team_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT count(*) FROM teams);
END;
$$;
