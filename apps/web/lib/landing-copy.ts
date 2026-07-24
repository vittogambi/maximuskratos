import type { AppIconName } from '@/components/icons/registry';
import { isEarlyAccessMode } from '@/lib/product-phase';

/** Primary public CTA: early access account or full diagnostic. */
export const LANDING_PRIMARY_CTA = isEarlyAccessMode()
  ? ({
      href: '/register',
      label: 'Crear cuenta de fundador',
      labelAlt: 'Crear mi cuenta',
    } as const)
  : ({
      href: '/register',
      label: 'Haz tu diagnóstico inicial',
      labelAlt: 'Quiero hacer mi diagnóstico inicial',
    } as const);

/** @deprecated Prefer LANDING_PRIMARY_CTA — kept as alias during migration. */
export const LANDING_DIAGNOSTIC_CTA = LANDING_PRIMARY_CTA;

/** Shared close block for public subpages */
export const SUBPAGE_PRIMARY_CTA = isEarlyAccessMode()
  ? ({
      title: 'Reserva tu acceso de fundador',
      lead: 'La plataforma completa llega pronto: diagnóstico, Perfil Maestro y Ruta. Hoy puedes crear tu cuenta y asegurar tu lugar.',
    } as const)
  : ({
      title: 'Haz tu diagnóstico inicial',
      lead: 'Antes de construir, hay que mirar con honestidad. El diagnóstico MK identifica tu estado actual, tus principales bloqueos y las áreas que requieren prioridad.',
    } as const);

/** @deprecated Prefer SUBPAGE_PRIMARY_CTA */
export const SUBPAGE_DIAGNOSTIC_CTA = SUBPAGE_PRIMARY_CTA;

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
    'Esa fragmentación no se queda en la teoría: se manifiesta en tu mentalidad, tus relaciones, tus finanzas y tu cuerpo. MK nace para ayudar al hombre que sabe que puede ser más, pero necesita ordenar su vida desde la raíz.',
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
  question: string;
  body: string;
}> = [
  {
    label: 'Espíritu',
    icon: 'flame',
    symbol: 'El norte',
    question: '¿Quién soy y qué es verdadero para mí?',
    body: 'Visión, valores, propósito e identidad. Define el norte que sostiene todo lo demás.',
  },
  {
    label: 'Mente',
    icon: 'brain',
    symbol: 'Orden y ejecución',
    question: '¿Cómo pienso, decido y ejecuto?',
    body: 'Hábitos, planificación, decisiones y gestión emocional. Convierte el norte en acción.',
  },
  {
    label: 'Cuerpo',
    icon: 'muscles',
    symbol: 'Base física',
    question: '¿Tengo la energía para sostenerlo?',
    body: 'Entrenamiento, nutrición, descanso y salud. La base física de una vida exigente.',
  },
];

export const LANDING_REALMS_CLOSE =
  'Cuando espíritu, mente y cuerpo se alinean, el hombre deja de reaccionar a la vida y empieza a construirla.';

/** Sección compacta tras los pilares: los 4 ámbitos donde esas capacidades se manifiestan. */
export const LANDING_DOMAINS_SECTION = {
  eyebrow: 'LOS CUATRO ÁMBITOS',
  title: 'Los pilares se manifiestan en cuatro ámbitos de tu vida.',
  leadInternalLabel: 'Dimensiones internas',
  leadInternalItems: ['Espíritu', 'Mente', 'Cuerpo'] as const,
  leadExternalLabel: 'Ámbitos de la vida',
  leadExternalItems: ['Mentalidad', 'Relaciones', 'Finanzas', 'Salud física'] as const,
  leadClose: 'Ahí es donde esas dimensiones se manifiestan y se ponen a prueba.',
  linkLabel: 'Ver el modelo completo',
  linkHref: '/marco-central',
} as const;

export const LANDING_WHAT_IS = {
  titleLine1: 'Una metodología de alineación integral.',
  titleLine2: 'Una plataforma para llevarla a la práctica.',
  lead: 'Tres dimensiones. Un sistema. Cuando se alinean, el hombre deja de reaccionar a la vida y empieza a construirla.',
} as const;

