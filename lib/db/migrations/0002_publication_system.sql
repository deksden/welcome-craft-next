-- Publication System: Add publication_state to Artifact and published_until to Chat
-- Migration: 0002_publication_system.sql
-- Date: 2025-06-17

-- Add publication_state field to Artifact table
ALTER TABLE "Artifact" ADD COLUMN "publication_state" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint

-- Replace visibility field with published_until in Chat table  
ALTER TABLE "Chat" ADD COLUMN "published_until" timestamp;--> statement-breakpoint
ALTER TABLE "Chat" DROP COLUMN IF EXISTS "visibility";