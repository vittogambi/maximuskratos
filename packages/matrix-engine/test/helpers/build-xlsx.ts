import * as XLSX from 'xlsx';

type SheetSpec = {
  name: string;
  headers: string[];
  rows: unknown[][];
};

const CATALOG_ROWS: unknown[][] = [
  ['DOMINIO', 'MENTALIDAD', 'd'],
  ['DOMINIO', 'RELACIONES', 'd'],
  ['DOMINIO', 'FINANZAS', 'd'],
  ['DOMINIO', 'CUERPO', 'd'],
  ['DOMINIO', 'PROPÓSITO', 'd'],
  ['VARIABLE', 'ESTADO', 'v'],
  ['VARIABLE', 'RIESGO', 'v'],
  ['VARIABLE', 'NARRATIVA', 'v'],
  ['SEVERIDAD', 'MEDIA', 's'],
  ['SEVERIDAD', 'ALTA', 's'],
  ['SEVERIDAD', 'CRÍTICA', 's'],
  ['ESTADO', 'CONTENCIÓN', 'e'],
  ['ESTADO', 'ESTABILIZACIÓN', 'e'],
  ['ESTADO', 'CONSOLIDACIÓN', 'e'],
  ['ESTADO', 'EXPANSIÓN', 'e'],
];

const QUESTION_HEADERS = [
  'ID_Pregunta',
  'Versión',
  'Activa',
  'Instrumento',
  'Fase',
  'Ámbito',
  'Dimensión',
  'Tipo_variable',
  'Pregunta_neutral',
  'Tipo_respuesta',
  'ID_Escala',
  'Ponderación',
  'Puntaje_inverso',
  'Crítica',
  'Condición_alerta',
  'Severidad',
  'Acción_inmediata',
  'Derivación_profesional',
  'Selector_de_plan',
  'Regla_de_objetivo',
  'Métrica_clave',
  'Rol_MK_v2',
  'Nivel_intervención',
];

export function validQuestion(overrides: Record<string, unknown> = {}): unknown[] {
  const row: Record<string, unknown> = {
    ID_Pregunta: 'AUD-MEN-01',
    Versión: '1.0',
    Activa: 'Sí',
    Instrumento: 'AUD-001',
    Fase: 'AUDITORÍA',
    Ámbito: 'MENTALIDAD',
    Dimensión: 'Dirección e identidad',
    Tipo_variable: 'ESTADO',
    Pregunta_neutral: 'pregunta',
    Tipo_respuesta: 'LIKERT_1_5',
    ID_Escala: 'L5_FREQ',
    Ponderación: 1,
    Puntaje_inverso: 'No',
    Crítica: 'No',
    Condición_alerta: null,
    Severidad: null,
    Acción_inmediata: null,
    Derivación_profesional: null,
    Selector_de_plan: null,
    Regla_de_objetivo: null,
    Métrica_clave: 'IDX-MEN',
    Rol_MK_v2: 'NÚCLEO',
    Nivel_intervención: 'MK INTERVIENE',
    ...overrides,
  };
  return QUESTION_HEADERS.map((header) => row[header] ?? null);
}

export function buildWorkbook(options?: {
  questions?: unknown[][];
  scales?: unknown[][];
  plans?: unknown[][];
  objectives?: unknown[][];
  activities?: unknown[][];
  metrics?: unknown[][];
  rules?: unknown[][];
  catalogs?: unknown[][];
}): Buffer {
  const sheets: SheetSpec[] = [
    {
      name: '01_PREGUNTAS',
      headers: QUESTION_HEADERS,
      rows: options?.questions ?? [validQuestion()],
    },
    {
      name: '02_ESCALAS',
      headers: ['ID_Escala', 'Valor', 'Anclaje', 'Puntaje_0_100', 'Uso'],
      rows: options?.scales ?? [
        ['L5_FREQ', 1, 'Nunca', 0, 'u'],
        ['L5_FREQ', 2, 'Rara', 25, 'u'],
        ['L5_FREQ', 3, 'Algunas', 50, 'u'],
        ['L5_FREQ', 4, 'Frecuente', 75, 'u'],
        ['L5_FREQ', 5, 'Casi', 100, 'u'],
        ['SLEEP_HOURS', null, 'Horas', null, 'u'],
        ['TEXT', null, 'Texto', null, 'u'],
      ],
    },
    {
      name: '03_REGLAS',
      headers: ['ID_Regla', 'Categoría', 'Condición', 'Resultado/Formula', 'Justificación'],
      rows: options?.rules ?? [['R-STATE-01', 'ESTADO', '0–39', 'CONTENCIÓN', 'j']],
    },
    {
      name: '04_PLANES',
      headers: [
        'ID_Plan',
        'Ámbito',
        'Estado',
        'Nombre',
        'Criterio_entrada',
        'Criterio_salida',
        'Duración',
        'Máx_objetivos',
        'Rol_MK_v2',
      ],
      rows: options?.plans ?? [],
    },
    {
      name: '05_OBJETIVOS',
      headers: [
        'ID_Objetivo',
        'ID_Plan',
        'Secuencia',
        'Objetivo_específico',
        'ID_Métrica',
        'Meta',
        'Horizonte_semanas',
        'Tipo_objetivo',
      ],
      rows: options?.objectives ?? [],
    },
    {
      name: '06_ACTIVIDADES',
      headers: [
        'ID_Actividad',
        'ID_Objetivo',
        'Acción_ejecutable',
        'Cadencia',
        'Minutos_estimados',
        'Evidencia',
        'Versión_mínima',
        'Barrera_COMB',
      ],
      rows: options?.activities ?? [],
    },
    {
      name: '07_METRICAS',
      headers: ['ID_Métrica', 'Ámbito', 'Nombre', 'Dirección'],
      rows: options?.metrics ?? [['IDX-MEN', 'MENTALIDAD', 'Índice', '↑']],
    },
    {
      name: '08_PROPOSITO',
      headers: ['Orden', 'Módulo', 'Nombre', 'Regla de calidad'],
      rows: [['1', 'IDENTIDAD', 'Quién', 'No confundir']],
    },
    {
      name: '12_CATALOGOS',
      headers: ['Categoría', 'Valor', 'Definición'],
      rows: options?.catalogs ?? CATALOG_ROWS,
    },
  ];

  const workbook = XLSX.utils.book_new();
  for (const spec of sheets) {
    const aoa = [[spec.name], ['nota'], [], spec.headers, ...spec.rows];
    const sheet = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(workbook, sheet, spec.name);
  }
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
