-- Occasion interval, pause, substitution and a result separate from the activity record.
-- Existing actions stay weekly and unpaused. Existing records keep a null result.

ALTER TABLE "plan_actions"
    ADD COLUMN "interval_days" INTEGER NOT NULL DEFAULT 7,
    ADD COLUMN "paused_at" TIMESTAMP(3),
    ADD COLUMN "replaces_action_id" TEXT;

ALTER TABLE "action_records"
    ADD COLUMN "result_note" TEXT;
