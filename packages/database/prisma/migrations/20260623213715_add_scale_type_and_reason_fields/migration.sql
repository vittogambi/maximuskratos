-- CreateEnum
CREATE TYPE "ScaleType" AS ENUM ('BEHAVIORAL', 'FREQUENCY');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "reason_prompt_es" TEXT,
ADD COLUMN     "reason_threshold" INTEGER,
ADD COLUMN     "scale_type" "ScaleType";
