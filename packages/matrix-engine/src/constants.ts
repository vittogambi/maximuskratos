export const SHEET = {
  QUESTIONS: '01_PREGUNTAS',
  SCALES: '02_ESCALAS',
  RULES: '03_REGLAS',
  PLANS: '04_PLANES',
  OBJECTIVES: '05_OBJETIVOS',
  ACTIVITIES: '06_ACTIVIDADES',
  METRICS: '07_METRICAS',
  PURPOSE: '08_PROPOSITO',
  CATALOGS: '12_CATALOGOS',
} as const;

export const ID_COLUMN = {
  QUESTIONS: 'ID_Pregunta',
  SCALES: 'ID_Escala',
  RULES: 'ID_Regla',
  PLANS: 'ID_Plan',
  OBJECTIVES: 'ID_Objetivo',
  ACTIVITIES: 'ID_Actividad',
  METRICS: 'ID_Métrica',
  PURPOSE: 'Orden',
  CATALOGS: 'Categoría',
} as const;

export const ALIAS_PAIRS: Array<{
  domain: string;
  from: string;
  canonical: string;
}> = [
  {
    domain: 'MENTALIDAD',
    from: 'Autorregulación',
    canonical: 'Autorregulación y resiliencia',
  },
  {
    domain: 'RELACIONES',
    from: 'Reciprocidad y comunidad',
    canonical: 'Reciprocidad, comunidad y liderazgo',
  },
  {
    domain: 'FINANZAS',
    from: 'Inversión y valor',
    canonical: 'Inversión y generación de valor',
  },
  {
    domain: 'CUERPO',
    from: 'Alimentación',
    canonical: 'Alimentación e hidratación',
  },
  {
    domain: 'CUERPO',
    from: 'Seguridad y salud',
    canonical: 'Seguridad y restricciones',
  },
];

export const NUCLEO_DOMAINS = new Set(['MENTALIDAD', 'PROPÓSITO', 'PROPOSITO']);

export const DOMAIN_ORDER = [
  'MENTALIDAD',
  'RELACIONES',
  'FINANZAS',
  'CUERPO',
  'PROPÓSITO',
];

export const PLAN_DOMAINS = [
  'MENTALIDAD',
  'RELACIONES',
  'FINANZAS',
  'CUERPO',
] as const;

export const STATE_RANK: Record<string, number> = {
  CONTENCIÓN: 0,
  ESTABILIZACIÓN: 1,
  CONSOLIDACIÓN: 2,
  EXPANSIÓN: 3,
};

export const BAND_CUTS = [0, 40, 60, 80, 100];

export const FULL_POLICY_ID = 'FULL-v1';

export const STATE_BANDS = [
  { state: 'CONTENCIÓN', min: 0, max: 39, rule_id: 'R-STATE-01' },
  { state: 'ESTABILIZACIÓN', min: 40, max: 59, rule_id: 'R-STATE-02' },
  { state: 'CONSOLIDACIÓN', min: 60, max: 79, rule_id: 'R-STATE-03' },
  { state: 'EXPANSIÓN', min: 80, max: 100, rule_id: 'R-STATE-04' },
];

export const COVERAGE_BANDS = {
  insufficient_below: 0.6,
  provisional_below: 0.8,
  rule_ids: ['R-MISS-01', 'R-MISS-02', 'R-MISS-03'],
};

export const NOT_EXECUTED = [
  'R-GLOB-02',
  'R-PUR-01',
  'R-PUR-02',
  'R-PUR-03',
  'R-PUR-04',
  'R-COMB-01',
  'R-TASK-01',
  'R-REV-01',
  'R-LOAD-04',
];

export const EXECUTABLE_RULES = new Set([
  'R-SCORE-01',
  'R-SCORE-02',
  'R-SCORE-03',
  'R-SCORE-04',
  'R-STATE-01',
  'R-STATE-02',
  'R-STATE-03',
  'R-STATE-04',
  'R-OVR-01',
  'R-OVR-02',
  'R-MISS-01',
  'R-MISS-02',
  'R-MISS-03',
  'R-GLOB-01',
  'R-LOAD-02',
  'R-LOAD-03',
]);

export const NORM_EXCEPTIONS = ['D-CUE-07'];

export const COMPOSITE_RISK_IDS = ['D-REL-15', 'D-FIN-09', 'D-CUE-25'];

export const POLICY_CORE_PURPOSE_IDS = [
  'P-PRO-021',
  'P-PRO-022',
  'P-PRO-023',
  'P-PRO-024',
  'P-PRO-025',
  'P-PRO-026',
  'P-PRO-027',
  'P-PRO-028',
  'P-PRO-029',
  'P-PRO-030',
  'P-PRO-031',
  'P-PRO-032',
  'P-PRO-033',
  'P-PRO-034',
  'P-PRO-035',
];
