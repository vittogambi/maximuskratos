/**
 * Single translation layer between the Lab backend enums and Modo Rafa.
 * Backend enums are never renamed: they are translated here for presentation only.
 * Any new user facing string for the Lab belongs in this file.
 */

export const RESPONSE_STATUS: Record<string, string> = {
  ANSWERED: 'Respondida',
  UNANSWERED: 'Sin respuesta',
  SKIPPED_BY_USER: 'Omitida',
  NOT_SERVED_BY_POLICY: 'No presentada',
  INVALID: 'Respuesta no válida',
  NOT_EVALUATED: 'No evaluado',
};

export const RUN_STATUS: Record<string, string> = {
  COLLECTING: 'Revisando respuestas',
  AWAITING_EXPECTATION: 'Falta tu criterio',
  REVEALED: 'Resultado disponible',
  FAILED: 'Caso con fallo técnico',
};

export const CASE_KIND: Record<string, string> = {
  SYNTHETIC: 'Caso de prueba',
  SIMULATION: 'Simulación de respuestas',
  SELF: 'Caso propio',
  REAL: 'Caso real',
  IMPORTED: 'Caso importado',
};

export const DOMAIN: Record<string, string> = {
  MENTALIDAD: 'Mentalidad',
  RELACIONES: 'Relaciones',
  FINANZAS: 'Finanzas',
  CUERPO: 'Cuerpo',
  'PROPÓSITO': 'Propósito',
  PURPOSE: 'Propósito',
  NONE: 'Ninguno',
  MULTI: 'Más de una',
};

export const STATE: Record<string, string> = {
  'CONTENCIÓN': 'Contención',
  'ESTABILIZACIÓN': 'Estabilización',
  'CONSOLIDACIÓN': 'Consolidación',
  'EXPANSIÓN': 'Expansión',
  NO_CLASIFICADO: 'No clasificado',
};

export const CLASSIFICATION: Record<string, string> = {
  INTERPRETABLE: 'Lectura firme',
  PROVISIONAL: 'Lectura provisional',
  NO_CLASIFICADO: 'No clasificado',
};

export const EVIDENCE_STATE: Record<string, string> = {
  INTERPRETABLE: 'Suficiente',
  PROVISIONAL: 'Provisional',
  NO_CLASIFICADO: 'Insuficiente',
  Suficiente: 'Suficiente',
  Provisional: 'Provisional',
  Insuficiente: 'Insuficiente',
};

export const VERDICT: Record<string, string> = {
  CORRECT: 'Coincido',
  PARTIAL: 'Coincido en parte',
  INCORRECT: 'No coincido',
  UNCERTAIN: 'No estoy seguro',
  NOT_APPLICABLE: 'No aplica',
};

export const CONFIDENCE: Record<string, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
};

export const SEVERITY: Record<string, string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Media',
};

export const SOURCE: Record<string, string> = {
  MATRIX: 'Matriz MK',
  RAFA_JUDGMENT: 'Tu decisión',
  USER_CHOICE: 'Elección de la persona',
  USER_SELF_ASSESSMENT: 'Autoevaluación de la persona',
  CASE: 'Caso',
  PRODUCT_HYPOTHESIS: 'Hipótesis de producto',
  DATA_GAP: 'Falta información',
  SAFETY: 'Alertas',
  CATALOG: 'Catálogo de la Matriz',
  FIXTURE: 'Caso precargado',
  MANUAL: 'Registrado a mano',
};

/** Policy ids read literally. The Lab does not reinterpret what a policy serves. */
export const POLICY: Record<string, string> = {
  'FULL-v1': 'Evaluación completa',
  'AUD_ONLY-v1': 'Solo auditoría',
  'AUD_PLUS_CORE-v1': 'Auditoría más núcleo',
  'AUD_PLUS_BRANCHES-v1': 'Auditoría más ramas',
};

export const RESTRICTION: Record<string, string> = {
  SAFETY_BLOCKED: 'Hay una alerta activa, así que no se entrega una acción ejecutable',
  INSUFFICIENT_DATA: 'Falta información para clasificar los ámbitos',
  MISSING_FOCUS_DECISION: 'Falta decidir el foco',
  MISSING_OBJECTIVE: 'Falta elegir el objetivo',
  MISSING_ACTION: 'Falta la acción de esta semana',
  MISSING_DIRECTION: 'Falta la dirección',
  ROUTE_NEEDS_CURATION: 'La ruta necesita curaduría humana',
  NEEDS_HUMAN_CURATION: 'Este contenido necesita curaduría humana',
};

export const EXECUTABLE: Record<string, string> = {
  ALLOWED: 'Se puede ejecutar',
  BLOCKED: 'Recomendación bloqueada',
};

/** Engine priority.reason values. Never print the key; Rafa reads this sentence. */
export const PRIORITY_REASON: Record<string, string> = {
  INSUFFICIENT_COVERAGE: 'No hay información suficiente para clasificar los ámbitos.',
};

export const EXCLUDED_REASON: Record<string, string> = {
  SKIPPED_BY_USER: 'sin respuesta',
  NOT_SCOREABLE: 'No cuenta para el puntaje',
  NO_SCALE_MAP: 'Esta pregunta no tiene puntaje asignado',
  INVALID: 'Respuesta no válida',
};

export function describePriorityTier(tier: string | null | undefined): string {
  if (tier === 'CRITICA') return 'hay una alerta crítica en ese ámbito';
  if (tier === 'ALTA') return 'hay una alerta alta en ese ámbito';
  if (tier === 'STATE') return 'tiene el estado y el puntaje más urgentes';
  return 'las reglas actuales';
}

export function describePriorityChoice(priority: {
  domain: string | null;
  reason: string | null;
  tier: string | null;
}): string {
  const reasonCopy = PRIORITY_REASON[priority.reason ?? ''] ?? PRIORITY_REASON.INSUFFICIENT_COVERAGE;
  if (!priority.domain) {
    return `La Matriz no eligió un ámbito. ${reasonCopy}`;
  }
  const why = (priority.reason && PRIORITY_REASON[priority.reason]) || describePriorityTier(priority.tier);
  return `La Matriz eligió ${DOMAIN[priority.domain] ?? 'Sin dato'} porque ${why}.`;
}

