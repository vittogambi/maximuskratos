UPDATE "lab_reviews"
SET
  "first_wrong_layer" = 'CONTEXT_MISSING',
  "root_cause_codes" = array_remove("root_cause_codes", 'CONTEXT_MISSING')
WHERE "first_wrong_layer" = 'UNKNOWN'
  AND 'CONTEXT_MISSING' = ANY("root_cause_codes");
