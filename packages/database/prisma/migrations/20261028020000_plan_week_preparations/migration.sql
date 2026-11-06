CREATE TABLE "plan_week_preparations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "week_start" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "minimum" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "review_outcomes" JSONB,
    "command_key" TEXT,
    "frozen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_week_preparations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_week_preparations_user_id_plan_id_week_start_key" ON "plan_week_preparations"("user_id", "plan_id", "week_start");

CREATE INDEX "plan_week_preparations_user_id_plan_id_idx" ON "plan_week_preparations"("user_id", "plan_id");

ALTER TABLE "plan_week_preparations" ADD CONSTRAINT "plan_week_preparations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "plan_week_preparations" ADD CONSTRAINT "plan_week_preparations_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "personal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
