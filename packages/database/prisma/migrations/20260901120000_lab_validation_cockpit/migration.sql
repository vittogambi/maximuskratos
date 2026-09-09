-- Validation cockpit: personal decision vs Matrix prediction, case verdict,
-- findings, facilitator sessions, readiness decisions.
-- Does not touch FASE1 / diagnostic / billing tables.

ALTER TABLE "lab_changesets" ADD COLUMN "finding_id" TEXT;

ALTER TABLE "lab_expectations" ADD COLUMN "personal_first_domain" TEXT;

ALTER TABLE "lab_reviews" ADD COLUMN "no_methodological_problem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "lab_reviews" ADD COLUMN "case_verdict" TEXT;
ALTER TABLE "lab_reviews" ADD COLUMN "hypothesis" TEXT;
ALTER TABLE "lab_reviews" ADD COLUMN "disposition" TEXT;
ALTER TABLE "lab_reviews" ADD COLUMN "linked_finding_id" TEXT;

CREATE TABLE "lab_findings" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "hypothesis" TEXT,
    "current_behavior" TEXT NOT NULL,
    "rafa_expected_behavior" TEXT NOT NULL,
    "related_rules" TEXT[] NOT NULL,
    "evidence_ids" TEXT[] NOT NULL,
    "decision" TEXT,
    "decision_reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_findings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lab_findings_number_key" ON "lab_findings"("number");

CREATE TABLE "lab_finding_cases" (
    "finding_id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,

    CONSTRAINT "lab_finding_cases_pkey" PRIMARY KEY ("finding_id","case_id")
);

CREATE TABLE "lab_finding_consistencies" (
    "id" TEXT NOT NULL,
    "finding_id" TEXT NOT NULL,
    "accepted_case_key" TEXT NOT NULL,
    "rejected_case_key" TEXT NOT NULL,
    "answer" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_finding_consistencies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lab_work_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Sesión con Rafa',
    "casebook_keys" TEXT[] NOT NULL,
    "close_observation_before_changes" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "summary" JSONB,

    CONSTRAINT "lab_work_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lab_work_sessions_created_by_closed_at_idx" ON "lab_work_sessions"("created_by", "closed_at");

CREATE TABLE "lab_readiness_decisions" (
    "id" TEXT NOT NULL,
    "candidate_ref" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "note" TEXT,
    "decided_by" TEXT NOT NULL,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_readiness_decisions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "lab_changesets" ADD CONSTRAINT "lab_changesets_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "lab_findings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lab_finding_cases" ADD CONSTRAINT "lab_finding_cases_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "lab_findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lab_finding_cases" ADD CONSTRAINT "lab_finding_cases_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "lab_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lab_finding_consistencies" ADD CONSTRAINT "lab_finding_consistencies_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "lab_findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
