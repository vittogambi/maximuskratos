-- Fixture accounts and the R17 lab case used the workbook recipient's name.

UPDATE "users"
SET "email" = replace("email", 'lucas.local.', 'formulario.local.')
WHERE "email" LIKE 'lucas.local.%@fixtures.mk.invalid';

UPDATE "lab_cases"
SET "label" = replace("label", 'Lucas', 'Mateo'),
    "expert_context" = replace(
      "expert_context",
      'Lucas tiene el cuestionario completo.',
      'El cuestionario de Mateo está completo.'
    )
WHERE "label" ILIKE '%lucas%' OR "expert_context" ILIKE '%lucas%';
