import type { AppIconName } from '@/components/icons/registry';
import { isEarlyAccessMode } from '@/lib/product-phase';

type InsideMkFocus = 'overview' | 'diagnostico' | 'ruta' | 'perfil' | 'proposito';

/** Primary public CTA: early access account or full diagnostic. */
export const LANDING_PRIMARY_CTA = isEarlyAccessMode()
  ? ({
      href: '/register',
      label: 'Obtener acceso anticipado',
      labelAlt: 'Crear mi cuenta de fundador',
    } as const)
  : ({
      href: '/register',
      label: 'Haz tu diagnóstico inicial',
      labelAlt: 'Quiero hacer mi diagnóstico inicial',
    } as const);

/** @deprecated Prefer LANDING_PRIMARY_CTA — kept as alias during migration. */
export const LANDING_DIAGNOSTIC_CTA = LANDING_PRIMARY_CTA;

/** Nota canónica bajo CTAs de registro (hero, precios). */
export const LANDING_FOUNDER_CTA_NOTE =
  'Sin tarjeta ni cobro. Acceso prioritario y 30 días de prueba al activarse la plataforma.';

/** Definición del estatus de fundador (FAQ y textos que lo expliquen, no bajo cada CTA). */
export const LANDING_FOUNDER_STATUS =
  'Estatus de fundador: identificación permanente dentro de tu cuenta, acceso prioritario a las primeras versiones y posibilidad de participar en pruebas y ciclos de retroalimentación.';

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

// ── 1. Hero: categoría, promesa y prueba de producto ───────────────────────
export const LANDING_HERO = {
  eyebrow: 'App y plataforma web de desarrollo personal para hombres',
  lines: ['Convierte tu propósito', 'en una ruta que puedas ejecutar'] as const,
  /** Forced line break after Alíneate so large desktops never collapse to one long row. */
  signatureLines: ['Descúbrete. Alíneate.', 'Construye.'] as const,
  signature: 'Descúbrete. Alíneate. Construye.',
  lead: 'Detecta la distancia entre lo que valoras y cómo estás viviendo. Define un propósito trascendental que ordene tus prioridades y conviértelo en una Ruta MK con decisiones, planes y acciones que puedas revisar y medir.',
  /** Mobile-only: gap insight only; H1 already carries purpose → executable route. */
  leadMobile: 'Detecta la distancia entre lo que valoras y cómo vives.',
  secondaryCta: { href: '/#funcionamiento', label: 'Ver cómo funciona' } as const,
  previewLabel: 'Vista previa del producto en desarrollo',
} as const;

/** SEO/GEO: siteConfig, root meta, JSON-LD, llms.txt. Keep in sync with hero H1 + lead. */
export const LANDING_SEO_DESCRIPTION = `${LANDING_HERO.lines.join(' ')}. ${LANDING_HERO.lead}`;

/** Homepage meta description: promise + early-access status clause. */
export const LANDING_HOME_META_DESCRIPTION = `${LANDING_SEO_DESCRIPTION} Sitio disponible hoy; webapp y apps para iOS y Android en desarrollo.`;

/** Estado real de la plataforma, mostrado como líneas cortas junto al CTA del hero. */
export const LANDING_HERO_STATUS_PILLS: ReadonlyArray<string> = isEarlyAccessMode()
  ? ['Sitio disponible · Webapp, iOS y Android en desarrollo']
  : ['Plataforma web disponible hoy', 'App para iOS y Android en desarrollo'];

// ── 2. Recorrido humano (proceso) ───────────────────────────────────────────
export const LANDING_HOW_IT_WORKS_INTRO = {
  eyebrow: 'TU RECORRIDO EN MK',
  title: 'De la auditoría a la ejecución, en cuatro etapas.',
} as const;

export const LANDING_HOW_IT_WORKS: ReadonlyArray<{
  num: string;
  eyebrow: string;
  title: string;
  body: string;
  platform: string;
  imageKey: 'phase01' | 'phase02' | 'phase03' | 'phase05';
  link?: { href: string; label: string };
}> = [
  {
    num: '01',
    eyebrow: 'DESCÚBRETE',
    title: 'Audita tu realidad',
    body: 'Identifica fortalezas, debilidades y la distancia entre lo que valoras y cómo estás viviendo.',
    platform: 'Dentro de MK: Diagnóstico inicial',
    imageKey: 'phase01',
  },
  {
    num: '02',
    eyebrow: 'ALÍNEATE',
    title: 'Define tu dirección',
    body: 'Construye una Hoja de Ruta de Propósito que ordene tus prioridades y funcione como criterio para decidir.',
    platform: 'Se refleja en: Hoja de Ruta de Propósito',
    imageKey: 'phase02',
  },
  {
    num: '03',
    eyebrow: 'CONSTRUYE',
    title: 'Convierte dirección en ejecución',
    body: 'Lleva esas prioridades a una Ruta MK con planes, acciones y hábitos concretos.',
    platform: 'Se organiza en: Ruta MK',
    imageKey: 'phase03',
  },
  {
    num: '04',
    eyebrow: 'REVISA Y AJUSTA',
    title: 'Mide coherencia',
    body: 'Observa tus avances, detecta nuevas desalineaciones y recalibra tu ruta.',
    platform: 'Se observa en: Panel e índices',
    imageKey: 'phase05',
  },
];

