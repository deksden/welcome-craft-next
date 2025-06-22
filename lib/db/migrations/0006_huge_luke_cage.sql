CREATE TABLE IF NOT EXISTS "A_Address" (
	"artifactId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	"streetAddress" text NOT NULL,
	"city" text NOT NULL,
	"state" text,
	"postalCode" varchar(20),
	"country" text NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"timezone" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "A_Address_artifactId_createdAt_pk" PRIMARY KEY("artifactId","createdAt")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "A_FaqItem" (
	"artifactId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text,
	"priority" integer DEFAULT 0,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "A_FaqItem_artifactId_createdAt_pk" PRIMARY KEY("artifactId","createdAt")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "A_Image" (
	"artifactId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	"url" varchar(2048) NOT NULL,
	"altText" text,
	"width" integer,
	"height" integer,
	"fileSize" integer,
	"mimeType" varchar(100),
	CONSTRAINT "A_Image_artifactId_createdAt_pk" PRIMARY KEY("artifactId","createdAt")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "A_Link" (
	"artifactId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	"url" varchar(2048) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"iconUrl" varchar(2048),
	"isInternal" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "A_Link_artifactId_createdAt_pk" PRIMARY KEY("artifactId","createdAt")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "A_Person" (
	"artifactId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	"fullName" text NOT NULL,
	"position" text,
	"photoUrl" varchar(2048),
	"quote" text,
	"email" varchar(255),
	"phone" varchar(50),
	"department" text,
	"location" text,
	CONSTRAINT "A_Person_artifactId_createdAt_pk" PRIMARY KEY("artifactId","createdAt")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "A_SetDefinition" (
	"artifactId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	"definition" jsonb NOT NULL,
	"validationRules" jsonb DEFAULT '{}'::jsonb,
	"defaultSorting" varchar(50) DEFAULT 'createdAt',
	"allowDuplicates" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "A_SetDefinition_artifactId_createdAt_pk" PRIMARY KEY("artifactId","createdAt")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "A_SetItems" (
	"setId" uuid NOT NULL,
	"setCreatedAt" timestamp NOT NULL,
	"itemId" uuid NOT NULL,
	"itemCreatedAt" timestamp NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "A_SetItems_setId_itemId_pk" PRIMARY KEY("setId","itemId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "A_Site" (
	"artifactId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	"siteDefinition" jsonb NOT NULL,
	"theme" varchar(100) DEFAULT 'default',
	"reasoning" text,
	"blocksCount" integer DEFAULT 0,
	"lastOptimized" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "A_Site_artifactId_createdAt_pk" PRIMARY KEY("artifactId","createdAt")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "A_Text" (
	"artifactId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	"content" text NOT NULL,
	"wordCount" integer,
	"charCount" integer,
	"language" varchar(10),
	CONSTRAINT "A_Text_artifactId_createdAt_pk" PRIMARY KEY("artifactId","createdAt")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "A_Address" ADD CONSTRAINT "A_Address_artifactId_createdAt_Artifact_id_createdAt_fk" FOREIGN KEY ("artifactId","createdAt") REFERENCES "public"."Artifact"("id","createdAt") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "A_FaqItem" ADD CONSTRAINT "A_FaqItem_artifactId_createdAt_Artifact_id_createdAt_fk" FOREIGN KEY ("artifactId","createdAt") REFERENCES "public"."Artifact"("id","createdAt") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "A_Image" ADD CONSTRAINT "A_Image_artifactId_createdAt_Artifact_id_createdAt_fk" FOREIGN KEY ("artifactId","createdAt") REFERENCES "public"."Artifact"("id","createdAt") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "A_Link" ADD CONSTRAINT "A_Link_artifactId_createdAt_Artifact_id_createdAt_fk" FOREIGN KEY ("artifactId","createdAt") REFERENCES "public"."Artifact"("id","createdAt") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "A_Person" ADD CONSTRAINT "A_Person_artifactId_createdAt_Artifact_id_createdAt_fk" FOREIGN KEY ("artifactId","createdAt") REFERENCES "public"."Artifact"("id","createdAt") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "A_SetDefinition" ADD CONSTRAINT "A_SetDefinition_artifactId_createdAt_Artifact_id_createdAt_fk" FOREIGN KEY ("artifactId","createdAt") REFERENCES "public"."Artifact"("id","createdAt") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "A_SetItems" ADD CONSTRAINT "A_SetItems_setId_setCreatedAt_Artifact_id_createdAt_fk" FOREIGN KEY ("setId","setCreatedAt") REFERENCES "public"."Artifact"("id","createdAt") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "A_SetItems" ADD CONSTRAINT "A_SetItems_itemId_itemCreatedAt_Artifact_id_createdAt_fk" FOREIGN KEY ("itemId","itemCreatedAt") REFERENCES "public"."Artifact"("id","createdAt") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "A_Site" ADD CONSTRAINT "A_Site_artifactId_createdAt_Artifact_id_createdAt_fk" FOREIGN KEY ("artifactId","createdAt") REFERENCES "public"."Artifact"("id","createdAt") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "A_Text" ADD CONSTRAINT "A_Text_artifactId_createdAt_Artifact_id_createdAt_fk" FOREIGN KEY ("artifactId","createdAt") REFERENCES "public"."Artifact"("id","createdAt") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "Artifact" DROP COLUMN IF EXISTS "content_text";--> statement-breakpoint
ALTER TABLE "Artifact" DROP COLUMN IF EXISTS "content_url";--> statement-breakpoint
ALTER TABLE "Artifact" DROP COLUMN IF EXISTS "content_site_definition";