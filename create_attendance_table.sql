-- Create attendance table if it doesn't exist
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reg_number BIGINT NOT NULL,
    full_name TEXT,
    dept TEXT,
    year TEXT,
    section TEXT,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anon to insert (for now, or restrict to auth if using service role for admin)
-- Since the app uses anon key for everything currently, we allow public insert/select/delete for now.
-- In a real prod app, we'd lock this down to authenticated admins only.

CREATE POLICY "Allow public insert to attendance" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow public delete on attendance" ON attendance FOR DELETE USING (true);
