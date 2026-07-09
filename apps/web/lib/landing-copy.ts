import type { AppIconName } from '@/components/icons/registry';

/** Primary landing CTA: register → post-auth diagnostic flow */
export const LANDING_DIAGNOSTIC_CTA = {
  href: '/register',
  label: 'Haz tu diagnóstico inicial',
  labelAlt: 'Quiero hacer mi diagnóstico inicial',
} as const;

/** Shared close block for public subpages */
export const SUBPAGE_DIAGNOSTIC_CTA = {
  title: 'Haz tu diagnóstico inicial',
  lead: 'Antes de construir, hay que mirar con honestidad. El diagnóstico MK identifica tu estado actual, tus principales bloqueos y las áreas que requieren prioridad.',
} as const;

export const LANDING_HERO = {
  lines: ['Descúbrete.', 'Alíneate.', 'Construye.'] as const,
  lead: 'Define tu propósito trascendental y conviértelo en una vida coherente, significativa y con impacto.',
  panel:
    'MAXIMUS KRATOS es un sistema de reconstrucción personal para hombres que quieren dejar de vivir en automático y comenzar a construir una vida con dirección, dominio propio y propósito.',
} as const;

export const LANDING_PROBLEM = {
  eyebrow: 'El espejo',
  title: 'No necesitas otra frase motivacional.',
  titleLine2: 'Necesitas una estructura.',
  lead: 'Muchos hombres no están destruidos. Están fragmentados.',
  points: [
    'Tienen fuerza, pero no dirección.',
    'Tienen responsabilidades, pero no visión.',
    'Tienen deseos de cambiar, pero no un sistema.',
    'Tienen potencial, pero lo dispersan entre urgencias, hábitos, deuda, cansancio, culpa, aislamiento o falta de propósito.',
  ] as const,
  close:
    'MK nace para ayudar al hombre que sabe que puede ser más, pero necesita ordenar su vida desde la raíz.',
} as const;

export const LANDING_PROFILES = [
  {
    num: '01',
    title: 'El hombre en crisis',
    body: 'Sabe que algo no está bien. Está cansado, disperso, endeudado, solo o desconectado de sí mismo. Necesita detener la caída y recuperar control.',
  },
  {
    num: '02',
    title: 'El hombre inestable',
    body: 'Tiene momentos de avance, pero no sostiene el proceso. Empieza, abandona, vuelve a intentar. Necesita disciplina, método y continuidad.',
  },
  {
    num: '03',
    title: 'El hombre sólido',
    body: 'Funciona. Trabaja. Cumple. Entrena o produce. Pero siente que su vida todavía no está alineada con una misión mayor. Necesita profundidad, propósito e impacto.',
  },
  {
    num: '04',
    title: 'El hombre constructor',
    body: 'Ya tiene base, pero quiere llevar su vida a otro nivel: ordenar su cuerpo, mente, finanzas, relaciones y legado para servir mejor y construir algo que permanezca.',
  },
] as const;

export const LANDING_PROFILES_CLOSE =
  'MK no es solo para hombres rotos. Es para hombres que quieren ser reconstruidos, fortalecidos y orientados hacia una vida más grande que ellos mismos.';

export const LANDING_REALMS: ReadonlyArray<{
  label: string;
  icon: AppIconName;
  symbol: string;
  body: string;
}> = [
  {
    label: 'Cuerpo',
    icon: 'muscles',
    symbol: 'Base física',
    body: 'El cuerpo es la primera escuela del autodominio. Entrenar, alimentarse y cuidar la salud no es vanidad: es construir la base física para sostener una vida exigente.',
  },
  {
    label: 'Mente',
    icon: 'brain',
    symbol: 'Orden y ejecución',
    body: 'La mente ordena, decide y ejecuta. Aquí trabajamos hábitos, planificación, finanzas, relaciones, gestión emocional y toma de decisiones.',
  },
  {
    label: 'Espíritu',
    icon: 'flame',
    symbol: 'El norte',
    body: 'El espíritu define el norte. Aquí se clarifican visión, valores, propósito, estándares, obstáculos internos e identidad.',
  },
];

export const LANDING_REALMS_CLOSE =
  'Cuando cuerpo, mente y espíritu se alinean, el hombre deja de reaccionar a la vida y empieza a construirla.';