export const REPLAY_VERDICT: Record<string, string> = {
  BETTER: 'Mejor',
  WORSE: 'Peor',
  NEUTRAL: 'No cambia lo importante',
  UNCERTAIN: 'No estoy seguro',
};

export const REPLAY_IMPACT_LABEL: Record<string, string> = {
  IMPROVES: 'Se acerca a tu criterio',
  WORSENS: 'Se aleja de tu criterio',
  UNCHANGED: 'Sin cambio relevante',
  NEEDS_REVIEW: 'Necesita revisión',
};

export const CHANGESET_STATUS: Record<string, string> = {
  DRAFT: 'Borrador',
  OPEN: 'Abierto',
  MATERIALIZED: 'Candidato creado',
  REPLAYED: 'Comparado',
  ACCEPTED: 'Conservado como candidato',
  REJECTED: 'Descartada',
};

export const DEFINITION_STATUS: Record<string, string> = {
  CANDIDATE: 'En evaluación',
  ACCEPTED_CANDIDATE: 'Candidata aceptada',
  REJECTED: 'Descartada',
  PUBLISHED: 'Publicada',
};

export const OBSERVATION_STATUS: Record<string, string> = {
  PENDING: 'Pendiente',
  NEEDS_MORE_CASES: 'Necesita más casos',
  CONVERTED_TO_FINDING: 'Convertido en hallazgo',
  DISCARDED: 'Descartado',
  RESOLVED: 'Resuelto',
};

export const WORDING_REVIEW_OPTIONS: Option[] = [
  { value: 'WORDING_OK', label: 'Está bien' },
  { value: 'WORDING_UNCLEAR', label: 'No se entiende' },
  { value: 'WORDING_AMBIGUOUS', label: 'Es ambigua' },
  { value: 'WORDING_DOUBLE', label: 'Pregunta dos cosas' },
  { value: 'WORDING_UNNATURAL', label: 'Usa lenguaje poco natural' },
  { value: 'WORDING_OTHER', label: 'Otro' },
];

export const SCALE_REVIEW_OPTIONS: Option[] = [
  { value: 'SCALE_OK', label: 'La escala funciona' },
  { value: 'SCALE_MISMATCH', label: 'La escala no corresponde' },
  { value: 'SCALE_MISSING_OPTIONS', label: 'Faltan opciones' },
  { value: 'SCALE_BAD_ANCHORS', label: 'Los anclajes son malos' },
  { value: 'SCALE_NOT_REALITY', label: 'La respuesta no representa bien la realidad' },
  { value: 'SCALE_OTHER', label: 'Otro' },
];

export const SCORE_REVIEW_OPTIONS: Option[] = [
  { value: 'SCORE_OK', label: 'La conversión a puntaje tiene sentido' },
  { value: 'SCORE_HIGHER', label: 'Debería puntuar más alto' },
  { value: 'SCORE_LOWER', label: 'Debería puntuar más bajo' },
  { value: 'SCORE_INVERSE', label: 'Debería puntuar al revés' },
  { value: 'SCORE_NONE', label: 'No debería puntuar' },
  { value: 'SCORE_UNSURE', label: 'No estoy seguro' },
];

export const DOMAIN_REVIEW_OPTIONS: Option[] = [
  { value: 'DOMAIN_OK', label: 'Está en el ámbito correcto' },
  { value: 'DOMAIN_OTHER', label: 'Debería pertenecer a otro ámbito' },
];

export const DIMENSION_REVIEW_OPTIONS: Option[] = [
  { value: 'DIMENSION_OK', label: 'Está en la dimensión correcta' },
  { value: 'DIMENSION_OTHER', label: 'Debería pertenecer a otra dimensión' },
];

export const WEIGHT_REVIEW_OPTIONS: Option[] = [
  { value: 'WEIGHT_OK', label: 'La influencia está bien' },
  { value: 'WEIGHT_MORE', label: 'Debería influir más' },
  { value: 'WEIGHT_LESS', label: 'Debería influir menos' },
  { value: 'WEIGHT_EXCLUDE', label: 'No debería participar en este cálculo' },
];

export const SAFETY_REVIEW_OPTIONS: Option[] = [
  { value: 'SAFETY_OK', label: 'La alerta tiene sentido' },
  { value: 'SAFETY_FALSE_POSITIVE', label: 'Se dispara cuando no debería' },
  { value: 'SAFETY_FALSE_NEGATIVE', label: 'No se dispara cuando debería' },
  { value: 'SAFETY_SEVERITY', label: 'La severidad parece incorrecta' },
  { value: 'SAFETY_UNSURE', label: 'No estoy seguro' },
];

export const ASPECT_FILTER_LABEL: Record<string, string> = {
  wording: 'Redacción',
  scale: 'Escala',
  score: 'Puntaje',
  domain: 'Ámbito',
  dimension: 'Dimensión',
  weight: 'Peso',
  safety: 'Alertas',
};

export const RULE_LABELS: Record<string, string> = {
  'LAB-PRIORITY-01': 'El empate prioriza Mentalidad',
  'LAB-PRIORITY-02': 'Elección del ámbito secundario',
  'LAB-SCORE-01': 'Las dimensiones pesan lo mismo',
  'R-OVR-01': 'Alerta crítica fuerza Contención',
  'R-OVR-02': 'Alerta alta limita a Estabilización',
  'R-MISS-01': 'Cobertura insuficiente',
  'R-MISS-02': 'Cobertura provisional',
  'R-MISS-03': 'Cobertura suficiente',
  'R-STATE-01': 'Hasta 39 corresponde a Contención',
  'R-STATE-02': '40 a 59 corresponde a Estabilización',
  'R-STATE-03': 'Banda Consolidación',
  'R-STATE-04': 'Banda Expansión',
  'R-SCORE-03': 'Las dimensiones pesan lo mismo',
  'MEN-EST': 'Estabilización de Mentalidad propone Instalar estructura personal',
};

