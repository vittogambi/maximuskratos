-- Prisma creó esto como índice único, no como constraint.
-- El DROP CONSTRAINT de la migración anterior no lo quitó.
DROP INDEX IF EXISTS "diagnostic_sessions_user_id_key";
DROP INDEX IF EXISTS "master_profiles_user_id_key";
