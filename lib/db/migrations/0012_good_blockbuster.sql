CREATE TABLE IF NOT EXISTS "SystemDocs" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"contentHash" varchar(64) NOT NULL,
	"embedding" vector(1536),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"fileSize" integer,
	"mimeType" varchar(100) DEFAULT 'text/markdown'
);