export const QUESTION_ISSUE_OPTIONS: Option[] = [
  { value: 'BAD_COPY', label: 'La pregunta está mal escrita' },
  { value: 'UNCLEAR', label: 'No se entiende con claridad' },
  { value: 'DOUBLE', label: 'Pregunta más de una cosa a la vez' },
  { value: 'SCALE_MISMATCH', label: 'La escala no calza con la pregunta' },
  { value: 'OPTIONS_SENSELESS', label: 'Las opciones de respuesta no tienen sentido' },
  { value: 'NOT_USEFUL', label: 'La pregunta no aporta' },
  { value: 'MISSING_QUESTION', label: 'Falta una pregunta importante' },
  { value: 'WRONG_DIMENSION', label: 'Está en la dimensión equivocada' },
  { value: 'WRONG_DOMAIN', label: 'Está en el ámbito equivocado' },
  { value: 'WEIGHT', label: 'Debería pesar diferente' },
  { value: 'INVERSE', label: 'Debería puntuar al revés' },
  { value: 'SAFETY', label: 'Hay un problema con la alerta' },
  { value: 'OTHER', label: 'Otro' },
];

export const PROBLEM_OPTIONS: Option[] = [
  { value: 'NO', label: 'No, la Matriz está bien' },
  { value: 'YES', label: 'Sí' },
  { value: 'NEED_MORE_INFO', label: 'No tengo suficiente información' },
  { value: 'UNSURE', label: 'No estoy seguro' },
];

export const SUPPORTS_FINDING_OPTIONS: Option[] = [
  { value: 'YES', label: 'Sí' },
  { value: 'NO', label: 'No' },
  { value: 'UNCLEAR', label: 'No está claro' },
];

export interface Option {
  value: string;
  label: string;
  help?: string;
}

/** Purpose stages. Descriptions come from the product and Lab contract, not from engine rules. */
export const PURPOSE_STAGES: Option[] = [
  {
    value: 'DIFUSO',
    label: 'Difusa',
    help: 'Todavía no aparece un rumbo suficientemente claro.',
  },
  {
    value: 'HIPOTETICO',
    label: 'Hipótesis',
    help: 'Hay una dirección posible, pero necesita probarse.',
  },
  {
    value: 'EN_CONTRASTE',
    label: 'En contraste',
    help: 'Ya existe acción y respuestas para ponerla a prueba.',
  },
  {
    value: 'INTEGRADO',
    label: 'Integrada',
    help: 'La dirección está respaldada por experiencia sostenida y decisiones coherentes.',
  },
  { value: 'UNSURE', label: 'No estoy seguro' },
];

export const EXPECTED_STATE_OPTIONS: Option[] = [
  { value: 'CONTENCIÓN', label: 'Contención' },
  { value: 'ESTABILIZACIÓN', label: 'Estabilización' },
  { value: 'CONSOLIDACIÓN', label: 'Consolidación' },
  { value: 'EXPANSIÓN', label: 'Expansión' },
  { value: 'NO_CLASIFICADO', label: 'No clasificaría' },
  { value: 'UNSURE', label: 'No estoy seguro' },
];

export const EXPECTED_PRIORITY_OPTIONS: Option[] = [
  { value: 'MENTALIDAD', label: 'Mentalidad' },
  { value: 'RELACIONES', label: 'Relaciones' },
  { value: 'FINANZAS', label: 'Finanzas' },
  { value: 'CUERPO', label: 'Cuerpo' },
  { value: 'NONE', label: 'Todavía no elegiría' },
  { value: 'UNSURE', label: 'No estoy seguro' },
];

export const VERDICT_OPTIONS: Option[] = [
  { value: 'CORRECT', label: 'Coincido' },
  { value: 'PARTIAL', label: 'Coincido en parte' },
  { value: 'INCORRECT', label: 'No coincido' },
  { value: 'UNCERTAIN', label: 'No estoy seguro' },
];

export const CONFIDENCE_OPTIONS: Option[] = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
];

/**
 * "Primera divergencia" in human words. Values are the TraceStep names the review
 * contract already uses, so the dataset stays joined to the trace.
 */
export const CASE_VERDICT_OPTIONS: Option[] = [
  { value: 'REPRESENTS', label: 'Sí, está bien' },
  { value: 'IMPORTANT_DIFF', label: 'Hay un problema' },
  { value: 'NEED_MORE_INFO', label: 'No tengo suficiente evidencia' },
  { value: 'UNSURE', label: 'No estoy seguro' },
  { value: 'MINOR_DIFF', label: 'Hay un ajuste menor' },
];

export const FAMILY_VERDICT_OPTIONS: Option[] = [
  { value: 'REPRESENTS', label: 'Sí, está bien' },
  { value: 'IMPORTANT_DIFF', label: 'Hay un problema' },
  { value: 'NEED_MORE_INFO', label: 'No tengo suficiente evidencia' },
];

export const OVERALL_SENSE_OPTIONS: Option[] = [
  { value: 'YES', label: 'Sí, completamente' },
  { value: 'PARTIAL', label: 'En parte' },
  { value: 'NO', label: 'No' },
  { value: 'UNSURE', label: 'No estoy seguro' },
];

