-- CreateEnum
CREATE TYPE "LabDefinitionStatus" AS ENUM ('CANDIDATE', 'ACCEPTED_CANDIDATE', 'REJECTED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "LabCaseKind" AS ENUM ('REAL', 'SYNTHETIC', 'SELF', 'IMPORTED', 'SIMULATION');

-- CreateEnum
CREATE TYPE "LabRunKind" AS ENUM ('ORIGINAL', 'POLICY', 'REPLAY', 'WHAT_IF');

-- CreateEnum
CREATE TYPE "LabRunStatus" AS ENUM ('COLLECTING', 'AWAITING_EXPECTATION', 'REVEALED', 'FAILED');

-- CreateEnum
CREATE TYPE "LabChangeSetStatus" AS ENUM ('OPEN', 'MATERIALIZED', 'REPLAYED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExperienceDefinitionStatus" AS ENUM ('CANDIDATE', 'ACCEPTED_CANDIDATE', 'REJECTED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "lab_definitions" (
    "id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "definition_ref" TEXT NOT NULL,
    "definition_sha256" TEXT NOT NULL,
    "source_sha256" TEXT NOT NULL,
    "status" "LabDefinitionStatus" NOT NULL,
    "payload" JSONB NOT NULL,
    "base_definition_ref" TEXT,
    "changeset_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_definition_workspaces" (
    "id" TEXT NOT NULL,
    "base_definition_ref" TEXT NOT NULL,
    "pending_operations" JSONB NOT NULL DEFAULT '[]',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_definition_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_changesets" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "base_definition_ref" TEXT NOT NULL,
    "base_definition_sha256" TEXT NOT NULL,
    "target_definition_ref" TEXT,
    "target_definition_sha256" TEXT,
    "operations" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "related_case_ids" TEXT[],
    "related_run_ids" TEXT[],
    "related_review_ids" TEXT[],
    "unmotivated" BOOLEAN NOT NULL DEFAULT false,
    "status" "LabChangeSetStatus" NOT NULL DEFAULT 'OPEN',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_changesets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_cases" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "LabCaseKind" NOT NULL,
    "blind" BOOLEAN NOT NULL DEFAULT true,
    "expert_context" TEXT,
    "fixture_key" TEXT,
    "casebook_key" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "lab_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_runs" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "kind" "LabRunKind" NOT NULL DEFAULT 'ORIGINAL',
    "source_run_id" TEXT,
    "definition_ref" TEXT NOT NULL,
    "definition_sha256" TEXT NOT NULL,
    "source_sha256" TEXT NOT NULL,
    "engine_semver" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "status" "LabRunStatus" NOT NULL DEFAULT 'COLLECTING',
    "responses_hash" TEXT,
    "snapshot" JSONB,
    "frozen_at" TIMESTAMP(3),
    "revealed_at" TIMESTAMP(3),
    "skipped_expectation" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_responses" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "raw_value" TEXT,
    "value_kind" TEXT NOT NULL,
    "qualitative_confirmed" BOOLEAN,
    "source" TEXT NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latency_ms" INTEGER,

    CONSTRAINT "lab_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_expectations" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "expected_states" JSONB NOT NULL,
    "expected_priority_domain" TEXT NOT NULL,
    "expected_plan_id" TEXT,
    "expected_plan_free_text" TEXT,
    "expected_alerts" TEXT[],
    "expected_purpose_stage" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "notes" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_by" TEXT NOT NULL,

    CONSTRAINT "lab_expectations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_reviews" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "verdicts" JSONB NOT NULL,
    "first_wrong_layer" TEXT,
    "root_cause_codes" TEXT[],
    "notes" TEXT,
    "recommended_plan_id" TEXT,
    "post_reveal_states" JSONB,
    "post_reveal_priority_domain" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_by" TEXT NOT NULL,

    CONSTRAINT "lab_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_safety_assessments" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "notes" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_by" TEXT NOT NULL,

    CONSTRAINT "lab_safety_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_expert_purpose_assessments" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "evidence_refs" TEXT[],
    "confidence" TEXT NOT NULL,
    "notes" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_by" TEXT NOT NULL,

    CONSTRAINT "lab_expert_purpose_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_replay_runs" (
    "id" TEXT NOT NULL,
    "changeset_id" TEXT NOT NULL,
    "base_definition_ref" TEXT NOT NULL,
    "candidate_definition_ref" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETE',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_replay_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_replay_results" (
    "id" TEXT NOT NULL,
    "replay_run_id" TEXT NOT NULL,
    "source_run_id" TEXT NOT NULL,
    "base_snapshot" JSONB NOT NULL,
    "candidate_snapshot" JSONB NOT NULL,
    "flags" JSONB NOT NULL,
    "attribution" TEXT NOT NULL,
    "verdict" TEXT,
    "verdict_by" TEXT,
    "verdict_at" TIMESTAMP(3),

    CONSTRAINT "lab_replay_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_definitions" (
    "id" TEXT NOT NULL,
    "experience_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "experience_ref" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "status" "ExperienceDefinitionStatus" NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experience_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direction_versions" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "statement" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "evidence_refs" TEXT[],
    "confidence" TEXT,
    "source" TEXT NOT NULL,
    "supersedes_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direction_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_projection_records" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "experience_ref" TEXT NOT NULL,
    "experience_sha256" TEXT NOT NULL,
    "projection" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experience_projection_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "verdicts" JSONB NOT NULL,
    "purpose_feels" TEXT NOT NULL,
    "still_mk" TEXT NOT NULL,
    "first_product_divergence" TEXT NOT NULL,
    "what_would_change" TEXT,
    "what_was_missing" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_by" TEXT NOT NULL,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lab_definitions_definition_ref_key" ON "lab_definitions"("definition_ref");

-- CreateIndex
CREATE UNIQUE INDEX "lab_definitions_definition_id_revision_key" ON "lab_definitions"("definition_id", "revision");

-- CreateIndex
CREATE INDEX "lab_definitions_definition_sha256_idx" ON "lab_definitions"("definition_sha256");

-- CreateIndex
CREATE UNIQUE INDEX "lab_changesets_target_definition_ref_key" ON "lab_changesets"("target_definition_ref");

-- CreateIndex
CREATE INDEX "lab_cases_kind_idx" ON "lab_cases"("kind");

-- CreateIndex
CREATE INDEX "lab_runs_case_id_idx" ON "lab_runs"("case_id");

-- CreateIndex
CREATE INDEX "lab_runs_definition_ref_idx" ON "lab_runs"("definition_ref");

-- CreateIndex
CREATE UNIQUE INDEX "lab_responses_run_id_question_id_key" ON "lab_responses"("run_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_expectations_run_id_revision_key" ON "lab_expectations"("run_id", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "lab_reviews_run_id_revision_key" ON "lab_reviews"("run_id", "revision");

-- CreateIndex
CREATE INDEX "lab_safety_assessments_run_id_question_id_idx" ON "lab_safety_assessments"("run_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_expert_purpose_assessments_run_id_revision_key" ON "lab_expert_purpose_assessments"("run_id", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "lab_replay_results_replay_run_id_source_run_id_key" ON "lab_replay_results"("replay_run_id", "source_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "experience_definitions_experience_ref_key" ON "experience_definitions"("experience_ref");

-- CreateIndex
CREATE UNIQUE INDEX "experience_definitions_experience_id_revision_key" ON "experience_definitions"("experience_id", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "direction_versions_case_id_revision_key" ON "direction_versions"("case_id", "revision");

-- CreateIndex
CREATE INDEX "experience_projection_records_run_id_idx" ON "experience_projection_records"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_reviews_run_id_revision_key" ON "product_reviews"("run_id", "revision");

-- AddForeignKey
ALTER TABLE "lab_definition_workspaces" ADD CONSTRAINT "lab_definition_workspaces_base_definition_ref_fkey" FOREIGN KEY ("base_definition_ref") REFERENCES "lab_definitions"("definition_ref") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_changesets" ADD CONSTRAINT "lab_changesets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "lab_definition_workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_changesets" ADD CONSTRAINT "lab_changesets_base_definition_ref_fkey" FOREIGN KEY ("base_definition_ref") REFERENCES "lab_definitions"("definition_ref") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_changesets" ADD CONSTRAINT "lab_changesets_target_definition_ref_fkey" FOREIGN KEY ("target_definition_ref") REFERENCES "lab_definitions"("definition_ref") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_runs" ADD CONSTRAINT "lab_runs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "lab_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_runs" ADD CONSTRAINT "lab_runs_definition_ref_fkey" FOREIGN KEY ("definition_ref") REFERENCES "lab_definitions"("definition_ref") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_responses" ADD CONSTRAINT "lab_responses_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "lab_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_expectations" ADD CONSTRAINT "lab_expectations_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "lab_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reviews" ADD CONSTRAINT "lab_reviews_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "lab_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_safety_assessments" ADD CONSTRAINT "lab_safety_assessments_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "lab_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_expert_purpose_assessments" ADD CONSTRAINT "lab_expert_purpose_assessments_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "lab_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_replay_runs" ADD CONSTRAINT "lab_replay_runs_changeset_id_fkey" FOREIGN KEY ("changeset_id") REFERENCES "lab_changesets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_replay_results" ADD CONSTRAINT "lab_replay_results_replay_run_id_fkey" FOREIGN KEY ("replay_run_id") REFERENCES "lab_replay_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_replay_results" ADD CONSTRAINT "lab_replay_results_source_run_id_fkey" FOREIGN KEY ("source_run_id") REFERENCES "lab_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direction_versions" ADD CONSTRAINT "direction_versions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "lab_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_projection_records" ADD CONSTRAINT "experience_projection_records_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "lab_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_projection_records" ADD CONSTRAINT "experience_projection_records_experience_ref_fkey" FOREIGN KEY ("experience_ref") REFERENCES "experience_definitions"("experience_ref") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "lab_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