export const LANDING_HOW_IT_WORKS_CLOSE = {
  body: 'Este es el proceso. Las herramientas que sostienen cada etapa están en la plataforma.',
  link: { href: '/sistema', label: 'Ver la vista previa' },
} as const;

// ── 3. Dentro de la plataforma (arquitectura del producto) ──────────────────
export const LANDING_INSIDE_MK_INTRO = {
  eyebrow: 'DENTRO DE LA PLATAFORMA',
  title: 'Las herramientas que sostienen cada etapa del proceso.',
} as const;

export const LANDING_INSIDE_MK_STAGES: ReadonlyArray<{
  id: string;
  title: string;
  body: string;
  focus: InsideMkFocus;
}> = [
  {
    id: 'diagnostico',
    title: 'Diagnóstico',
    body: 'Responde preguntas estructuradas en Espíritu, Mente y Cuerpo.',
    focus: 'diagnostico',
  },
  {
    id: 'perfil',
    title: 'Perfil Maestro',
    body: 'Comprende tus fortalezas, brechas y prioridades iniciales.',
    focus: 'perfil',
  },
  {
    id: 'hdrp',
    title: 'Hoja de Ruta de Propósito',
    body: 'Define el criterio que orientará tus decisiones.',
    focus: 'proposito',
  },
  {
    id: 'ruta',
    title: 'Ruta MK',
    body: 'Convierte esa dirección en planes, acciones y hábitos.',
    focus: 'ruta',
  },
  {
    id: 'panel',
    title: 'Panel e índices',
    body: 'Revisa tu coherencia y ajusta el proceso con nueva información.',
    focus: 'overview',
  },
];

// ── 4. Diferenciación sin copy defensivo ────────────────────────────────────
export const LANDING_DIFFERENTIATION = {
  eyebrow: 'UNA SOLA PLATAFORMA',
  title: 'Una estructura continua para dirigir tu proceso',
  body: 'MK conecta lo que normalmente aparece separado: diagnóstico, propósito, prioridades, ejecución y revisión dentro de una misma infraestructura. Lo que descubres sobre ti se convierte en prioridades, decisiones y acciones que puedes revisar en la misma plataforma.',
  /** Mobile-only: keep the stack, drop the second clause. */
  bodyMobile:
    'MK conecta diagnóstico, propósito, prioridades, ejecución y revisión en una misma plataforma.',
} as const;

export const LANDING_DIFFERENTIATION_TABLE: ReadonlyArray<{
  model: string;
  delivers: string;
  isMk?: boolean;
}> = [
  { model: 'Curso', delivers: 'Contenido y ejercicios' },
  { model: 'Mentoría', delivers: 'Orientación mediante sesiones' },
  { model: 'Tracker de hábitos', delivers: 'Registro y seguimiento de conductas' },
  {
    model: 'Maximus Kratos',
    delivers: 'Diagnóstico, dirección, ejecución y revisión dentro de una misma plataforma',
    isMk: true,
  },
];

// ── 5. Método condensado (Espíritu/Mente/Cuerpo + los 4 ámbitos) ───────────
export const LANDING_REALMS: ReadonlyArray<{
  num: string;
  label: string;
  icon: AppIconName;
  symbol: string;
  body: string;
}> = [
  {
    num: '01',
    label: 'Espíritu',
    icon: 'flame',
    symbol: 'Orienta',
    body: 'Define quién eres, qué valoras y hacia dónde quieres dirigir tu vida.',
  },
  {
    num: '02',
    label: 'Mente',
    icon: 'brain',
    symbol: 'Diseña',
    body: 'Convierte esa dirección en decisiones, estrategias y sistemas que puedas sostener.',
  },
  {
    num: '03',
    label: 'Cuerpo',
    icon: 'muscles',
    symbol: 'Materializa',
    body: 'Desarrolla la energía, la presencia y la capacidad necesarias para llevarlo a la acción.',
  },
];

export const LANDING_REALMS_CLOSE =
  'La alineación ocurre cuando tu dirección, tus decisiones y tus acciones responden al mismo propósito.';

