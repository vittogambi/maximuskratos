-- CreateEnum
CREATE TYPE "DiagnosticPhase" AS ENUM ('FASE1', 'FASE2', 'FASE3');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTI_CHOICE', 'SCALE_1_5', 'FREE_TEXT', 'RANKING');

-- CreateEnum
CREATE TYPE "ModuleStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('ALTO_AUTOENGANO', 'INCONGRUENCIA_NARRATIVA', 'RIESGO_FINANCIERO', 'RIESGO_ABANDONO', 'FALTA_PROPOSITO', 'ENTORNO_TOXICO', 'BAJA_EJECUCION', 'SOBRECONFIANZA', 'RESPUESTAS_INCONSISTENTES');

-- CreateTable
CREATE TABLE "diagnostic_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnostic_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_modules" (
    "id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "phase" "DiagnosticPhase" NOT NULL,
    "dimension_key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title_es" TEXT NOT NULL,
    "intro_es" TEXT NOT NULL,
    "outro_template_es" TEXT NOT NULL,
    "icon_key" TEXT,
    "estimated_minutes" INTEGER NOT NULL,
    "is_conditional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "diagnostic_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL,
    "text_es" TEXT NOT NULL,
    "context_es" TEXT,
    "is_consistency_check" BOOLEAN NOT NULL DEFAULT false,
    "max_selections" INTEGER,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text_es" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "score_deltas" JSONB NOT NULL,
    "flags" TEXT[],
    "tags" TEXT[],

    CONSTRAINT "answer_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "current_phase" "DiagnosticPhase" NOT NULL DEFAULT 'FASE1',
    "current_module_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "diagnostic_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_module_progress" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "status" "ModuleStatus" NOT NULL DEFAULT 'LOCKED',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "outro_seen" BOOLEAN NOT NULL DEFAULT false,
    "outro_text" TEXT,

    CONSTRAINT "user_module_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responses" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_option_ids" TEXT[],
    "free_text" TEXT,
    "ranking_order" TEXT[],
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latency_ms" INTEGER,
    "edit_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_snapshots" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "triggered_by" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "subscores" JSONB NOT NULL,
    "indices" JSONB NOT NULL,
    "confidence" JSONB NOT NULL,
    "completion_pct" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phase" "DiagnosticPhase",
    "trigger" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_alerts" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "motivo" TEXT NOT NULL,
    "evidencia" JSONB NOT NULL,
    "accion_sugerida" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_actioned" BOOLEAN NOT NULL DEFAULT false,
    "action_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "admin_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnostic_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discoveries" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "dimension_key" TEXT NOT NULL,
    "text_es" TEXT NOT NULL,
    "template_slug" TEXT NOT NULL,
    "seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discoveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title_es" TEXT NOT NULL,
    "description_es" TEXT NOT NULL,
    "icon_key" TEXT,
    "unlock_condition" JSONB NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "archetype_primary" TEXT NOT NULL,
    "archetype_secondary" TEXT,
    "strengths" JSONB NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "potentials" JSONB NOT NULL,
    "bottlenecks" JSONB NOT NULL,
    "priorities" JSONB NOT NULL,
    "scores" JSONB NOT NULL,
    "indices" JSONB NOT NULL,
    "segment_tags" TEXT[],
    "recommendation_seeds" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_seeds" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dimension_key" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_seeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AnswerOptionToResponse" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AnswerOptionToResponse_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "diagnostic_versions_version_key" ON "diagnostic_versions"("version");

-- CreateIndex
CREATE INDEX "diagnostic_modules_phase_idx" ON "diagnostic_modules"("phase");

-- CreateIndex
CREATE UNIQUE INDEX "diagnostic_modules_version_id_slug_key" ON "diagnostic_modules"("version_id", "slug");

-- CreateIndex
CREATE INDEX "questions_module_id_idx" ON "questions"("module_id");

-- CreateIndex
CREATE INDEX "answer_options_question_id_idx" ON "answer_options"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "diagnostic_sessions_user_id_key" ON "diagnostic_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_module_progress_session_id_module_id_key" ON "user_module_progress"("session_id", "module_id");

-- CreateIndex
CREATE INDEX "responses_session_id_idx" ON "responses"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "responses_session_id_question_id_key" ON "responses"("session_id", "question_id");

-- CreateIndex
CREATE INDEX "score_snapshots_session_id_idx" ON "score_snapshots"("session_id");

-- CreateIndex
CREATE INDEX "score_snapshots_created_at_idx" ON "score_snapshots"("created_at");

-- CreateIndex
CREATE INDEX "rules_phase_idx" ON "rules"("phase");

-- CreateIndex
CREATE UNIQUE INDEX "rules_version_id_slug_key" ON "rules"("version_id", "slug");

-- CreateIndex
CREATE INDEX "admin_alerts_session_id_idx" ON "admin_alerts"("session_id");

-- CreateIndex
CREATE INDEX "admin_alerts_severity_idx" ON "admin_alerts"("severity");

-- CreateIndex
CREATE INDEX "admin_alerts_is_read_idx" ON "admin_alerts"("is_read");

-- CreateIndex
CREATE INDEX "diagnostic_events_session_id_idx" ON "diagnostic_events"("session_id");

-- CreateIndex
CREATE INDEX "diagnostic_events_type_idx" ON "diagnostic_events"("type");

-- CreateIndex
CREATE INDEX "diagnostic_events_created_at_idx" ON "diagnostic_events"("created_at");

-- CreateIndex
CREATE INDEX "discoveries_session_id_idx" ON "discoveries"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_slug_key" ON "achievements"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "master_profiles_user_id_key" ON "master_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "master_profiles_session_id_key" ON "master_profiles"("session_id");

-- CreateIndex
CREATE INDEX "recommendation_seeds_session_id_idx" ON "recommendation_seeds"("session_id");

-- CreateIndex
CREATE INDEX "_AnswerOptionToResponse_B_index" ON "_AnswerOptionToResponse"("B");

-- AddForeignKey
ALTER TABLE "diagnostic_modules" ADD CONSTRAINT "diagnostic_modules_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "diagnostic_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "diagnostic_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_options" ADD CONSTRAINT "answer_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "diagnostic_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "diagnostic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "diagnostic_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "diagnostic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_snapshots" ADD CONSTRAINT "score_snapshots_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "diagnostic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "diagnostic_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_alerts" ADD CONSTRAINT "admin_alerts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "diagnostic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_events" ADD CONSTRAINT "diagnostic_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "diagnostic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discoveries" ADD CONSTRAINT "discoveries_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "diagnostic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_profiles" ADD CONSTRAINT "master_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_profiles" ADD CONSTRAINT "master_profiles_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "diagnostic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_seeds" ADD CONSTRAINT "recommendation_seeds_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "diagnostic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnswerOptionToResponse" ADD CONSTRAINT "_AnswerOptionToResponse_A_fkey" FOREIGN KEY ("A") REFERENCES "answer_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnswerOptionToResponse" ADD CONSTRAINT "_AnswerOptionToResponse_B_fkey" FOREIGN KEY ("B") REFERENCES "responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