export const FIRST_PROBLEM_OPTIONS: Option[] = [
  { value: 'RESPONSE_VALIDATION', label: 'Una pregunta' },
  { value: 'NORMALIZE_ITEM', label: 'Cómo se interpreta una respuesta' },
  { value: 'SCALE_MAP', label: 'La escala de respuesta' },
  { value: 'QUESTION_GROUPING', label: 'La dimensión a la que pertenece' },
  { value: 'DIMENSION_SCORE', label: 'Cómo se calcula una dimensión' },
  { value: 'DOMAIN_COVERAGE', label: 'La cobertura / falta de información' },
  { value: 'STATE_BAND', label: 'El estado asignado' },
  { value: 'SAFETY_EVAL', label: 'Una alerta' },
  { value: 'PRIORITY', label: 'El ámbito prioritario elegido' },
  { value: 'RECOMMENDATION', label: 'La ruta propuesta' },
  { value: 'CONTEXT_MISSING', label: 'El resultado general está bien, pero se perdió información importante' },
  { value: 'UNKNOWN', label: 'Otro' },
  { value: 'UNSURE', label: 'No estoy seguro' },
];

export const CAUSES_BY_PROBLEM: Record<string, string[]> = {
  RESPONSE_VALIDATION: [
    'QUESTION_WORDING',
    'QUESTION_UNCLEAR',
    'QUESTION_TOO_BROAD',
    'QUESTION_DOUBLE',
    'QUESTION_REDUNDANT',
    'QUESTION_IRRELEVANT',
    'QUESTION_NEEDS_CONTEXT',
    'QUESTION_MISSING',
    'UNKNOWN',
  ],
  NORMALIZE_ITEM: ['SCALE', 'NORMALIZATION', 'INVERSE', 'QUESTION_NEEDS_CONTEXT', 'UNKNOWN'],
  SCALE_MAP: ['SCALE', 'SCALE_OPTION', 'INVERSE', 'NORMALIZATION', 'UNKNOWN'],
  QUESTION_GROUPING: ['DIMENSION_OK', 'DIMENSION_ASSIGNMENT', 'DOMAIN_ASSIGNMENT', 'QUESTION_IRRELEVANT', 'UNKNOWN'],
  DIMENSION_SCORE: ['WEIGHT', 'DIMENSION_ASSIGNMENT', 'INTERPRETATION', 'UNKNOWN'],
  DOMAIN_SCORE: ['WEIGHT', 'DIMENSION_ASSIGNMENT', 'INTERPRETATION'],
  DOMAIN_COVERAGE: ['COVERAGE', 'CONTEXT_MISSING', 'UNKNOWN'],
  STATE_BAND: ['THRESHOLD', 'STATE_RULE', 'INTERPRETATION', 'UNKNOWN'],
  SAFETY_EVAL: ['SAFETY', 'OVERRIDE', 'SAFETY_ALERT', 'SAFETY_CONFIRM', 'SAFETY_FALSE_POSITIVE', 'SAFETY_UNSURE'],
  OVERRIDE: ['SAFETY', 'OVERRIDE'],
  PRIORITY: ['PRIORITY_RULE', 'SAFETY', 'INTERPRETATION', 'CONTEXT_MISSING', 'UNKNOWN'],
  RECOMMENDATION: ['PLAN', 'PRIORITY_RULE', 'UNKNOWN'],
  CONTEXT_MISSING: ['INTERPRETATION', 'CONTEXT_MISSING', 'UNKNOWN'],
  UNKNOWN: ['UNKNOWN'],
};

export const DISPOSITION_OPTIONS: Option[] = [
  { value: 'NO_CHANGE', label: 'Cerrar sin cambiar la Matriz' },
  { value: 'CREATE_FINDING', label: 'Registrar hallazgo' },
  { value: 'LINK_FINDING', label: 'Relacionar con hallazgo existente' },
  { value: 'REVIEW_MORE', label: 'Dejar una duda y revisar más casos' },
];

export const FINDING_LAYER_OPTIONS: Option[] = [
  { value: 'QUESTION', label: 'Pregunta / dato' },
  { value: 'SCALE', label: 'Escala / opciones de respuesta' },
  { value: 'DIMENSION', label: 'Dimensión / mapeo' },
  { value: 'WEIGHTING', label: 'Ponderación' },
  { value: 'COVERAGE', label: 'Cobertura' },
  { value: 'SCORE', label: 'Cálculo' },
  { value: 'STATE', label: 'Estado' },
  { value: 'SAFETY', label: 'Alertas' },
  { value: 'PRIORITY', label: 'Ámbito prioritario y desempate entre ámbitos' },
  { value: 'PLAN', label: 'Ruta / plan' },
  { value: 'INTERPRETATION', label: 'Devolución' },
  { value: 'MISSING_INFO', label: 'Falta información' },
  { value: 'PURPOSE_OUTSIDE', label: 'Propósito fuera de la Matriz' },
  { value: 'QUESTION_CONTENT', label: 'Contenido de pregunta' },
  { value: 'OTHER', label: 'Otro' },
];

export const FINDING_SEVERITY_OPTIONS: Option[] = [
  { value: 'CRITICAL', label: 'Crítico' },
  { value: 'IMPORTANT', label: 'Importante' },
  { value: 'MINOR', label: 'Menor' },
  { value: 'UNSURE', label: 'No estoy seguro' },
];

export const FINDING_CONFIDENCE_OPTIONS: Option[] = [
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
];

export const FINDING_STATUS_OPTIONS: Option[] = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'OPEN', label: 'Abierto' },
  { value: 'NEEDS_MORE_CASES', label: 'Necesita más casos' },
  { value: 'WORTH_TESTING', label: 'Vale la pena probar un cambio' },
  { value: 'CHANGE_IN_TEST', label: 'Cambio en prueba' },
  { value: 'KEEP_MATRIX', label: 'Mantener la Matriz como está' },
  { value: 'CHANGE_MATRIX', label: 'Cambiar la Matriz' },
  { value: 'KNOWN_LIMITATION', label: 'Limitación conocida' },
  { value: 'OUTSIDE_MATRIX', label: 'Fuera de la Matriz' },
  { value: 'DISCARDED', label: 'Descartado' },
];

export const IMPACT_OPTIONS: Option[] = [
  { value: 'IMPROVES', label: 'Arregla' },
  { value: 'WORSENS', label: 'Conflicto' },
  { value: 'UNCHANGED', label: 'Sin cambio' },
  { value: 'NEEDS_REVIEW', label: 'Consecuencia' },
];

