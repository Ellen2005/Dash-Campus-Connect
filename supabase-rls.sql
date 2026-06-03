-- ============================================================
-- DASH PLATFORM — Supabase Storage & Database RLS Policies
-- Run this entire script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Storage Buckets ───────────────────────────────────────
-- Create buckets (safe to run even if they already exist)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('posts',       'posts',       true),
  ('avatars',     'avatars',     true),
  ('covers',      'covers',      true),
  ('stories',     'stories',     true),
  ('events',      'events',      true),
  ('marketplace', 'marketplace', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- ── 2. Storage Policies ──────────────────────────────────────
-- Drop old conflicting policies (safe to run repeatedly)
DO $$
DECLARE
  bucket_name TEXT;
  buckets TEXT[] := ARRAY['posts','avatars','covers','stories','events','marketplace'];
BEGIN
  FOREACH bucket_name IN ARRAY buckets LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public read %1$s" ON storage.objects', bucket_name);
    EXECUTE format('DROP POLICY IF EXISTS "Auth upload %1$s" ON storage.objects', bucket_name);
    EXECUTE format('DROP POLICY IF EXISTS "Owner update %1$s" ON storage.objects', bucket_name);
    EXECUTE format('DROP POLICY IF EXISTS "Owner delete %1$s" ON storage.objects', bucket_name);
  END LOOP;
END $$;

-- Public READ for all buckets (anyone can view images)
CREATE POLICY "Public read posts"       ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "Public read avatars"     ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public read covers"      ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Public read stories"     ON storage.objects FOR SELECT USING (bucket_id = 'stories');
CREATE POLICY "Public read events"      ON storage.objects FOR SELECT USING (bucket_id = 'events');
CREATE POLICY "Public read marketplace" ON storage.objects FOR SELECT USING (bucket_id = 'marketplace');

-- Authenticated INSERT for all buckets
CREATE POLICY "Auth upload posts"       ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posts'       AND auth.role() = 'authenticated');
CREATE POLICY "Auth upload avatars"     ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars'     AND auth.role() = 'authenticated');
CREATE POLICY "Auth upload covers"      ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers'      AND auth.role() = 'authenticated');
CREATE POLICY "Auth upload stories"     ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stories'     AND auth.role() = 'authenticated');
CREATE POLICY "Auth upload events"      ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'events'      AND auth.role() = 'authenticated');
CREATE POLICY "Auth upload marketplace" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketplace' AND auth.role() = 'authenticated');

-- Owner UPDATE (user can only update their own files)
CREATE POLICY "Owner update posts"       ON storage.objects FOR UPDATE USING (bucket_id = 'posts'       AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update avatars"     ON storage.objects FOR UPDATE USING (bucket_id = 'avatars'     AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update covers"      ON storage.objects FOR UPDATE USING (bucket_id = 'covers'      AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update stories"     ON storage.objects FOR UPDATE USING (bucket_id = 'stories'     AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update events"      ON storage.objects FOR UPDATE USING (bucket_id = 'events'      AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update marketplace" ON storage.objects FOR UPDATE USING (bucket_id = 'marketplace' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Owner DELETE
CREATE POLICY "Owner delete posts"       ON storage.objects FOR DELETE USING (bucket_id = 'posts'       AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete avatars"     ON storage.objects FOR DELETE USING (bucket_id = 'avatars'     AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete covers"      ON storage.objects FOR DELETE USING (bucket_id = 'covers'      AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete stories"     ON storage.objects FOR DELETE USING (bucket_id = 'stories'     AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete events"      ON storage.objects FOR DELETE USING (bucket_id = 'events'      AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete marketplace" ON storage.objects FOR DELETE USING (bucket_id = 'marketplace' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── 3. Done ───────────────────────────────────────────────────
-- Storage RLS policies applied. Uploads from authenticated users will work.
-- Public images are readable by anyone (needed for img src display).
