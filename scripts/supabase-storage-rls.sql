-- Remove existing policies if they already exist
DROP POLICY IF EXISTS "Public read access" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload to their own folder"
ON storage.objects;

DROP POLICY IF EXISTS "Users can update their own files"
ON storage.objects;

DROP POLICY IF EXISTS "Users can delete their own files"
ON storage.objects;


-- 1. Public read access
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
USING (true);


-- 2. Upload policy
CREATE POLICY "Authenticated users can upload to their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- 3. Update policy
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- 4. Delete policy
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);