export const CONSISTENCY_OPTIONS: Option[] = [
  { value: 'CONTEXT_DEPENDENT', label: 'Sí, depende del contexto' },
  { value: 'SINGLE_RULE', label: 'No, debería ser una sola regla' },
  { value: 'NOT_COMPARABLE', label: 'Los casos no son comparables' },
  { value: 'UNSURE', label: 'No estoy seguro' },
];

export const DIRECTION_SOURCE_OPTIONS: Option[] = [
  { value: 'USER_CHOICE', label: 'Persona' },
  { value: 'RAFA_JUDGMENT', label: 'Tu criterio' },
  { value: 'CASE', label: 'Caso' },
  { value: 'PRODUCT_HYPOTHESIS', label: 'Hipótesis de producto' },
];

export const FIRST_DIVERGENCE_OPTIONS: Option[] = [
  { value: 'NONE', label: 'No veo un problema metodológico' },
  {
    value: 'RESPONSE_VALIDATION',
    label: 'Las preguntas disponibles',
    help: 'Lo que se le preguntó, o lo que quedó sin responder, no permite juzgar este caso.',
  },
  {
    value: 'QUESTION_GROUPING',
    label: 'Cómo se agrupan las preguntas',
    help: 'La pregunta está en un grupo que no representa cómo la leerías tú.',
  },
  {
    value: 'NORMALIZE_ITEM',
    label: 'La escala o el valor de una pregunta',
    help: 'La respuesta se convierte en un número que no representa lo que dijo la persona.',
  },
  {
    value: 'DIMENSION_SCORE',
    label: 'Cómo se calcula una dimensión',
    help: 'Las preguntas agrupadas en una dimensión, o su peso dentro de ella.',
  },
  {
    value: 'DOMAIN_SCORE',
    label: 'Cómo se calcula el ámbito',
    help: 'Hoy las dimensiones de un ámbito pesan igual entre ellas.',
  },
  {
    value: 'DOMAIN_COVERAGE',
    label: 'La cobertura necesaria',
    help: 'Cuántas respuestas hacen falta antes de clasificar un ámbito.',
  },
  {
    value: 'STATE_BAND',
    label: 'El estado asignado',
    help: 'El puntaje cae en una banda que no corresponde al momento de la persona.',
  },
  {
    value: 'SAFETY_EVAL',
    label: 'Una alerta',
    help: 'La alerta se disparó, no se disparó, o quedó sin evaluar.',
  },
  {
    value: 'OVERRIDE',
    label: 'El efecto de la alerta sobre el estado',
    help: 'La alerta forzó o limitó el estado del ámbito.',
  },
  {
    value: 'PRIORITY',
    label: 'El ámbito prioritario elegido',
    help: 'El ámbito que quedó primero.',
  },
  {
    value: 'RECOMMENDATION',
    label: 'La ruta sugerida por la Matriz',
    help: 'La ruta que sale del ámbito y su estado. No es todavía el plan del ciclo.',
  },
  {
    value: 'CONTEXT_MISSING',
    label: 'Falta información',
    help: 'Con lo que hay no se puede decidir.',
  },
  { value: 'UNKNOWN', label: 'No estoy seguro' },
];

/** Error taxonomy of the review contract, with a short human reading of each code. */
export const ROOT_CAUSE_OPTIONS: Option[] = [
  { value: 'QUESTION_WORDING', label: 'La pregunta está mal formulada' },
  { value: 'QUESTION_MISSING', label: 'Falta una pregunta' },
  { value: 'QUESTION_IRRELEVANT', label: 'La pregunta no aporta' },
  { value: 'SCALE', label: 'La escala o sus anclas' },
  { value: 'NORMALIZATION', label: 'La conversión a puntaje' },
  { value: 'INVERSE', label: 'La pregunta debería contar al revés' },
  { value: 'WEIGHT', label: 'Influye demasiado o demasiado poco' },
  { value: 'QUESTION_UNCLEAR', label: 'Se entiende mal' },
  { value: 'QUESTION_TOO_BROAD', label: 'Es demasiado amplia' },
  { value: 'QUESTION_DOUBLE', label: 'Mezcla dos cosas distintas' },
  { value: 'QUESTION_NEEDS_CONTEXT', label: 'Falta contexto' },
  { value: 'DIMENSION_OK', label: 'La pregunta sí pertenece a esta dimensión' },
  { value: 'SAFETY_ALERT', label: 'Mostrar alerta, sin forzar estado' },
  { value: 'SAFETY_CONFIRM', label: 'Pedir confirmación' },
  { value: 'DIMENSION_ASSIGNMENT', label: 'La pregunta está en la dimensión equivocada' },
  { value: 'DOMAIN_ASSIGNMENT', label: 'La pregunta está en el ámbito equivocado' },
  { value: 'ALIAS_MAPPING', label: 'Dos nombres para la misma dimensión' },
  { value: 'COVERAGE', label: 'La cobertura exigida' },
  { value: 'THRESHOLD', label: 'El umbral de la banda' },
  { value: 'STATE_RULE', label: 'La regla de estado' },
  { value: 'OVERRIDE', label: 'El efecto de la alerta' },
  { value: 'PRIORITY_RULE', label: 'La regla que decide qué ámbito va primero' },
  { value: 'INTERPRETATION', label: 'La interpretación registrada' },
  { value: 'PLAN', label: 'El plan del catálogo' },
  { value: 'OBJECTIVE', label: 'Los objetivos' },
  { value: 'ACTIVITY', label: 'Las actividades' },
  { value: 'POLICY', label: 'Las preguntas que se sirvieron' },
  { value: 'CONTEXT_MISSING', label: 'Falta contexto del caso' },
  { value: 'SAFETY', label: 'La alerta' },
  { value: 'UNKNOWN', label: 'No lo sé' },
  { value: 'QUESTION_REDUNDANT', label: 'Se repite con otra' },
  { value: 'NEEDS_QUALITATIVE', label: 'Necesita confirmación cualitativa' },
  { value: 'AMBIGUOUS', label: 'La misma respuesta puede significar cosas distintas' },
  { value: 'SCALE_OPTION', label: 'Faltan opciones' },
  { value: 'SCALE_TOO_WIDE', label: 'La escala es demasiado amplia' },
  { value: 'SCALE_TOO_NARROW', label: 'La escala es demasiado estrecha' },
  { value: 'NOT_NUMERIC', label: 'La pregunta no debería ser numérica' },
  { value: 'QUESTION_DOMINATES', label: 'Una pregunta domina demasiado' },
  { value: 'SINGLE_EQUALS_MANY', label: 'Una dimensión con 1 pregunta pesa igual que una de 5' },
  { value: 'AVERAGE_LOSS', label: 'Promediar pierde información' },
  { value: 'COVERAGE_INTERPRETABLE', label: 'Sí debería clasificar' },
  { value: 'COVERAGE_PROVISIONAL', label: 'Debería pedir más información' },
  { value: 'OTHER', label: 'Otro' },
  { value: 'CONTEXT', label: 'El contexto cambia el ámbito prioritario' },
  { value: 'LESS', label: 'Menos que ahora' },
  { value: 'MORE', label: 'Más que ahora' },
  { value: 'OK', label: 'Igual' },
  { value: 'CUSTOM', label: 'Valor específico' },
  { value: 'SAFETY_FALSE_POSITIVE', label: 'No afectar el estado' },
  { value: 'SAFETY_UNSURE', label: 'No estoy seguro' },
  { value: 'NEED_SIMILAR_CASE', label: 'Otro caso parecido' },
  { value: 'NEED_PERSON_INFO', label: 'Más información de esta persona' },
  { value: 'NEED_QUESTION', label: 'Revisar una pregunta' },
  { value: 'NEED_CALCULATION', label: 'Entender mejor cómo calculó la Matriz' },
  { value: 'NEED_CONVERSATION', label: 'Conversarlo' },
];

