-- Create bucket for document uploads (files > 4MB)
-- This bucket is used to bypass Vercel's 4.5MB serverless function limit

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-uploads',
  'document-uploads',
  false,  -- Private bucket (requires signed URLs)
  52428800,  -- 50MB max file size
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/html',
    'text/csv',
    'application/xml',
    'text/xml',
    'application/json'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for the bucket

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'document-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'document-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'document-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anonymous uploads to 'anonymous' folder (for guest users)
CREATE POLICY "Anonymous can upload to anonymous folder"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'document-uploads'
  AND (storage.foldername(name))[1] = 'anonymous'
);

-- Allow service role full access (for cleanup jobs)
CREATE POLICY "Service role has full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'document-uploads')
WITH CHECK (bucket_id = 'document-uploads');

-- Create a scheduled job to clean up old files (optional - requires pg_cron extension)
-- Files older than 1 hour should be deleted automatically
-- Note: This requires the pg_cron extension to be enabled in Supabase

-- CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- SELECT cron.schedule(
--   'cleanup-document-uploads',
--   '0 * * * *',  -- Run every hour
--   $$
--   DELETE FROM storage.objects
--   WHERE bucket_id = 'document-uploads'
--   AND created_at < NOW() - INTERVAL '1 hour'
--   $$
-- );
