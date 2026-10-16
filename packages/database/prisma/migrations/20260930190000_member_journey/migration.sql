-- Historial de sesión y perfil, catálogo versionado, hoja de ruta, planes y semana.
-- No modifica filas de respuestas ni puntajes ya guardados.

CREATE TYPE "DiagnosticSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');
CREATE TYPE "PersonalPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "ActionRecordStatus" AS ENUM ('PENDING', 'DONE', 'SKIPPED', 'NOT_APPLICABLE');

ALTER TABLE "diagnostic_versions"
  ADD COLUMN "definition_ref" TEXT,
  ADD COLUMN "definition_sha256" TEXT;

ALTER TABLE "diagnostic_sessions" DROP CONSTRAINT IF EXISTS "diagnostic_sessions_user_id_key";
ALTER TABLE "diagnostic_sessions"
  ADD COLUMN "status" "DiagnosticSessionStatus" NOT NULL DEFAULT 'ACTIVE';
UPDATE "diagnostic_sessions"
  SET "status" = 'COMPLETED'
  WHERE "completed_at" IS NOT NULL;

CREATE UNIQUE INDEX "diagnostic_sessions_one_active"
  ON "diagnostic_sessions" ("user_id")
  WHERE "status" = 'ACTIVE';
CREATE INDEX "diagnostic_sessions_user_id_status_idx"
  ON "diagnostic_sessions" ("user_id", "status");

ALTER TABLE "master_profiles" DROP CONSTRAINT IF EXISTS "master_profiles_user_id_key";
ALTER TABLE "master_profiles"
  ADD COLUMN "is_current" BOOLEAN NOT NULL DEFAULT false;
UPDATE "master_profiles" SET "is_current" = true;
CREATE INDEX "master_profiles_user_id_is_current_idx"
  ON "master_profiles" ("user_id", "is_current");
CREATE UNIQUE INDEX "master_profiles_one_current"
  ON "master_profiles" ("user_id")
  WHERE "is_current" = true;

ALTER TABLE "responses" ADD COLUMN "skipped" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "diagnostic_form_results" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "form_code" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "diagnostic_form_results_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "diagnostic_form_results_session_id_form_code_key"
  ON "diagnostic_form_results" ("session_id", "form_code");
ALTER TABLE "diagnostic_form_results"
  ADD CONSTRAINT "diagnostic_form_results_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "diagnostic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "purpose_revisions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "session_id" TEXT,
  "revision" INTEGER NOT NULL,
  "content" JSONB NOT NULL,
  "confirmed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "purpose_revisions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "purpose_revisions_user_id_revision_key" ON "purpose_revisions" ("user_id", "revision");
ALTER TABLE "purpose_revisions"
  ADD CONSTRAINT "purpose_revisions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "personal_plans" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "priority_note" TEXT,
  "status" "PersonalPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "personal_plans_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "personal_plans_user_id_status_idx" ON "personal_plans" ("user_id", "status");
ALTER TABLE "personal_plans"
  ADD CONSTRAINT "personal_plans_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "plan_actions" (
  "id" TEXT NOT NULL,
  "plan_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "done_when" TEXT NOT NULL,
  "weekday" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plan_actions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "plan_actions_plan_id_idx" ON "plan_actions" ("plan_id");
ALTER TABLE "plan_actions"
  ADD CONSTRAINT "plan_actions_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "personal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "action_records" (
  "id" TEXT NOT NULL,
  "action_id" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "status" "ActionRecordStatus" NOT NULL DEFAULT 'PENDING',
  "note" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "action_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "action_records_action_id_day_key" ON "action_records" ("action_id", "day");
ALTER TABLE "action_records"
  ADD CONSTRAINT "action_records_action_id_fkey"
  FOREIGN KEY ("action_id") REFERENCES "plan_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "week_reviews" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "week_start" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'America/Santiago',
  "snapshot" JSONB NOT NULL,
  "note" TEXT,
  "closed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "week_reviews_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "week_reviews_user_id_week_start_key" ON "week_reviews" ("user_id", "week_start");
ALTER TABLE "week_reviews"
  ADD CONSTRAINT "week_reviews_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "guidance_requests" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SENT',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "guidance_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "guidance_requests_user_id_idx" ON "guidance_requests" ("user_id");
ALTER TABLE "guidance_requests"
  ADD CONSTRAINT "guidance_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
