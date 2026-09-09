-- Lab workbench: question observations, case derivation, finding ledger.
-- Does not touch FASE1 / diagnostic / billing tables.

ALTER TABLE "lab_cases" ADD COLUMN "derived_from_case_id" TEXT;

CREATE INDEX "lab_cases_derived_from_case_id_idx" ON "lab_cases"("derived_from_case_id");

ALTER TABLE "lab_cases" ADD CONSTRAINT "lab_cases_derived_from_case_id_fkey" FOREIGN KEY ("derived_from_case_id") REFERENCES "lab_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lab_findings" ADD COLUMN "content_change_required" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "lab_finding_cases" ADD COLUMN "supports_finding" TEXT;
ALTER TABLE "lab_finding_cases" ADD COLUMN "rafa_criterion" TEXT;
ALTER TABLE "lab_finding_cases" ADD COLUMN "matrix_result" TEXT;
ALTER TABLE "lab_finding_cases" ADD COLUMN "difference" TEXT;

CREATE TABLE "lab_question_observations" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "case_id" TEXT,
    "run_id" TEXT,
    "reviewer" TEXT NOT NULL,
    "issue_types" TEXT[] NOT NULL,
    "note" TEXT NOT NULL,
    "proposal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "finding_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_question_observations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lab_question_observations_question_id_idx" ON "lab_question_observations"("question_id");
CREATE INDEX "lab_question_observations_case_id_idx" ON "lab_question_observations"("case_id");
CREATE INDEX "lab_question_observations_finding_id_idx" ON "lab_question_observations"("finding_id");

ALTER TABLE "lab_question_observations" ADD CONSTRAINT "lab_question_observations_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "lab_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_question_observations" ADD CONSTRAINT "lab_question_observations_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "lab_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_question_observations" ADD CONSTRAINT "lab_question_observations_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "lab_findings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
