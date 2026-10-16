/** OCEAN / Big Five (E-PER-007). Ítems 2, 5, 8, 11 y 14 con escala inversa (6 menos respuesta). */

export const PERSONALITY_MODULE_INTRO =
  'Factores de la personalidad (E-PER-007). Radiografía en el modelo OCEAN (Big Five) para alinear tu propósito con tus tendencias naturales, potenciar fortalezas y anticipar autosabotajes. El Humano evoca la materia prima, la esencia de lo que somos, la base a transformar.';

export const PERSONALITY_FACTOR_KEYS = [
  'Apertura',
  'Responsabilidad',
  'Extraversión',
  'Amabilidad',
  'Sensibilidad emocional',
] as const;

export type PersonalityFactorKey = (typeof PERSONALITY_FACTOR_KEYS)[number];

export const PERSONALITY_FACTOR_TITLES: Record<PersonalityFactorKey, string> = {
  Apertura: 'A. Apertura a la experiencia (creatividad y rutina)',
  Responsabilidad: 'R. Responsabilidad y conciencia (organización y espontaneidad)',
  Extraversión: 'E. Extraversión (energía social e introversión)',
  Amabilidad: 'M. Amabilidad y empatía (cooperación y competitividad)',
  'Sensibilidad emocional': 'N. Neuroticismo y estabilidad emocional (sensibilidad y calma)',
};

const BANDS: Array<{ high: string; low: string; mid: string }> = [
  {
    high: 'Mentalidad exploradora e ideal para innovación',
    low: 'Prefiere procesos claros y enfoque pragmático',
    mid: 'Equilibrio entre creatividad y sentido práctico',
  },
  {
    high: 'Ejecutora disciplinada con foco en metas',
    low: 'Espontánea, requiere estructura externa',
    mid: 'Flexible en ejecución, organizada sin rigidez',
  },
  {
    high: 'Orientada a personas y liderazgo expuesto',
    low: 'Trabajo reflexivo en ambientes independientes',
    mid: 'Ambivalente, disfruta lo social con pausas a solas',
  },
  {
    high: 'Vocación de servicio y altamente cooperativo',
    low: 'Analítico, orientado a resultados o competencia',
    mid: 'Empatía selectiva, cuida sus límites personales',
  },
  {
    high: 'Alta reactividad emocional y alerta a riesgos',
    low: 'Estable, tolera alta presión laboral',
    mid: 'Sensibilidad moderada, reacciona según el contexto',
  },
];

export function personalityBandForAverage(groupIndex: number, average: number): string {
  const band = BANDS[groupIndex];
  if (!band) return 'Sin desarrollo';
  if (average >= 4) return band.high;
  if (average <= 2.4) return band.low;
  return band.mid;
}

/** Raw 1 to 5 answers in OCEAN1..OCEAN15 order. */
export function personalityScoredValues(raw: Array<number | null | undefined>): number[] {
  const scored: number[] = [];
  for (let index = 0; index < raw.length; index += 1) {
    const value = raw[index];
    if (value == null || !Number.isFinite(value)) continue;
    scored.push(index % 3 === 1 ? 6 - value : value);
  }
  return scored;
}

export function personalityOverallAverage(raw: Array<number | null | undefined>): number | null {
  if (raw.length !== 15 || raw.some((value) => value == null || !Number.isFinite(value))) return null;
  const scored = personalityScoredValues(raw);
  if (scored.length !== 15) return null;
  return scored.reduce((total, value) => total + value, 0) / 15;
}

export function personalityFactorAverage(raw: Array<number | null | undefined>, groupIndex: number): number | null {
  const start = groupIndex * 3;
  const slice = raw.slice(start, start + 3);
  if (slice.length !== 3 || slice.some((value) => value == null || !Number.isFinite(value))) return null;
  const scored = slice.map((value, offset) => (offset === 1 ? 6 - (value as number) : (value as number)));
  return scored.reduce((total, value) => total + value, 0) / 3;
}
