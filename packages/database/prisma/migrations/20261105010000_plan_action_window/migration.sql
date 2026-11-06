ALTER TABLE "plan_actions" ADD COLUMN IF NOT EXISTS "effective_to" TEXT;
ALTER TABLE "plan_actions" ADD COLUMN IF NOT EXISTS "ended_reason" TEXT;
