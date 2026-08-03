import type { AppIconName } from '@/components/icons/registry';

/**
 * Fuente única del modelo MK: los 3 pilares, los 4 ámbitos, y cómo se
 * derivan de las dimensiones ya medidas por el diagnóstico (`MasterProfileDto.scores`).
 * Orden canónico de los pilares: Espíritu → Mente → Cuerpo. Este orden debe
 * respetarse en toda la web y el producto.
 *
 * Vocabulario canónico:
 * - Pilares: Espíritu, Mente, Cuerpo (capacidades internas)
 * - Ámbitos: Mentalidad, Relaciones, Finanzas, Salud física (territorios de la vida)
 * - Resultado: Índice de alineación MK
 */

export type PillarKey = 'espiritu' | 'mente' | 'cuerpo';
export type DomainKey = 'mentalidad' | 'relaciones' | 'financiero' | 'corporal';

export type Pillar = {
  key: PillarKey;
  label: string;
  icon: AppIconName;
  /** Verbo operativo del pilar. */
  verb: string;
  /** Pregunta central del pilar. */
  question: string;
  /** Explicación breve para marketing / arquitectura. */
  brief: string;
  /** Preguntas extendidas (auditoría / detalle). */
  questions: readonly string[];
  lives: string;
};

/** Los tres pilares: capacidades internas con las que vives. */
export const PILLARS: readonly Pillar[] = [
  {
    key: 'espiritu',
    label: 'Espíritu',
    icon: 'flame',
    verb: 'Orienta',
    question: '¿Quién soy y hacia dónde voy?',
    brief:
      'Identidad, principios, propósito, visión y estándares. Entrega dirección a tu sistema de vida.',
    questions: [
      '¿Quién soy?',
      '¿Qué valores me gobiernan?',
      '¿Cuál es mi propósito?',
    ],
    lives:
      'Nombre, apellido y linaje, visión, valores, estándares, identidad, dificultades, factores de la personalidad, IKIGAI y huella personal.',
  },
  {
    key: 'mente',
    label: 'Mente',
    icon: 'brain',
    verb: 'Diseña',
    question: '¿Cómo convierto esa dirección en decisiones y sistemas?',
    brief:
      'Interpretación, estrategia, regulación y construcción de hábitos. Entrega estructura a tu dirección.',
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
    verb: 'Materializa',
    question: '¿Tengo la energía, presencia y capacidad necesarias para convertirlo en acción?',
    brief:
      'Presencia, ejecución, entrenamiento, descanso y nutrición. Entrega capacidad y acción.',
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
  /** Diferencia el ámbito del pilar homónimo (Mente/Mentalidad, Cuerpo/Salud física). */
  distinction: string;
};

/** Los cuatro ámbitos: territorios de la vida donde esas capacidades se manifiestan. */
export const DOMAINS: readonly Domain[] = [
  {
    key: 'mentalidad',
    label: 'Mentalidad',
    icon: 'scan-eye',
    question: '¿Cómo interpreto y enfrento la realidad?',
    distinction:
      'No es el pilar Mente. Es el territorio de creencias, patrones internos y formas de enfrentar lo que ocurre.',
  },
  {
    key: 'relaciones',
    label: 'Relaciones',
    icon: 'handshake',
    question: '¿Con quién construyo y sirvo?',
    distinction: 'Territorio de vínculos: cómo construyes, cuidas y sirves a otros.',
  },
  {
    key: 'financiero',
    label: 'Finanzas',
    icon: 'wallet',
    question: '¿Cómo genero y administro recursos?',
    distinction: 'Territorio de recursos: generación, administración y dirección del dinero.',
  },
  {
    key: 'corporal',
    label: 'Salud física',
    icon: 'heart-pulse',
    question: '¿Cómo cuido y desarrollo mi salud física?',
    distinction:
      'No es el pilar Cuerpo. Es el territorio donde se cuidan entrenamiento, nutrición, descanso y salud.',
  },
] as const;

/** Frase canónica que separa pilares de ámbitos. */
export const MODEL_DISTINCTION =
  'Los pilares son capacidades. Los ámbitos son territorios. Cada celda muestra cómo una se manifiesta en el otro.';

export const MODEL_INTRO = {
  eyebrow: 'EL MODELO MK',
  title: 'Tres pilares. Cuatro ámbitos. Una vida alineada.',
  lead:
    'Espíritu, Mente y Cuerpo observados en Mentalidad, Relaciones, Finanzas y Salud física. Una sola lectura de coherencia.',
} as const;

export type IntegrationExample = {
  domain: DomainKey;
  contributions: Record<PillarKey, string>;
};

/** Cruce 3×4: qué aporta cada pilar en cada ámbito. */
export const INTEGRATION_EXAMPLES: readonly IntegrationExample[] = [
  {
    domain: 'mentalidad',
    contributions: {
      espiritu: 'Identidad, verdad y propósito que orientan cómo ves la realidad.',
      mente: 'Creencias, regulación y decisiones frente a lo que ocurre.',
      cuerpo: 'Estado fisiológico, energía y conductas que condicionan cómo interpretas y respondes a la realidad.',
    },
  },
  {
    domain: 'relaciones',
    contributions: {
      espiritu: 'Valores, amor y propósito compartido en tus vínculos.',
      mente: 'Comunicación, límites y empatía en la relación.',
      cuerpo: 'Presencia, tiempo y acciones coherentes con esos valores.',
    },
  },
  {
    domain: 'financiero',
    contributions: {
      espiritu: 'Propósito y principios frente al dinero.',
      mente: 'Estrategia, planificación y decisiones financieras.',
      cuerpo: 'Trabajo, constancia y ejecución productiva.',
    },
  },
  {
    domain: 'corporal',
    contributions: {
      espiritu: 'Un motivo claro para cuidarte.',
      mente: 'Conocimiento, disciplina y planificación del cuidado.',
      cuerpo: 'Entrenamiento, nutrición y descanso.',
    },
  },
] as const;

export function getIntegrationContribution(domain: DomainKey, pillar: PillarKey): string {
  const example = INTEGRATION_EXAMPLES.find((item) => item.domain === domain);
  return example?.contributions[pillar] ?? '';
}

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
