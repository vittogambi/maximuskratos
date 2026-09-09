-- LAB-ONLY: the responses Rafa considered decisive when judging a result.
-- Defaults to an empty array so existing reviews stay valid. Not read by the matrix
-- engine and not part of any definition, snapshot or hash.
ALTER TABLE "lab_reviews" ADD COLUMN "evidence_refs" TEXT[] DEFAULT ARRAY[]::TEXT[];
UPDATE "lab_reviews" SET "evidence_refs" = ARRAY[]::TEXT[] WHERE "evidence_refs" IS NULL;
ALTER TABLE "lab_reviews" ALTER COLUMN "evidence_refs" SET NOT NULL;
