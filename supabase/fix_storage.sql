-- ==========================================
-- Migration: Fix Supabase Storage Media Bucket & RLS Policies
-- ==========================================

-- 1. Create public 'media' storage bucket if missing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing media policies if any to avoid duplication
DROP POLICY IF EXISTS "Public Read Media" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload Media" ON storage.objects;
DROP POLICY IF EXISTS "Allow Update Media" ON storage.objects;
DROP POLICY IF EXISTS "Allow Delete Media" ON storage.objects;

-- 3. Public Read Access for 'media' bucket
CREATE POLICY "Public Read Media"
ON storage.objects FOR SELECT
TO anon, authenticated, service_role
USING (bucket_id = 'media');

-- 4. Allow Uploads to 'media' bucket
CREATE POLICY "Allow Upload Media"
ON storage.objects FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (bucket_id = 'media');

-- 5. Allow Updates to 'media' bucket
CREATE POLICY "Allow Update Media"
ON storage.objects FOR UPDATE
TO anon, authenticated, service_role
USING (bucket_id = 'media');

-- 6. Allow Deletions from 'media' bucket
CREATE POLICY "Allow Delete Media"
ON storage.objects FOR DELETE
TO anon, authenticated, service_role
USING (bucket_id = 'media');
