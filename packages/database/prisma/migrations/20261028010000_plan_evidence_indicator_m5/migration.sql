-- Additive. Existing evidence keeps null in the three columns.
ALTER TABLE "plan_evidence" ADD COLUMN "indicator_ref" TEXT;
ALTER TABLE "plan_evidence" ADD COLUMN "value" DOUBLE PRECISION;
ALTER TABLE "plan_evidence" ADD COLUMN "period_start" TEXT;

CREATE INDEX "plan_evidence_plan_id_indicator_ref_period_start_idx" ON "plan_evidence"("plan_id", "indicator_ref", "period_start");
