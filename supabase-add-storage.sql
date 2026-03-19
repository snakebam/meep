-- Run this in Supabase SQL Editor to add file upload support
-- This adds the storage_path column to track uploaded files

ALTER TABLE attachments ADD COLUMN IF NOT EXISTS storage_path text;

-- Create the storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to uploaded files
CREATE POLICY "public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'attachments');

-- Allow anyone to upload files (single-user app)
CREATE POLICY "allow_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'attachments');

-- Allow anyone to delete files
CREATE POLICY "allow_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'attachments');
