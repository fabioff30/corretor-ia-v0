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

-- ============================================
-- AUTOMATIC CLEANUP - Choose ONE option below
-- ============================================

-- OPTION 1: Using pg_cron (recommended if available)
-- Supabase Pro plans have pg_cron enabled by default
-- Run this in SQL Editor to enable cleanup every hour:

/*
-- Enable pg_cron extension (requires Supabase Pro)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup job - deletes files older than 24 hours
SELECT cron.schedule(
  'cleanup-document-uploads',
  '0 * * * *',  -- Run every hour
  $$
  DELETE FROM storage.objects
  WHERE bucket_id = 'document-uploads'
  AND created_at < NOW() - INTERVAL '24 hours'
  $$
);

-- To check scheduled jobs:
-- SELECT * FROM cron.job;

-- To remove the job:
-- SELECT cron.unschedule('cleanup-document-uploads');
*/

-- OPTION 2: Manual cleanup function (works on all plans)
-- Call this function periodically via Edge Function or external cron

CREATE OR REPLACE FUNCTION cleanup_old_document_uploads(hours_old INTEGER DEFAULT 24)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM storage.objects
    WHERE bucket_id = 'document-uploads'
    AND created_at < NOW() - (hours_old || ' hours')::INTERVAL
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RAISE NOTICE 'Deleted % old files from document-uploads bucket', deleted_count;
  RETURN deleted_count;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION cleanup_old_document_uploads TO service_role;

-- Example usage:
-- SELECT cleanup_old_document_uploads(24);  -- Delete files older than 24 hours
-- SELECT cleanup_old_document_uploads(1);   -- Delete files older than 1 hour
