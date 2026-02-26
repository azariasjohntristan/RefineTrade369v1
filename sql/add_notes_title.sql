-- Add title column to notes table
-- Run this in Supabase SQL Editor

-- Add the title column
ALTER TABLE notes ADD COLUMN title TEXT NOT NULL DEFAULT '';

-- Update existing notes to have a default title
UPDATE notes 
SET title = 'Untitled Note' 
WHERE title IS NULL OR title = '';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notes' AND column_name = 'title';