export const LANDING_METHOD_STEPS: ReadonlyArray<{
  num: string;
  eyebrow: string;
  title: string;
  body: string;
  platform: string;
  imageKey: 'phase01' | 'phase02' | 'phase03' | 'phase04' | 'phase05';
  link?: { href: string; label: string };
}> = [
  {
    num: '01',
    eyebrow: 'DIAGNÓSTICO INICIAL',
    title: 'Mira con honestidad dónde estás',
    body: 'Evaluamos tu estado actual en las áreas críticas de tu vida: propósito, hábitos, cuerpo, salud, relaciones, finanzas y ejecución.',
    platform: 'Dentro de MK: Diagnóstico inicial',
    imageKey: 'phase01',
  },
  {
    num: '02',
    eyebrow: 'CLARIDAD DE PROPÓSITO',
    title: 'IKIGAI como brújula',
    body: 'Usamos la lógica del IKIGAI para identificar lo que amas, lo que sabes hacer, lo que el mundo necesita y aquello que puede transformarse en una actividad concreta y sostenible.',
    platform: 'Se refleja en: Perfil Maestro',
    imageKey: 'phase02',
    link: { href: '/ikigai', label: 'Qué es el IKIGAI en MK' },
  },
  {
    num: '03',
    eyebrow: 'ARQUITECTURA DEL SENTIDO',
    title: 'Del propósito a planes reales',
    body: 'Convertimos tu propósito en planes reales: entrenamiento, nutrición, finanzas, relaciones, hábitos, aprendizaje y proyectos.',
    platform: 'Se organiza en: Ruta MK',
    imageKey: 'phase03',
  },
  {
    num: '04',
    eyebrow: 'EJECUCIÓN PROGRESIVA',
    title: 'Avanzar con orden',
    body: 'No se trata de cambiar todo en una semana. Se trata de avanzar con orden, indicadores y bitácora, para que cada acción tenga dirección.',
    platform: 'Se desarrolla mediante: Auditorías y progreso por etapas',
    imageKey: 'phase04',
  },
  {
    num: '05',
    eyebrow: 'SEGUIMIENTO Y AJUSTE',
    title: 'Lo que no se mide se diluye',
    body: 'MK te ayuda a observar tu avance, corregir desviaciones y sostener el proceso.',
    platform: 'Se observa en: Panel personal e índices',
    imageKey: 'phase05',
  },
];

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

export const LANDING_CLOSE = isEarlyAccessMode()
  ? ({
      eyebrow: 'Esto no es motivación. Es reconstrucción.',
      title: 'No se trata de aparentar fuerza.',
      titleLine2: 'Se trata de convertirte en un hombre capaz de sostener lo que dice valorar.',
      body: 'MAXIMUS KRATOS no promete una vida fácil. Promete un camino ordenado para hombres que quieren hacerse responsables de su espíritu, su mente, su cuerpo y su impacto.',
      stepEyebrow: 'Primer paso',
      stepTitle: 'Asegura tu acceso de fundador',
      stepBody:
        'Abre tu cuenta hoy. Cuando lancemos web y app bajo la misma cuenta, entras primero.',
      platformNote: 'Registro abierto, sin tarjeta. Te avisamos al lanzar.',
    } as const)
  : ({
      eyebrow: 'Esto no es motivación. Es reconstrucción.',
      title: 'No se trata de aparentar fuerza.',
      titleLine2: 'Se trata de convertirte en un hombre capaz de sostener lo que dice valorar.',
      body: 'MAXIMUS KRATOS no promete una vida fácil. Promete un camino ordenado para hombres que quieren hacerse responsables de su espíritu, su mente, su cuerpo y su impacto.',
      stepEyebrow: 'Primer paso',
      stepTitle: 'Haz tu diagnóstico inicial',
      stepBody:
        'Antes de construir, hay que mirar con honestidad. El diagnóstico MK te permite identificar tu estado actual, tus principales bloqueos y las áreas que requieren prioridad: una lectura integral de tu sistema, no una etiqueta.',
      platformNote: 'El diagnóstico se realiza online, en la plataforma web.',
    } as const);

export const LANDING_HERO_STATUS = isEarlyAccessMode()
  ? ({
      badge: 'Acceso anticipado abierto. Diagnóstico y apps próximamente',
    } as const)
  : ({
      badge: 'Plataforma web disponible hoy. App móvil en desarrollo',
    } as const);

export const BASE_CONCEPTUAL = {
  eyebrow: 'MK · BASE CONCEPTUAL',
  title: 'La promesa de MK',
  titleLine2: 'toca cuatro dimensiones reales.',
  lead: 'No es retórica. Es un marco práctico anclado en lo que la investigación asocia con salud, bienestar y estabilidad.',
  sectionEyebrow: 'MK · DIMENSIONES',
  sectionTitle: 'Cuatro bases. Una promesa.',
  sectionLead:
    'Cada dimensión está respaldada por evidencia, no por retórica motivacional.',
  close: 'Esto fundamenta la promesa.',
  closeLead: isEarlyAccessMode()
    ? 'El siguiente paso es reservar tu acceso de fundador.'
    : 'El siguiente paso es mirar tu estado con honestidad.',
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
