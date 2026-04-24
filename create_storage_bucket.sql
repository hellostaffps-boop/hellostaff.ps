-- ============================================================
-- 1. Create the Local Storage Bucket "uploads"
-- ============================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Setup standard bucket policies
-- ============================================================

-- Allow public read
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING ( bucket_id = 'uploads' );

-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Auth Insert" ON storage.objects;
CREATE POLICY "Auth Insert" ON storage.objects
  FOR INSERT WITH CHECK ( bucket_id = 'uploads' AND auth.role() = 'authenticated' );

-- Allow users to update their own files
DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update" ON storage.objects
  FOR UPDATE USING ( auth.uid() = owner ) WITH CHECK ( bucket_id = 'uploads' );

-- Allow users to delete their own files
DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
CREATE POLICY "Auth Delete" ON storage.objects
  FOR DELETE USING ( auth.uid() = owner );
