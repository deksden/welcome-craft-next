-- Migration: Add sparse content columns to Artifact table
-- Replace content column with type-specific columns

-- Add new content columns
ALTER TABLE "Artifact" ADD COLUMN IF NOT EXISTS "content_text" text;
ALTER TABLE "Artifact" ADD COLUMN IF NOT EXISTS "content_url" varchar(2048);
ALTER TABLE "Artifact" ADD COLUMN IF NOT EXISTS "content_site_definition" jsonb;

-- Migrate existing data from content to appropriate columns
-- For text, code, and sheet kinds
UPDATE "Artifact" 
SET "content_text" = CASE 
  WHEN "content" IS NOT NULL THEN "content"::text 
  ELSE NULL 
END
WHERE "kind" IN ('text', 'code', 'sheet');

-- For image kind (content should be URL)
UPDATE "Artifact" 
SET "content_url" = CASE 
  WHEN "content" IS NOT NULL THEN "content"::text 
  ELSE NULL 
END
WHERE "kind" = 'image';

-- For site kind (content should be JSON)
UPDATE "Artifact" 
SET "content_site_definition" = CASE 
  WHEN "content" IS NOT NULL THEN "content"::jsonb 
  ELSE NULL 
END
WHERE "kind" = 'site';

-- Drop the old content column
ALTER TABLE "Artifact" DROP COLUMN IF EXISTS "content";