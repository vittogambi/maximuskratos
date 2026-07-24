import type { AppIconName } from '@/components/icons/registry';

/**
 * Fuente única del modelo MK: los 3 pilares, los 4 ámbitos, y cómo se
 * derivan de las dimensiones ya medidas por el diagnóstico (`MasterProfileDto.scores`).
 * Orden canónico de los pilares: Espíritu → Mente → Cuerpo. Este orden debe
 * respetarse en toda la web y el producto.
 */

export type PillarKey = 'espiritu' | 'mente' | 'cuerpo';
export type DomainKey = 'mentalidad' | 'relaciones' | 'financiero' | 'corporal';

export type Pillar = {
  key: PillarKey;
  label: string;
  icon: AppIconName;
  questions: readonly string[];
  lives: string;
};

/** Los tres pilares — dimensiones que sostienen al individuo. */
export const PILLARS: readonly Pillar[] = [
  {
    key: 'espiritu',
    label: 'Espíritu',
    icon: 'flame',
    questions: [
      '¿Quién soy?',
      '¿Qué valores me gobiernan?',
      '¿Cuál es mi propósito?',
    ],
    lives: 'Nombre, apellido y linaje, visión, valores, estándares, identidad, dificultades, factores de la personalidad, IKIGAI y huella personal.',
  },
  {
    key: 'mente',
    label: 'Mente',
    icon: 'brain',
    questions: [
      '¿Cómo pienso y decido?',
      '¿Cómo gestiono emociones?',
      '¿Cómo construyo hábitos?',
    ],
    lives: 'Planificación, disciplina, estrategia, inteligencia emocional y sistemas personales.',
  },
  {
    key: 'cuerpo',
    label: 'Cuerpo',
    icon: 'muscles',
    questions: [
      '¿Puedo ejecutar?',
      '¿Tengo energía y salud?',
      '¿Sostengo el autodominio?',
    ],
    lives: 'Entrenamiento, nutrición, descanso, salud y autodominio físico.',
  },
] as const;

export type Domain = {
  key: DomainKey;
  label: string;
  icon: AppIconName;
  question: string;
};

/** Los cuatro ámbitos — espacios de la vida donde se manifiestan los pilares. */
export const DOMAINS: readonly Domain[] = [
  { key: 'mentalidad', label: 'Mentalidad', icon: 'crosshair', question: '¿Cómo interpreto y enfrento la realidad?' },
  { key: 'relaciones', label: 'Relaciones', icon: 'users', question: '¿Con quién construyo y sirvo?' },
  { key: 'financiero', label: 'Finanzas', icon: 'briefcase', question: '¿Cómo genero y administro recursos?' },
  { key: 'corporal', label: 'Salud física', icon: 'muscles', question: '¿Cómo cuido y desarrollo mi salud física?' },
] as const;

export type IntegrationExample = {
  domain: DomainKey;
  contributions: Record<PillarKey, string>;
};

/** Cómo cada ámbito necesita de los tres pilares (sección "Ejemplos de integración"). */
export const INTEGRATION_EXAMPLES: readonly IntegrationExample[] = [
  {
    domain: 'mentalidad',
    contributions: {
      espiritu: 'Sentido y criterios para interpretar la realidad.',
      mente: 'Creencias, foco y toma de decisiones.',
      cuerpo: 'Energía para sostener la atención y la acción.',
    },
  },
  {
    domain: 'relaciones',
    contributions: {
      espiritu: 'Valores, amor y propósito compartido.',
      mente: 'Comunicación, límites y empatía.',
      cuerpo: 'Presencia, protección y energía.',
    },
  },
  {
    domain: 'financiero',
    contributions: {
      espiritu: 'Propósito para el dinero.',
      mente: 'Estrategia y planificación.',
      cuerpo: 'Capacidad productiva y trabajo.',
    },
  },
  {
    domain: 'corporal',
    contributions: {
      espiritu: 'Un motivo para cuidarse.',
      mente: 'Disciplina.',
      cuerpo: 'Entrenamiento y salud.',
    },
  },
] as const;

/** Para un pilar, qué aporta a cada ámbito con ejemplo — usado para explicar impacto de una debilidad. */
export function pillarContributions(pillar: PillarKey): ReadonlyArray<{ domain: DomainKey; text: string }> {
  return INTEGRATION_EXAMPLES.map((example) => ({
    domain: example.domain,
    text: example.contributions[pillar],
  }));
}

// ─── Dimensiones del diagnóstico (fuente: apps/api DIMENSIONS) ────────────────

