-- Revisión de respuesta y excepciones. Las filas ya guardadas quedan en revisión 0, sin excepción.

ALTER TABLE "questions"
    ADD COLUMN "allowed_exceptions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "responses"
    ADD COLUMN "exception_kind" TEXT,
    ADD COLUMN "exception_origin" TEXT,
    ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "response_revisions" (
    "id" TEXT NOT NULL,
    "response_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "free_text" TEXT,
    "selected_option_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "exception_kind" TEXT,
    "exception_origin" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "response_revisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "response_revisions_response_id_revision_idx"
    ON "response_revisions"("response_id", "revision");

ALTER TABLE "response_revisions"
    ADD CONSTRAINT "response_revisions_response_id_fkey"
    FOREIGN KEY ("response_id") REFERENCES "responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
