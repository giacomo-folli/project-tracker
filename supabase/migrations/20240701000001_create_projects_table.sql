-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  progress INTEGER DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  share_id UUID DEFAULT gen_random_uuid(),
  is_public BOOLEAN DEFAULT false
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for milestones
DROP POLICY IF EXISTS "Users can view milestones of their own projects" ON milestones;
CREATE POLICY "Users can view milestones of their own projects"
  ON milestones FOR SELECT
  USING ((SELECT user_id FROM projects WHERE id = milestones.project_id) = auth.uid());

DROP POLICY IF EXISTS "Users can create milestones for their own projects" ON milestones;
CREATE POLICY "Users can create milestones for their own projects"
  ON milestones FOR INSERT
  WITH CHECK ((SELECT user_id FROM projects WHERE id = milestones.project_id) = auth.uid());

DROP POLICY IF EXISTS "Users can update milestones of their own projects" ON milestones;
CREATE POLICY "Users can update milestones of their own projects"
  ON milestones FOR UPDATE
  USING ((SELECT user_id FROM projects WHERE id = milestones.project_id) = auth.uid());

DROP POLICY IF EXISTS "Users can delete milestones of their own projects" ON milestones;
CREATE POLICY "Users can delete milestones of their own projects"
  ON milestones FOR DELETE
  USING ((SELECT user_id FROM projects WHERE id = milestones.project_id) = auth.uid());

-- Create policy for public projects
DROP POLICY IF EXISTS "Anyone can view public projects" ON projects;
CREATE POLICY "Anyone can view public projects"
  ON projects FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Anyone can view milestones of public projects" ON milestones;
CREATE POLICY "Anyone can view milestones of public projects"
  ON milestones FOR SELECT
  USING ((SELECT is_public FROM projects WHERE id = milestones.project_id) = true);

-- Enable realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'projects'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE projects;
  END IF;
END
$$;