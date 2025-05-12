-- Create a storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow authenticated users to upload their own avatar
DROP POLICY IF EXISTS "Avatar upload policy" ON storage.objects;
CREATE POLICY "Avatar upload policy"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = SUBSTRING(name, 9, 36));

-- Allow users to update their own avatar
DROP POLICY IF EXISTS "Avatar update policy" ON storage.objects;
CREATE POLICY "Avatar update policy"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = SUBSTRING(name, 9, 36));

-- Allow users to delete their own avatar
DROP POLICY IF EXISTS "Avatar delete policy" ON storage.objects;
CREATE POLICY "Avatar delete policy"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = SUBSTRING(name, 9, 36));

-- Allow public read access to avatars
DROP POLICY IF EXISTS "Avatar public read policy" ON storage.objects;
CREATE POLICY "Avatar public read policy"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
