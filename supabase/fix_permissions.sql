-- ==========================================
-- Migration: Fix Permissions & Assign Admin Roles
-- ==========================================

-- 1. Safely add 'admin' and 'customer' values to app_role enum if missing
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';

-- 2. Update handle_new_user trigger function to grant 'customer' role on registration by default
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 4. Ensure permissions on user_roles & functions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.user_roles TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;


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

-- Default display_order to 1 to prevent NOT NULL constraint error
ALTER TABLE public.banners ALTER COLUMN display_order SET DEFAULT 1;