/** Sección compacta: los 3 pilares y los 4 ámbitos donde se manifiestan. Mapa breve, no la matriz completa. */
export const LANDING_DOMAINS_SECTION = {
  eyebrow: 'ARQUITECTURA DEL SENTIDO',
  title: 'Tres pilares para orientar, diseñar y ejecutar tu vida.',
  territoriesLabel: 'Se aplican a cuatro territorios',
  territories: ['Mentalidad', 'Relaciones', 'Finanzas', 'Salud física'] as const,
  leadClose:
    'Los pilares describen las capacidades con las que actúas. Los ámbitos, las partes de tu vida donde esas capacidades se expresan.',
  linkLabel: 'Ver el Marco Central completo',
  linkHref: '/marco-central',
} as const;

// ── 6. Puertas de entrada ────────────────────────────────────────────────
export const LANDING_GATEWAYS_INTRO = {
  eyebrow: 'PARA QUIÉN ES MK',
  title: 'Tu punto de partida',
  lead: 'Cada persona llega con una situación distinta. Identifica cuál describe mejor la tuya.',
} as const;

export const LANDING_GATEWAYS: ReadonlyArray<{ num: string; title: string; body: string }> = [
  {
    num: '01',
    title: 'Encontrar dirección',
    body: 'Tienes capacidad para avanzar, pero todavía no existe un norte que ordene tus decisiones.',
  },
  {
    num: '02',
    title: 'Recuperar coherencia',
    body: 'Lo que haces hoy no refleja completamente lo que valoras ni la persona que quieres ser.',
  },
  {
    num: '03',
    title: 'Sostener la ejecución',
    body: 'Sabes hacia dónde ir, pero te cuesta convertirlo en acciones consistentes.',
  },
  {
    num: '04',
    title: 'Construir algo que trascienda',
    body: 'Ya tienes una base y quieres dirigirla hacia una contribución, una obra o un legado.',
  },
];

export const LANDING_GATEWAYS_CLOSE =
  'El diagnóstico identifica dónde está hoy tu principal brecha. Desde ahí, MK organiza propósito, prioridades y ejecución dentro de una Ruta MK personal.';

// ── 7. Estado del producto ──────────────────────────────────────────────
export const LANDING_PRODUCT_STATUS_INTRO = {
  eyebrow: 'ESTADO DEL PRODUCTO',
  title: 'Qué puedes usar hoy',
  lead: 'Y qué falta por activar antes de crear tu cuenta.',
} as const;

export const LANDING_PRODUCT_STATUS_AVAILABLE: ReadonlyArray<string> = [
  'Sitio público y contenido metodológico',
  'Registro y cuenta de fundador',
  'Vistas previas del producto en desarrollo',
];

export const LANDING_PRODUCT_STATUS_UPCOMING: ReadonlyArray<string> = [
  'Diagnóstico y Perfil Maestro',
  'Hoja de Ruta de Propósito y Ruta MK',
  'Panel e índices',
  'Webapp, iOS y Android',
];

// ── 8. Precios (ancla #precios) ──────────────────────────────────────────
export const LANDING_PRECIOS_INTRO = {
  eyebrow: 'PRECIOS',
  title: 'Acceso anticipado de fundador.',
  lead: 'Sin cobro al registrarte. Precios al lanzamiento.',
} as const;

// ── 9. Cierre / CTA final ───────────────────────────────────────────────
export const LANDING_CLOSE = isEarlyAccessMode()
  ? ({
      eyebrow: 'COHERENCIA CON CRITERIO',
      title: 'Diagnóstico, dirección y Ruta MK',
      titleLine2: 'en una sola plataforma personal.',
      body: 'Maximus Kratos reúne la auditoría de tu realidad, el propósito que ordena tus prioridades y la ejecución revisable dentro de tu cuenta.',
      stepEyebrow: 'Primer paso',
      stepTitle: 'Crea tu cuenta de fundador',
      stepBody: null,
      platformNote: LANDING_FOUNDER_CTA_NOTE,
    } as const)
  : ({
      eyebrow: 'La reconstrucción no depende de la motivación.',
      title: 'Construir coherencia entre lo que valoras y cómo vives',
      titleLine2: 'pesa más que aparentar fuerza.',
      body: 'MAXIMUS KRATOS ofrece un camino ordenado para hacerte responsable de tu espíritu, tu mente, tu cuerpo y tu impacto.',
      stepEyebrow: 'Primer paso',
      stepTitle: 'Haz tu diagnóstico inicial',
      stepBody:
        'Antes de construir, hay que mirar con honestidad. El diagnóstico MK te permite identificar tu estado actual, tus principales bloqueos y las áreas que requieren prioridad: una lectura integral de tu sistema, no una etiqueta.',
      platformNote: 'El diagnóstico se realiza online, en la plataforma web.',
    } as const);
