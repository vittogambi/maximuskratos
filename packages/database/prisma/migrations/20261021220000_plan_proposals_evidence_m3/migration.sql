CREATE TABLE "plan_proposals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "territory" TEXT,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "reasons" JSONB,
    "basis" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "edited_payload" JSONB,
    "decided_at" TIMESTAMP(3),
    "engine_version" TEXT,
    "rules_version" TEXT,
    "template_ref" TEXT,
    "digest" TEXT,
    "command_key" TEXT,
    "supersedes_id" TEXT,
    "effect" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_proposals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_proposals_user_id_command_key_key" ON "plan_proposals"("user_id", "command_key");
CREATE INDEX "plan_proposals_plan_id_created_at_idx" ON "plan_proposals"("plan_id", "created_at");

ALTER TABLE "plan_proposals" ADD CONSTRAINT "plan_proposals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_proposals" ADD CONSTRAINT "plan_proposals_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "personal_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "plan_evidence" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "criterion_revision" INTEGER NOT NULL,
    "observed_on" DATE NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "text" TEXT,
    "action_record_id" TEXT,
    "source" TEXT NOT NULL DEFAULT 'DECLARED_BY_MEMBER',
    "command_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_evidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "plan_evidence_plan_id_observed_on_idx" ON "plan_evidence"("plan_id", "observed_on");

ALTER TABLE "plan_evidence" ADD CONSTRAINT "plan_evidence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_evidence" ADD CONSTRAINT "plan_evidence_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "personal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
