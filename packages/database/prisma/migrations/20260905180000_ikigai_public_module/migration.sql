-- Ikigai public module (Alpha Fast). Definition stays DRAFT until Rafa publishes.

CREATE TYPE "IkigaiDefinitionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');
CREATE TYPE "IkigaiSessionStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'COMPLETED', 'FOLLOW_UP', 'ARCHIVED');

CREATE TABLE "ikigai_definitions" (
    "id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "ref" TEXT NOT NULL,
    "status" "IkigaiDefinitionStatus" NOT NULL DEFAULT 'DRAFT',
    "sha256" TEXT NOT NULL,
    "engine_min" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ikigai_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ikigai_definitions_ref_key" ON "ikigai_definitions"("ref");
CREATE UNIQUE INDEX "ikigai_definitions_definition_id_revision_key" ON "ikigai_definitions"("definition_id", "revision");
CREATE INDEX "ikigai_definitions_status_idx" ON "ikigai_definitions"("status");

CREATE TABLE "ikigai_sessions" (
    "id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "token_hash" TEXT,
    "status" "IkigaiSessionStatus" NOT NULL DEFAULT 'NEW',
    "current_step" TEXT NOT NULL DEFAULT 'PASION',
    "draft_version" INTEGER NOT NULL DEFAULT 0,
    "draft" JSONB NOT NULL,
    "source" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ikigai_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ikigai_sessions_token_hash_key" ON "ikigai_sessions"("token_hash");
CREATE INDEX "ikigai_sessions_status_last_activity_at_idx" ON "ikigai_sessions"("status", "last_activity_at");
CREATE INDEX "ikigai_sessions_definition_id_idx" ON "ikigai_sessions"("definition_id");

CREATE TABLE "ikigai_result_snapshots" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "definition_ref" TEXT NOT NULL,
    "engine_version" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ikigai_result_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ikigai_result_snapshots_session_id_revision_key" ON "ikigai_result_snapshots"("session_id", "revision");

ALTER TABLE "ikigai_sessions" ADD CONSTRAINT "ikigai_sessions_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "ikigai_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ikigai_result_snapshots" ADD CONSTRAINT "ikigai_result_snapshots_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ikigai_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
