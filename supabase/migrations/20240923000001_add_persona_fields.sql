-- Add persona fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS passions TEXT,
ADD COLUMN IF NOT EXISTS work_projects TEXT;

-- Enable realtime for users table
alter publication supabase_realtime add table users;