export const DIMENSION_LABELS: Record<string, string> = {
  mentality: 'Mentalidad',
  identity: 'Identidad',
  habits: 'Hábitos',
  environment: 'Entorno',
  finances: 'Finanzas',
  relationships: 'Relaciones',
  purpose: 'Propósito',
  ikigai: 'Ikigai',
};

/** Orden agrupado por pilar (Espíritu → Mente → Cuerpo), para radar y listas de dimensiones. */
export const DIMENSION_ORDER = [
  'identity',
  'purpose',
  'ikigai',
  'mentality',
  'environment',
  'finances',
  'relationships',
  'habits',
] as const;

/** Qué dimensiones medidas alimentan cada pilar. */
const PILLAR_DIMENSIONS: Record<PillarKey, readonly string[]> = {
  espiritu: ['identity', 'purpose', 'ikigai', 'footprint'],
  mente: ['mentality', 'environment', 'finances', 'relationships'],
  cuerpo: ['habits'],
};

/** Qué dimensiones medidas alimentan cada ámbito. */
const DOMAIN_DIMENSIONS: Record<DomainKey, readonly string[]> = {
  mentalidad: ['mentality', 'identity', 'environment'],
  relaciones: ['relationships'],
  financiero: ['finances'],
  corporal: ['habits'],
};

function average(scores: Record<string, number>, dims: readonly string[]): number | null {
  const measured = dims.filter((d) => scores[d] !== undefined);
  if (measured.length === 0) return null;
  const sum = measured.reduce((acc, d) => acc + (scores[d] ?? 0), 0);
  return Math.round(sum / measured.length);
}

/** Score 0-100 por pilar, derivado de las dimensiones ya medidas. `null` si no hay datos aún. */
export function computePillarScores(scores: Record<string, number>): Record<PillarKey, number | null> {
  return {
    espiritu: average(scores, PILLAR_DIMENSIONS.espiritu),
    mente: average(scores, PILLAR_DIMENSIONS.mente),
    cuerpo: average(scores, PILLAR_DIMENSIONS.cuerpo),
  };
}

/** Score 0-100 por ámbito, derivado de las dimensiones ya medidas. `null` si no hay datos aún. */
export function computeDomainScores(scores: Record<string, number>): Record<DomainKey, number | null> {
  return {
    mentalidad: average(scores, DOMAIN_DIMENSIONS.mentalidad),
    relaciones: average(scores, DOMAIN_DIMENSIONS.relaciones),
    financiero: average(scores, DOMAIN_DIMENSIONS.financiero),
    corporal: average(scores, DOMAIN_DIMENSIONS.corporal),
  };
}

// ─── Índices de presentación ───────────────────────────────────────────────────
// Reetiquetan los índices ya calculados por el API (indices.mk_global, indices.clarity)
// sin tocar el motor de scoring: mk_global ya clasifica "Desalineación Total" →
// "Alineación y Control" (es el índice de alineación); clarity promedia
// propósito/identidad/ikigai (es la profundidad del trabajo interior).

export type PresentationIndexKey = 'alineacion' | 'profundidad' | 'ejecucion' | 'estabilidad';

export const PRESENTATION_INDICES: Record<PresentationIndexKey, { sourceKey: string; label: string }> = {
  alineacion: { sourceKey: 'mk_global', label: 'Alineación' },
  profundidad: { sourceKey: 'clarity', label: 'Profundidad' },
  ejecucion: { sourceKey: 'execution', label: 'Ejecución' },
  estabilidad: { sourceKey: 'stability', label: 'Estabilidad' },
};

/** Áreas (pilares + ámbitos) con score suficiente para clasificarse como desarrolladas o a fortalecer. */
export type SystemArea = { label: string; score: number };

export function developedAreas(areas: SystemArea[], threshold = 70, limit = 3): SystemArea[] {
  return areas
    .filter((a) => a.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function areasNeedingStrength(areas: SystemArea[], threshold = 50, limit = 3): SystemArea[] {
  return areas
    .filter((a) => a.score < threshold)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}

export type PillarMisalignment = { high: PillarKey; low: PillarKey; gap: number };

/** Brecha relevante entre el pilar más fuerte y el más débil (desalineación del sistema). */
export function pillarMisalignment(
  pillarScores: Record<PillarKey, number | null>,
  threshold = 20,
): PillarMisalignment | null {
  const measured = (Object.entries(pillarScores) as Array<[PillarKey, number | null]>).filter(
    (entry): entry is [PillarKey, number] => entry[1] !== null,
  );
  if (measured.length < 2) return null;
  const sorted = [...measured].sort((a, b) => b[1] - a[1]);
  const [high, highScore] = sorted[0];
  const [low, lowScore] = sorted[sorted.length - 1];
  const gap = highScore - lowScore;
  return gap >= threshold ? { high, low, gap } : null;
}
