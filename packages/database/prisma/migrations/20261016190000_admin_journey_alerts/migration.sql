-- Additive. Existing answers, profiles, purpose revisions and signatures are untouched.

CREATE TABLE "questionnaire_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "occurrence_key" TEXT NOT NULL,
    "question_ref" TEXT NOT NULL,
    "rule_version" TEXT NOT NULL,
    "native_rule" TEXT NOT NULL,
    "product_rule" TEXT NOT NULL,
    "response_revision" INTEGER NOT NULL,
    "response_value" TEXT,
    "catalog_version" TEXT NOT NULL,
    "module_slug" TEXT,
    "answered_at" TIMESTAMP(3),
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provenance" TEXT NOT NULL,

    CONSTRAINT "questionnaire_alerts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "questionnaire_alerts_occurrence_key_key" ON "questionnaire_alerts"("occurrence_key");
CREATE INDEX "questionnaire_alerts_user_id_session_id_detected_at_idx" ON "questionnaire_alerts"("user_id", "session_id", "detected_at");
CREATE INDEX "questionnaire_alerts_question_ref_idx" ON "questionnaire_alerts"("question_ref");

ALTER TABLE "questionnaire_alerts" ADD CONSTRAINT "questionnaire_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questionnaire_alerts" ADD CONSTRAINT "questionnaire_alerts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "diagnostic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "admin_access_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "request_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_access_logs_actor_id_created_at_idx" ON "admin_access_logs"("actor_id", "created_at");
CREATE INDEX "admin_access_logs_target_user_id_created_at_idx" ON "admin_access_logs"("target_user_id", "created_at");
