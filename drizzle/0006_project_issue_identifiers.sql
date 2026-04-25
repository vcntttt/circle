ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "key" text;
--> statement-breakpoint
DO $$
DECLARE
   project_record record;
   raw_key text;
   base_key text;
   candidate_key text;
   suffix integer;
BEGIN
   FOR project_record IN
      SELECT "id", "name", "slug"
      FROM "projects"
      WHERE "key" IS NULL
      ORDER BY "created_at", "id"
   LOOP
      raw_key := regexp_replace(upper(coalesce(nullif(project_record."slug", ''), project_record."name")), '[^A-Z0-9]', '', 'g');

      IF raw_key = '' THEN
         raw_key := 'PR';
      END IF;

      IF raw_key !~ '^[A-Z]' THEN
         raw_key := 'P' || raw_key;
      END IF;

      base_key := left(raw_key, 10);

      IF length(base_key) < 2 THEN
         base_key := rpad(base_key, 2, 'R');
      END IF;

      candidate_key := base_key;
      suffix := 2;

      WHILE EXISTS (
         SELECT 1
         FROM "projects"
         WHERE "key" = candidate_key
            AND "id" <> project_record."id"
      ) LOOP
         candidate_key := left(base_key, 10 - length(suffix::text)) || suffix::text;
         suffix := suffix + 1;
      END LOOP;

      UPDATE "projects"
      SET "key" = candidate_key
      WHERE "id" = project_record."id";
   END LOOP;
END $$;
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "key" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "projects_key_unique" ON "projects" ("key");
--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN IF NOT EXISTS "project_issue_number" integer;
--> statement-breakpoint
UPDATE "issues"
SET "identifier" = '__migration__' || "id"::text;
--> statement-breakpoint
DO $$
DECLARE
   issue_record record;
   identifier_key text;
   next_number integer;
BEGIN
   CREATE TEMP TABLE issue_identifier_counters (
      "key" text PRIMARY KEY,
      "value" integer NOT NULL
   ) ON COMMIT DROP;

   FOR issue_record IN
      SELECT "issues"."id", "projects"."key" AS "project_key"
      FROM "issues"
      LEFT JOIN "projects" ON "issues"."project_id" = "projects"."id"
      ORDER BY "issues"."created_at", "issues"."id"
   LOOP
      identifier_key := coalesce(issue_record."project_key", 'CIRC');

      INSERT INTO issue_identifier_counters ("key", "value")
      VALUES (identifier_key, 1)
      ON CONFLICT ("key") DO UPDATE
         SET "value" = issue_identifier_counters."value" + 1
      RETURNING "value" INTO next_number;

      UPDATE "issues"
      SET
         "identifier" = identifier_key || '-' || next_number::text,
         "project_issue_number" = next_number
      WHERE "id" = issue_record."id";
   END LOOP;
END $$;
