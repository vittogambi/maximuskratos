-- The workbook 260529 Formularios por paso was keyed with the recipient's name.
-- Stored catalog ids now say what they are: the questionnaire, not the recipient.

CREATE OR REPLACE FUNCTION public.rename_formulario_ids(input text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT replace(
    replace(
      replace(
        replace(
          replace(
            replace(coalesce(input, ''), '260529-FORMULARIOS-X-PASO-Lucas (1).xlsx', '260529-FORMULARIOS-X-PASO.xlsx'),
          '260529-FORMULARIOS-X-PASO-Lucas', '260529-FORMULARIOS-X-PASO'),
        'formularios-lucas', 'formularios-x-paso'),
      'lucas-completo', 'formulario-completo'),
    'lucas-score', 'formulario-score'),
  'lucas-v1:', 'formulario-v1:');
$$;

DO $$
DECLARE
  rec record;
  new_version text;
  duplicate_id text;
BEGIN
  FOR rec IN
    SELECT id, version
    FROM diagnostic_versions
    WHERE version LIKE 'lucas-completo@%' OR version = 'formularios-lucas'
    ORDER BY version
  LOOP
    new_version := public.rename_formulario_ids(rec.version);
    SELECT id INTO duplicate_id FROM diagnostic_versions WHERE version = new_version;
    IF duplicate_id IS NOT NULL THEN
      IF EXISTS (SELECT 1 FROM diagnostic_sessions WHERE version_id = duplicate_id) THEN
        RAISE EXCEPTION 'version % already has sessions', new_version;
      END IF;
      DELETE FROM "_AnswerOptionToResponse" link
      USING answer_options ao, questions q, diagnostic_modules m
      WHERE link."A" = ao.id AND ao.question_id = q.id AND q.module_id = m.id AND m.version_id = duplicate_id;
      DELETE FROM answer_options ao
      USING questions q, diagnostic_modules m
      WHERE ao.question_id = q.id AND q.module_id = m.id AND m.version_id = duplicate_id;
      DELETE FROM responses r
      USING questions q, diagnostic_modules m
      WHERE r.question_id = q.id AND q.module_id = m.id AND m.version_id = duplicate_id;
      DELETE FROM questions q
      USING diagnostic_modules m
      WHERE q.module_id = m.id AND m.version_id = duplicate_id;
      DELETE FROM user_module_progress p
      USING diagnostic_modules m
      WHERE p.module_id = m.id AND m.version_id = duplicate_id;
      DELETE FROM diagnostic_modules WHERE version_id = duplicate_id;
      DELETE FROM diagnostic_versions WHERE id = duplicate_id;
    END IF;
    UPDATE diagnostic_versions
    SET version = new_version,
        definition_ref = public.rename_formulario_ids(definition_ref)
    WHERE id = rec.id;
  END LOOP;
END $$;

DO $$
DECLARE
  rec record;
  stmt text;
BEGIN
  FOR rec IN
    SELECT c.table_name, c.column_name, c.data_type
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND c.data_type IN ('text', 'character varying', 'json', 'jsonb')
  LOOP
    IF rec.data_type = 'jsonb' THEN
      stmt := format(
        'UPDATE %I SET %I = public.rename_formulario_ids(%I::text)::jsonb WHERE %I::text LIKE ''%%lucas%%''',
        rec.table_name, rec.column_name, rec.column_name, rec.column_name
      );
    ELSIF rec.data_type = 'json' THEN
      stmt := format(
        'UPDATE %I SET %I = public.rename_formulario_ids(%I::text)::json WHERE %I::text LIKE ''%%lucas%%''',
        rec.table_name, rec.column_name, rec.column_name, rec.column_name
      );
    ELSE
      stmt := format(
        'UPDATE %I SET %I = public.rename_formulario_ids(%I) WHERE %I LIKE ''%%lucas%%''',
        rec.table_name, rec.column_name, rec.column_name, rec.column_name
      );
    END IF;
    EXECUTE stmt;
  END LOOP;
END $$;

UPDATE "diagnostic_versions" SET "definition_sha256" = '2a4e2330c33e71f5d83c93011f83c8410f8673df2ed8e7997cf4309d303817e2' WHERE "version" = 'formulario-completo@1';
UPDATE "diagnostic_versions" SET "definition_sha256" = 'd30d379a79ba01646c20a4e376d0c199bc5390cfc4389190dc6d8a338d2d51e1' WHERE "version" = 'formulario-completo@2';
UPDATE "diagnostic_versions" SET "definition_sha256" = 'ddf712c861bb470df8f9058b0964d9e773da20dc101995dbd085726c01e428fb' WHERE "version" = 'formulario-completo@3';
UPDATE "diagnostic_versions" SET "definition_sha256" = '1427cde5722dc7e5964450b887961f1ed04d7a7e4fd78385d7e1782fc721bf2a' WHERE "version" = 'formulario-completo@4';
UPDATE "diagnostic_versions" SET "definition_sha256" = 'd5f87da681726ccb5b1c53396c887fd13790df3c6f063e0b540a266e07d002bf' WHERE "version" = 'formulario-completo@5';
UPDATE "diagnostic_versions" SET "definition_sha256" = '8290415c4c1c4ec078a3ab3983e8f99f4fc87d716daa341d7b8db2af2917eb76' WHERE "version" = 'formulario-completo@6';

DROP FUNCTION public.rename_formulario_ids(text);
