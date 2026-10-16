-- Aclaración operativa fechada. No modifica respuestas ni puntajes ya guardados.
-- conversation_outcome queda nulo en las acciones existentes.

CREATE TABLE "member_clarifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_clarifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "member_clarifications_user_id_scope_created_at_idx"
    ON "member_clarifications"("user_id", "scope", "created_at");

ALTER TABLE "member_clarifications"
    ADD CONSTRAINT "member_clarifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "plan_actions" ADD COLUMN "conversation_outcome" TEXT;
