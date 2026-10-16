-- Plan link, chosen value and purpose revision. Existing rows stay null.
-- The priority note remains the artifact. Past action records are not rewritten.

ALTER TABLE "personal_plans"
    ADD COLUMN "link_kind" TEXT,
    ADD COLUMN "value_ref" TEXT,
    ADD COLUMN "purpose_revision_id" TEXT;
