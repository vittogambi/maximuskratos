-- AlterTable
ALTER TABLE "lab_question_observations" ADD COLUMN "fidelity" JSONB;

-- CreateTable
CREATE TABLE "lab_migration_decisions" (
    "id" TEXT NOT NULL,
    "rafa_verdict" TEXT,
    "rafa_note" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_migration_decisions_pkey" PRIMARY KEY ("id")
);