export const LANDING_METHOD_STEPS = [
  {
    num: '01',
    eyebrow: 'DIAGNÓSTICO INICIAL',
    title: 'Mira con honestidad dónde estás',
    body: 'Evaluamos tu estado actual en las áreas críticas de tu vida: propósito, hábitos, cuerpo, salud, relaciones, finanzas y ejecución.',
    imageKey: 'phase01' as const,
  },
  {
    num: '02',
    eyebrow: 'CLARIDAD DE PROPÓSITO',
    title: 'IKIGAI como brújula',
    body: 'Usamos la lógica del IKIGAI para identificar lo que amas, lo que sabes hacer, lo que el mundo necesita y aquello que puede transformarse en una actividad concreta y sostenible.',
    imageKey: 'phase02' as const,
  },
  {
    num: '03',
    eyebrow: 'ARQUITECTURA DEL SENTIDO',
    title: 'Del propósito a planes reales',
    body: 'Convertimos tu propósito en planes reales: entrenamiento, nutrición, finanzas, relaciones, hábitos, aprendizaje y proyectos.',
    imageKey: 'phase03' as const,
  },
  {
    num: '04',
    eyebrow: 'EJECUCIÓN PROGRESIVA',
    title: 'Avanzar con orden',
    body: 'No se trata de cambiar todo en una semana. Se trata de avanzar con orden, indicadores y bitácora, para que cada acción tenga dirección.',
    imageKey: 'phase04' as const,
  },
  {
    num: '05',
    eyebrow: 'SEGUIMIENTO Y AJUSTE',
    title: 'Lo que no se mide se diluye',
    body: 'MK te ayuda a observar tu avance, corregir desviaciones y sostener el proceso.',
    imageKey: 'phase05' as const,
  },
] as const;

export const LANDING_BENEFITS: ReadonlyArray<{
  title: string;
  body: string;
  icon: AppIconName;
}> = [
  {
    title: 'Dirección',
    icon: 'compass',
    body: 'Dejas de improvisar tu vida y comienzas a actuar desde una visión definida.',
  },
  {
    title: 'Autodominio',
    icon: 'shield',
    body: 'Construyes disciplina física, mental y espiritual para sostener decisiones difíciles.',
  },
  {
    title: 'Coherencia',
    icon: 'anchor',
    body: 'Tus hábitos, planes y prioridades empiezan a alinearse con el hombre que dices querer ser.',
  },
  {
    title: 'Orden',
    icon: 'target',
    body: 'Identificas dónde estás perdiendo energía: cuerpo descuidado, deuda, relaciones débiles, falta de foco o ausencia de propósito.',
  },
  {
    title: 'Impacto',
    icon: 'flame',
    body: 'No te fortaleces solo para ti. Te fortaleces para servir, liderar, proteger, construir y dejar una huella.',
  },
];

export const LANDING_CLOSE = {
  eyebrow: 'Esto no es motivación. Es reconstrucción.',
  title: 'No se trata de aparentar fuerza.',
  titleLine2: 'Se trata de convertirte en un hombre capaz de sostener lo que dice valorar.',
  body: 'MAXIMUS KRATOS no promete una vida fácil. Promete un camino ordenado para hombres que quieren hacerse responsables de su cuerpo, su mente, su espíritu y su impacto.',
  stepEyebrow: 'Primer paso',
  stepTitle: 'Haz tu diagnóstico inicial',
  stepBody:
    'Antes de construir, hay que mirar con honestidad. El diagnóstico MK te permite identificar tu estado actual, tus principales bloqueos y las áreas que requieren prioridad.',
} as const;

export const BASE_CONCEPTUAL = {
  eyebrow: 'MK · BASE CONCEPTUAL',
  title: 'La promesa de MK',
  titleLine2: 'toca cuatro dimensiones reales.',
  lead: 'No es retórica. Es un marco práctico anclado en lo que la investigación asocia con salud, bienestar y estabilidad.',
  sectionEyebrow: 'MK · DIMENSIONES',
  sectionTitle: 'Cuatro bases. Una promesa.',
  sectionLead:
    'Cada dimensión está respaldada por evidencia — no por retórica motivacional.',
  close: 'Esto fundamenta la promesa.',
  closeLead: 'El siguiente paso es mirar tu estado con honestidad.',
  pillars: [
    {
      title: 'Propósito',
      body: 'La investigación sobre sentido vital muestra asociación entre significado en la vida y mejores indicadores de salud y bienestar.',
    },
    {
      title: 'Autodominio',
      body: 'La teoría de autodeterminación identifica autonomía, competencia y relación como necesidades psicológicas vinculadas al funcionamiento óptimo y bienestar. MK traduce eso en sistema práctico: decisión propia, mejora de capacidad y vínculo con otros.',
    },
    {
      title: 'Cuerpo',
      body: 'La actividad física tiene evidencia consistente de beneficios para la salud mental, aunque los mecanismos y moderadores sigan estudiándose.',
    },
    {
      title: 'Orden financiero y vital',
      body: 'Las preocupaciones financieras se asocian con malestar psicológico. Incluir deuda, presupuesto y planificación no es accesorio: es parte de reconstruir estabilidad.',
    },
  ] as const,
} as const;
