-- Additive accompaniment. Older rows keep null provenance, null result status and a null close digest.

ALTER TABLE "member_clarifications"
    ADD COLUMN "subject_ref" TEXT,
    ADD COLUMN "detail" TEXT,
    ADD COLUMN "source" TEXT,
    ADD COLUMN "rules_version" TEXT;

ALTER TABLE "plan_actions"
    ADD COLUMN "origin" TEXT,
    ADD COLUMN "decision_id" TEXT,
    ADD COLUMN "family_id" TEXT,
    ADD COLUMN "template_version" TEXT,
    ADD COLUMN "template_tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "minutes_per_occasion" INTEGER,
    ADD COLUMN "occasions_per_week" INTEGER,
    ADD COLUMN "minimum_version" TEXT,
    ADD COLUMN "alternative" TEXT;

ALTER TABLE "action_records" ADD COLUMN "result_status" TEXT;

ALTER TABLE "week_reviews"
    ADD COLUMN "command_digest" TEXT,
    ADD COLUMN "applied" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "accompaniment_decisions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "engine_version" TEXT NOT NULL,
    "rules_version" TEXT NOT NULL,
    "catalog_version" TEXT NOT NULL,
    "family_id" TEXT,
    "template_version" TEXT,
    "territory" TEXT,
    "pillar" TEXT,
    "mode" TEXT,
    "mode_status" TEXT,
    "situation" TEXT NOT NULL,
    "goal_text" TEXT,
    "goal_kind" TEXT,
    "plan_id" TEXT,
    "purpose_revision_id" TEXT,
    "reading_id" TEXT,
    "context" JSONB NOT NULL,
    "reasons" JSONB NOT NULL,
    "help" JSONB NOT NULL,
    "digest" TEXT NOT NULL,
    "canonical_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reject_reason" TEXT,
    "alternative_of" TEXT,
    "effect" JSONB,
    "command_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accompaniment_decisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accompaniment_decisions_command_key_key" ON "accompaniment_decisions"("command_key");
CREATE INDEX "accompaniment_decisions_user_id_created_at_idx" ON "accompaniment_decisions"("user_id", "created_at");
ALTER TABLE "accompaniment_decisions" ADD CONSTRAINT "accompaniment_decisions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "accompaniment_heads" (
    "user_id" TEXT NOT NULL,
    "decision_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "accompaniment_heads_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "occasion_cancellations" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "rules_version" TEXT NOT NULL,
    "effective_from" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "occasion_cancellations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "occasion_cancellations_action_id_day_key" ON "occasion_cancellations"("action_id", "day");
ALTER TABLE "occasion_cancellations" ADD CONSTRAINT "occasion_cancellations_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "plan_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ikigai_experiments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "combination_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ikigai_experiments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ikigai_experiments_user_id_plan_id_created_at_idx" ON "ikigai_experiments"("user_id", "plan_id", "created_at");
ALTER TABLE "ikigai_experiments" ADD CONSTRAINT "ikigai_experiments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ikigai_experiment_revisions" (
    "id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "sample" TEXT,
    "opportunity" TEXT,
    "missing" TEXT,
    "purpose_revision_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ikigai_experiment_revisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ikigai_experiment_revisions_experiment_id_revision_key" ON "ikigai_experiment_revisions"("experiment_id", "revision");
ALTER TABLE "ikigai_experiment_revisions" ADD CONSTRAINT "ikigai_experiment_revisions_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "ikigai_experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "experiment_observations" (
    "id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "revision_id" TEXT NOT NULL,
    "aspect" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recipient" TEXT,
    "observed" TEXT,
    "source" TEXT NOT NULL DEFAULT 'DECLARED_BY_MEMBER',
    "action_record_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "experiment_observations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "experiment_observations_experiment_id_revision_id_idx" ON "experiment_observations"("experiment_id", "revision_id");
ALTER TABLE "experiment_observations" ADD CONSTRAINT "experiment_observations_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "ikigai_experiment_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "experiment_reviews" (
    "id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "revision_id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "evidence" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "experiment_reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "experiment_reviews_experiment_id_created_at_idx" ON "experiment_reviews"("experiment_id", "created_at");
ALTER TABLE "experiment_reviews" ADD CONSTRAINT "experiment_reviews_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "ikigai_experiment_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
