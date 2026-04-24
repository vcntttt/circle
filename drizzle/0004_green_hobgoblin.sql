ALTER TABLE "issues" ADD COLUMN "parent_issue_id" uuid;
--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_parent_issue_id_issues_id_fk" FOREIGN KEY ("parent_issue_id") REFERENCES "public"."issues"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "issues_parent_issue_id_idx" ON "issues" USING btree ("parent_issue_id");
