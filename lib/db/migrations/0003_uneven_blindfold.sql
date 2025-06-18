ALTER TABLE "Artifact" ADD COLUMN "world_id" varchar(64);--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "world_id" varchar(64);--> statement-breakpoint
ALTER TABLE "Message_v2" ADD COLUMN "world_id" varchar(64);--> statement-breakpoint
ALTER TABLE "Suggestion" ADD COLUMN "world_id" varchar(64);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "world_id" varchar(64);