export const PURPOSE_FEELS_OPTIONS: Option[] = [
  { value: 'CENTRAL', label: 'Es central' },
  { value: 'PRESENT_BUT_WEAK', label: 'Está presente, pero demasiado débil' },
  { value: 'DECORATIVE', label: 'Parece decorativo' },
  { value: 'OVERPOWERING', label: 'Tiene demasiado protagonismo' },
  { value: 'UNCERTAIN', label: 'No estoy seguro' },
];

export const STILL_MK_OPTIONS: Option[] = [
  { value: 'YES', label: 'Sí' },
  { value: 'PARTLY', label: 'En parte' },
  { value: 'NO', label: 'No' },
  { value: 'UNSURE', label: 'No estoy seguro' },
];

export const PRODUCT_DIVERGENCE_OPTIONS: Option[] = [
  { value: 'PURPOSE', label: 'El lugar de Propósito' },
  { value: 'DIRECTION', label: 'La dirección' },
  { value: 'FOCUS_RESOLUTION', label: 'Cómo se decide el foco' },
  { value: 'ROUTE', label: 'La ruta' },
  { value: 'OBJECTIVE', label: 'El objetivo' },
  { value: 'ACTION', label: 'La acción de la semana' },
  { value: 'CYCLE', label: 'El ciclo' },
  { value: 'DASHBOARD', label: 'La pantalla de inicio' },
  { value: 'MISSING_CONTEXT', label: 'Falta contexto' },
  { value: 'UNSURE', label: 'No estoy seguro' },
];

export const REPLAY_VERDICT_OPTIONS: Option[] = [
  { value: 'BETTER', label: 'Mejor' },
  { value: 'WORSE', label: 'Peor' },
  { value: 'NEUTRAL', label: 'No cambia lo importante' },
  { value: 'UNCERTAIN', label: 'No estoy seguro' },
];

export const PRODUCT_REVIEW_SECTIONS: Array<{ key: string; label: string; help: string }> = [
  {
    key: 'focus',
    label: 'Foco del ciclo',
    help: 'El ámbito que esta persona trabajaría ahora. Puede no coincidir con lo que propone la Matriz.',
  },
  {
    key: 'purpose_role',
    label: 'Rol de Propósito',
    help: 'Cómo aparece la dirección al decidir qué hacer con la lectura de la Matriz.',
  },
  {
    key: 'route',
    label: 'Ruta del ciclo',
    help: 'El camino de este ciclo. No es necesariamente la ruta sugerida por la Matriz.',
  },
  { key: 'objective', label: 'Objetivo', help: 'Lo que la persona intentaría lograr.' },
  { key: 'action', label: 'Acción', help: 'Lo que haría esta semana.' },
  {
    key: 'dashboard',
    label: 'Inicio',
    help: 'Lo primero que vería la persona al entrar.',
  },
];

function lookup(map: Record<string, string>, value: string | null | undefined): string {
  if (value == null || value === '') return 'Sin dato';
  return map[value] ?? value;
}

/** True for stored enum codes (SCALE_TOO_NARROW). Never show these to Rafa. */
export function looksLikeCode(value: string): boolean {
  if (!/^[A-Z0-9_]+$/.test(value)) return false;
  return value.includes('_') || value.length >= 4;
}

export function optionLabel(options: Option[], value: string | null | undefined): string {
  if (value == null || value === '') return 'Sin dato';
  const found = options.find((item) => item.value === value)?.label;
  if (found) return found;
  return looksLikeCode(value) ? 'Sin dato' : value;
}

