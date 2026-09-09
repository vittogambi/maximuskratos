-- AlterTable
ALTER TABLE "lab_reviews" ADD COLUMN "doubted_rules" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "lab_question_observations" ADD COLUMN "aspects" JSONB;
ALTER TABLE "lab_question_observations" ADD COLUMN "proposed_wording" TEXT;
ALTER TABLE "lab_question_observations" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'CONTENT';
ALTER TABLE "lab_question_observations" ADD COLUMN "suggested_operation" JSONB;
