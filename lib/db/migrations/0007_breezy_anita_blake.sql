CREATE TABLE IF NOT EXISTS "WorldMeta" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"users" jsonb NOT NULL,
	"artifacts" jsonb NOT NULL,
	"chats" jsonb NOT NULL,
	"settings" jsonb NOT NULL,
	"dependencies" jsonb DEFAULT '[]'::jsonb,
	"isActive" boolean DEFAULT true NOT NULL,
	"isTemplate" boolean DEFAULT false NOT NULL,
	"autoCleanup" boolean DEFAULT true NOT NULL,
	"cleanupAfterHours" integer DEFAULT 24,
	"version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"createdBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastUsedAt" timestamp,
	"usageCount" integer DEFAULT 0,
	"environment" varchar(20) DEFAULT 'LOCAL' NOT NULL,
	"isolationLevel" varchar(20) DEFAULT 'FULL' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"category" varchar(50) DEFAULT 'GENERAL'
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "WorldMeta" ADD CONSTRAINT "WorldMeta_createdBy_User_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