export const TRANSFORMATION_LABEL: Record<string, string> = {
  UNCHANGED: 'Se mantuvo',
  REFORMULATED: 'Se reformuló',
  SCALE_CHANGED: 'Se reformuló',
  SPLIT: 'Se dividió',
  MERGED: 'Se combinó con otras',
  RECLASSIFIED: 'Cambió de lugar',
  SAFETY_SEPARATED: 'Se separó la parte de alertas',
  NON_SCOREABLE: 'Dejó de puntuar',
  NEW_IN_V2: 'Es nueva',
  UNCLEAR: 'Origen pendiente de confirmar',
  REMOVED: 'No está en Matriz v2',
};

export const PENDING_ORIGIN_COPY =
  'Todavía no hemos confirmado con precisión qué pregunta del formulario anterior corresponde a esta versión.';

export const PENDING_EQUIVALENCE_COPY =
  'Todavía no hemos confirmado la equivalencia exacta con el formulario anterior.';

export function isPendingOriginWhy(why: string | null | undefined): boolean {
  if (!why) return false;
  const raw = why.trim().toUpperCase();
  return raw === 'REQUIRES HUMAN AUTHORING' || raw === 'UNCLEAR';
}

export const FIDELITY_REVIEW_OPTIONS = [
  { value: 'FIDELITY_YES', label: 'Sí' },
  { value: 'FIDELITY_YES_BUT', label: 'Sí, pero cambió la redacción' },
  { value: 'FIDELITY_NO', label: 'Cambió el significado' },
  { value: 'FIDELITY_PREFER_ORIGINAL', label: 'Prefiero la original' },
  { value: 'FIDELITY_UNSURE', label: 'No estoy seguro' },
];

export const FIDELITY_TARGET_OPTIONS = [
  'Redacción',
  'Escala',
  'Ámbito',
  'Dimensión',
  'Tipo de variable',
  'Alertas',
  'Peso',
  'Otra cosa',
];

export const REMOVED_CONTENT_OPTIONS: Option[] = [
  {
    value: 'KEEP_V2',
    label: 'Queda fuera',
    help: 'No cambia ninguna decisión útil de MK.',
  },
  {
    value: 'RECOVER_MATRIX',
    label: 'Matriz',
    help: 'Es necesaria para entender el estado actual.',
  },
  {
    value: 'RECOVER_DIRECTION',
    label: 'Dirección',
    help: 'Ayuda a entender hacia dónde quiere construir la persona.',
  },
  {
    value: 'ARCHIVE_LEGACY',
    label: 'Más adelante',
    help: 'Tiene valor durante planificación o intervención.',
  },
  {
    value: 'NOT_APPLICABLE',
    label: 'No estoy seguro',
    help: 'Todavía no puedo decidir con lo que hay.',
  },
];

export const METHOD_TRANSFORM_OPTIONS: Option[] = [
  {
    value: 'KEEP_V2',
    label: 'Sí, conservar v2',
    help: 'La transformación conserva lo que querías conseguir.',
  },
  {
    value: 'KEEP_V2_PARTIAL',
    label: 'Sí, pero falta recuperar una parte',
    help: 'La dirección es correcta, pero falta un componente concreto.',
  },
  {
    value: 'REJECT',
    label: 'No',
    help: 'Hay que revisar la transformación.',
  },
  {
    value: 'NOT_APPLICABLE',
    label: 'No estoy seguro',
    help: 'Todavía no puedo decidir con lo que hay.',
  },
];

export const MIGRATION_VERDICT_OPTIONS: Option[] = [
  ...REMOVED_CONTENT_OPTIONS,
  { value: 'ADD_BANK', label: 'Recuperar para la Matriz' },
];

export const REFINEMENT_VERDICT_OPTIONS: Option[] = [
  { value: 'CONFIRM', label: 'Sí' },
  { value: 'CONFIRM_WITH_ADJUSTMENT', label: 'Ajustaría algo' },
  { value: 'REJECT', label: 'No' },
  { value: 'NOT_APPLICABLE', label: 'No estoy seguro' },
];

export const ORIGIN_TYPE: Record<string, string> = {
  EXCEL_SOURCE: 'Excel original',
  MATRIX_V2: 'Matriz v2',
  V2_TRANSFORMATION: 'Transformación de v2',
  V2_UNDOCUMENTED_RESULT: 'Resultado de v2 no documentado',
  POST_V2_REFINEMENT: 'Refinamiento posterior',
  TECHNICAL_CORRECTION: 'Corrección técnica',
  FUTURE_PROPOSAL: 'Propuesta futura',
};

export const DECISION_STATUS: Record<string, string> = {
  DOCUMENTED_IN_V2: 'Ya decidido en v2',
  PENDING_RAFA: 'Pendiente de revisión',
  APPROVED_RAFA: 'Confirmado',
  REJECTED_RAFA: 'Rechazado',
  NEED_MORE_EVIDENCE: 'Necesita más evidencia',
};

export const CHANGE_KIND: Record<string, string> = {
  UNCHANGED_FROM_EXCEL: 'Sin cambio respecto del Excel',
  V2_TRANSFORMATION: 'Transformación de Matriz v2',
  INTENTION_LOSS_RISK: 'Posible pérdida de intención',
  TECHNICAL_CORRECTION: 'Corrección técnica',
  INCONSISTENCY_CORRECTION: 'Corrección de inconsistencia',
  METHODOLOGICAL_REFINEMENT: 'Refinamiento metodológico',
  PRODUCT_PROPOSAL: 'Nueva propuesta de producto',
};

export const DECISION_BY: Record<string, string> = {
  V2_DOCUMENTED: 'Decisión explícita de Matriz v2',
  TEAM_PROPOSAL: 'Refinamiento propuesto después de v2',
  RAFA: 'Decisión de esta revisión',
  UNDOCUMENTED: 'Resultado presente en v2; motivo no documentado como decisión explícita',
};

