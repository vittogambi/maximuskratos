-- M1 plan lifecycle: additive columns on personal_plans and plan_transitions.

ALTER TABLE "personal_plans"
    ADD COLUMN "stage" TEXT,
    ADD COLUMN "goal_class" TEXT,
    ADD COLUMN "entry" TEXT,
    ADD COLUMN "territory" TEXT,
    ADD COLUMN "why_it_matters" TEXT,
    ADD COLUMN "why_status" TEXT,
    ADD COLUMN "why_refs" JSONB,
    ADD COLUMN "link_status" TEXT,
    ADD COLUMN "baseline" TEXT,
    ADD COLUMN "criterion_text" TEXT,
    ADD COLUMN "criterion_status" TEXT,
    ADD COLUMN "criterion_revision" INTEGER,
    ADD COLUMN "review_at" DATE,
    ADD COLUMN "expected_signal" TEXT,
    ADD COLUMN "capacity_minutes" INTEGER,
    ADD COLUMN "protect_note" TEXT,
    ADD COLUMN "activated_at" TIMESTAMP(3),
    ADD COLUMN "achieved_at" TIMESTAMP(3),
    ADD COLUMN "closed_reason" TEXT,
    ADD COLUMN "is_focus" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "focus_since" TIMESTAMP(3),
    ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX "personal_plans_one_focus_per_user"
    ON "personal_plans" ("user_id")
    WHERE "is_focus" = true;

CREATE TABLE "plan_transitions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "from_stage" TEXT,
    "to_stage" TEXT NOT NULL,
    "reason" TEXT,
    "effective_from" DATE,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_transitions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "plan_transitions_plan_id_created_at_idx" ON "plan_transitions"("plan_id", "created_at");
CREATE INDEX "plan_transitions_user_id_created_at_idx" ON "plan_transitions"("user_id", "created_at");

ALTER TABLE "plan_transitions" ADD CONSTRAINT "plan_transitions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_transitions" ADD CONSTRAINT "plan_transitions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "personal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
