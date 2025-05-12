-- Add foreign key relationship between feed_items and users table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feed_items_user_id_fkey'
  ) THEN
    ALTER TABLE feed_items
    ADD CONSTRAINT feed_items_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS feed_items_user_id_idx ON feed_items(user_id);
CREATE INDEX IF NOT EXISTS feed_items_project_id_idx ON feed_items(project_id);
CREATE INDEX IF NOT EXISTS feed_items_milestone_id_idx ON feed_items(milestone_id);

-- Fix comments and likes relationships if needed
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_user_id_fkey'
  ) THEN
    ALTER TABLE comments
    ADD CONSTRAINT comments_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'likes_user_id_fkey'
  ) THEN
    ALTER TABLE likes
    ADD CONSTRAINT likes_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Update feed_items query to use proper join syntax
DROP VIEW IF EXISTS feed_items_with_details;
CREATE VIEW feed_items_with_details AS
SELECT 
  f.*,
  u.email as user_email,
  p.name as project_title,
  m.title as milestone_title
FROM feed_items f
LEFT JOIN auth.users u ON f.user_id = u.id
LEFT JOIN projects p ON f.project_id = p.id
LEFT JOIN milestones m ON f.milestone_id = m.id;
