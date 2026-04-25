ALTER TABLE "projects"
  ADD COLUMN "icon_type" text DEFAULT 'lucide' NOT NULL,
  ADD COLUMN "icon_value" text DEFAULT 'box' NOT NULL;
