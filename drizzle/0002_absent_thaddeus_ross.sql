CREATE TABLE "project_priorities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#94a3b8' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_priorities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "project_statuses" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#94a3b8' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
INSERT INTO "project_statuses" ("id", "name", "color", "position") VALUES
	('backlog', 'Backlog', '#ec4899', 0),
	('to-do', 'Todo', '#f97316', 1),
	('in-progress', 'In Progress', '#facc15', 2),
	('technical-review', 'Technical Review', '#22c55e', 3),
	('paused', 'Paused', '#0ea5e9', 4),
	('completed', 'Completed', '#8b5cf6', 5);
--> statement-breakpoint
INSERT INTO "project_priorities" ("id", "name", "color", "position") VALUES
	('no-priority', 'No priority', '#94a3b8', 0),
	('urgent', 'Urgent', '#ef4444', 1),
	('high', 'High', '#f97316', 2),
	('medium', 'Medium', '#facc15', 3),
	('low', 'Low', '#22c55e', 4);
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'backlog';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "priority" text DEFAULT 'no-priority' NOT NULL;--> statement-breakpoint
UPDATE "projects"
SET "status" = 'backlog'
WHERE "status" = 'active'
	OR NOT EXISTS (
		SELECT 1
		FROM "project_statuses"
		WHERE "project_statuses"."id" = "projects"."status"
	);
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_status_project_statuses_id_fk" FOREIGN KEY ("status") REFERENCES "public"."project_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_priority_project_priorities_id_fk" FOREIGN KEY ("priority") REFERENCES "public"."project_priorities"("id") ON DELETE no action ON UPDATE no action;
