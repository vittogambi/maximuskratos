-- A command key is an idempotency token for one account, not a global id.
-- Rows already stored are unique on command_key, so the pair (user_id, command_key) is unique too.

DROP INDEX IF EXISTS "accompaniment_decisions_command_key_key";

CREATE UNIQUE INDEX "accompaniment_decisions_user_id_command_key_key"
    ON "accompaniment_decisions"("user_id", "command_key");
