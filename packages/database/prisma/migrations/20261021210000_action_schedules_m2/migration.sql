CREATE TABLE "action_schedules" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "kind" TEXT NOT NULL,
    "weekday" INTEGER,
    "interval_days" INTEGER,
    "anchor_day" DATE,
    "occasions_per_week" INTEGER,
    "source" TEXT NOT NULL,
    "command_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_schedules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "action_schedules_action_id_effective_from_idx" ON "action_schedules"("action_id", "effective_from");

ALTER TABLE "action_schedules" ADD CONSTRAINT "action_schedules_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "plan_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
