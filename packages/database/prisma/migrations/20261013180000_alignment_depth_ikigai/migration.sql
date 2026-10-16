-- Additive: alignment snapshots, repeatable core measurements, priority decisions and depth confirmations.
-- PAUSED is a plan status. The new value is not used in this migration.

ALTER TYPE "PersonalPlanStatus" ADD VALUE IF NOT EXISTS 'PAUSED';

ALTER TABLE "personal_plans" ADD COLUMN "source_combination_id" TEXT;

ALTER TABLE "plan_actions"
    ADD COLUMN "preparation" TEXT,
    ADD COLUMN "territory" TEXT,
    ADD COLUMN "effective_from" TEXT;

CREATE TABLE "core_readings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "method_version" TEXT NOT NULL,
    "definition_sha" TEXT NOT NULL,
    "session_id" TEXT,
    "measurement_id" TEXT,
    "baseline_reading_id" TEXT,
    "command_key" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "core_readings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "core_readings_command_key_key" ON "core_readings"("command_key");
CREATE INDEX "core_readings_user_id_method_version_computed_at_idx" ON "core_readings"("user_id", "method_version", "computed_at");
CREATE UNIQUE INDEX "core_readings_initial_alignment" ON "core_readings"("session_id", "method_version") WHERE "kind" = 'INITIAL' AND "method_version" = 'ia-mk-cuest@0.1' AND "session_id" IS NOT NULL;
CREATE UNIQUE INDEX "core_readings_measurement_method" ON "core_readings"("measurement_id", "method_version") WHERE "measurement_id" IS NOT NULL;

ALTER TABLE "core_readings" ADD CONSTRAINT "core_readings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "questionnaire_measurements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "method_version" TEXT NOT NULL,
    "session_id" TEXT,
    "command_key" TEXT NOT NULL,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "questionnaire_measurements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "questionnaire_measurements_command_key_key" ON "questionnaire_measurements"("command_key");
CREATE INDEX "questionnaire_measurements_user_id_status_idx" ON "questionnaire_measurements"("user_id", "status");
ALTER TABLE "questionnaire_measurements" ADD CONSTRAINT "questionnaire_measurements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "measurement_responses" (
    "id" TEXT NOT NULL,
    "measurement_id" TEXT NOT NULL,
    "source_ref" TEXT NOT NULL,
    "value" TEXT,
    "exception_kind" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "answered_at" TIMESTAMP(3),
    CONSTRAINT "measurement_responses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "measurement_responses_measurement_id_source_ref_key" ON "measurement_responses"("measurement_id", "source_ref");
ALTER TABLE "measurement_responses" ADD CONSTRAINT "measurement_responses_measurement_id_fkey" FOREIGN KEY ("measurement_id") REFERENCES "questionnaire_measurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "priority_decisions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "engine_version" TEXT NOT NULL,
    "reading_id" TEXT,
    "digest" TEXT NOT NULL,
    "proposal" JSONB NOT NULL,
    "choice" JSONB NOT NULL,
    "command_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "priority_decisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "priority_decisions_command_key_key" ON "priority_decisions"("command_key");
CREATE INDEX "priority_decisions_user_id_created_at_idx" ON "priority_decisions"("user_id", "created_at");
ALTER TABLE "priority_decisions" ADD CONSTRAINT "priority_decisions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "priority_heads" (
    "user_id" TEXT NOT NULL,
    "decision_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "priority_heads_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "depth_confirmations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "purpose_revision_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "depth_confirmations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "depth_confirmations_user_id_component_created_at_idx" ON "depth_confirmations"("user_id", "component", "created_at");
ALTER TABLE "depth_confirmations" ADD CONSTRAINT "depth_confirmations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