export const labUiLabels = {
  responseStatus: (value: string | null | undefined) => lookup(RESPONSE_STATUS, value),
  runStatus: (value: string | null | undefined) => lookup(RUN_STATUS, value),
  caseKind: (value: string | null | undefined) => lookup(CASE_KIND, value),
  domain: (value: string | null | undefined) => lookup(DOMAIN, value),
  state: (value: string | null | undefined) => lookup(STATE, value),
  classification: (value: string | null | undefined) => lookup(CLASSIFICATION, value),
  evidenceState: (value: string | null | undefined) => lookup(EVIDENCE_STATE, value),
  verdict: (value: string | null | undefined) => lookup(VERDICT, value),
  confidence: (value: string | null | undefined) => lookup(CONFIDENCE, value),
  severity: (value: string | null | undefined) => lookup(SEVERITY, value),
  source: (value: string | null | undefined) => lookup(SOURCE, value),
  policy: (value: string | null | undefined) => lookup(POLICY, value),
  restriction: (value: string | null | undefined) => lookup(RESTRICTION, value),
  priorityReason: (value: string | null | undefined) => lookup(PRIORITY_REASON, value),
  excludedReason: (value: string | null | undefined) =>
    EXCLUDED_REASON[value ?? ''] ?? 'esta respuesta no entra en el cálculo',
  executable: (value: string | null | undefined) => lookup(EXECUTABLE, value),
  replayVerdict: (value: string | null | undefined) => lookup(REPLAY_VERDICT, value),
  changesetStatus: (value: string | null | undefined) => lookup(CHANGESET_STATUS, value),
  replayImpact: (value: string | null | undefined) => lookup(REPLAY_IMPACT_LABEL, value),
  definitionStatus: (value: string | null | undefined) => lookup(DEFINITION_STATUS, value),
  observationStatus: (value: string | null | undefined) => lookup(OBSERVATION_STATUS, value),
  issueType: (value: string | null | undefined) =>
    optionLabel(
      [
        ...QUESTION_ISSUE_OPTIONS,
        ...WORDING_REVIEW_OPTIONS,
        ...SCALE_REVIEW_OPTIONS,
        ...SCORE_REVIEW_OPTIONS,
        ...DOMAIN_REVIEW_OPTIONS,
        ...DIMENSION_REVIEW_OPTIONS,
        ...WEIGHT_REVIEW_OPTIONS,
        ...SAFETY_REVIEW_OPTIONS,
      ],
      value,
    ),
  rule: (value: string | null | undefined) => {
    if (value == null || value === '') return 'Sin dato';
    return RULE_LABELS[value] ?? (looksLikeCode(value) ? 'Sin dato' : value);
  },
  problem: (value: string | null | undefined) => optionLabel(PROBLEM_OPTIONS, value),
  contract: (value: string | null | undefined) =>
    value === 'PASS' ? 'Correcto' : value === 'FAIL' ? 'Hay problemas' : optionLabel([], value),
  purposeStage: (value: string | null | undefined) => optionLabel(PURPOSE_STAGES, value),
  purposeStageHelp: (value: string | null | undefined) =>
    PURPOSE_STAGES.find((item) => item.value === value)?.help ?? null,
  expectedState: (value: string | null | undefined) => optionLabel(EXPECTED_STATE_OPTIONS, value),
  expectedPriority: (value: string | null | undefined) => optionLabel(EXPECTED_PRIORITY_OPTIONS, value),
  firstDivergence: (value: string | null | undefined) =>
    optionLabel([...FIRST_PROBLEM_OPTIONS, ...FIRST_DIVERGENCE_OPTIONS], value),
  rootCause: (value: string | null | undefined) => optionLabel(ROOT_CAUSE_OPTIONS, value),
  purposeFeels: (value: string | null | undefined) => optionLabel(PURPOSE_FEELS_OPTIONS, value),
  stillMk: (value: string | null | undefined) => optionLabel(STILL_MK_OPTIONS, value),
  productDivergence: (value: string | null | undefined) => optionLabel(PRODUCT_DIVERGENCE_OPTIONS, value),
  caseVerdict: (value: string | null | undefined) => optionLabel(CASE_VERDICT_OPTIONS, value),
  disposition: (value: string | null | undefined) => optionLabel(DISPOSITION_OPTIONS, value),
  findingLayer: (value: string | null | undefined) => optionLabel(FINDING_LAYER_OPTIONS, value),
  findingSeverity: (value: string | null | undefined) => optionLabel(FINDING_SEVERITY_OPTIONS, value),
  findingStatus: (value: string | null | undefined) => optionLabel(FINDING_STATUS_OPTIONS, value),
  impact: (value: string | null | undefined) => optionLabel(IMPACT_OPTIONS, value),
  transformation: (value: string | null | undefined) => lookup(TRANSFORMATION_LABEL, value),
  fidelity: (value: string | null | undefined) => optionLabel(FIDELITY_REVIEW_OPTIONS, value),
  migrationVerdict: (value: string | null | undefined) =>
    optionLabel(
      [
        ...REMOVED_CONTENT_OPTIONS,
        ...METHOD_TRANSFORM_OPTIONS,
        ...REFINEMENT_VERDICT_OPTIONS,
        ...MIGRATION_VERDICT_OPTIONS,
      ],
      value,
    ),
  originType: (value: string | null | undefined) => lookup(ORIGIN_TYPE, value),
  decisionStatus: (value: string | null | undefined) => lookup(DECISION_STATUS, value),
  changeKind: (value: string | null | undefined) => lookup(CHANGE_KIND, value),
  decisionBy: (value: string | null | undefined) => lookup(DECISION_BY, value),
};

/** Divergence rows of the expectation comparison, in Rafa's words. */
export const COMPARISON_ROW: Record<string, string> = {
  alerts: 'Alertas',
  classification: 'Ámbitos con lectura posible',
  states: 'Estado de cada ámbito',
  priority: 'Ámbito prioritario sugerido por la Matriz',
  plan: 'Ruta sugerida por la Matriz',
  purpose: 'Propósito',
};

export const COMPARISON_RESULT: Record<string, string> = {
  MATCH: 'Coincide',
  DIVERGENCE: 'Se separa',
  MATRIX_SILENT: 'La Matriz no opina',
};
