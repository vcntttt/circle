ALTER TABLE "issues" DROP CONSTRAINT "issues_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "issues" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "identifier" text NOT NULL;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "priority" text DEFAULT 'no-priority' NOT NULL;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "assignee_id" text;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "rank" text NOT NULL;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "due_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_identifier_unique" UNIQUE("identifier");