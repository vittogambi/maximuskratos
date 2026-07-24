import type { AppIconName } from '@/components/icons/registry';

/**
 * Video de profundización embebido en /marco-central.
 * Fuente: Google Drive — requiere que el archivo esté compartido como
 * "Cualquier usuario con el enlace puede ver", si no el iframe mostrará error de acceso.
 * Reemplaza driveFileId cuando se suba el video definitivo.
 */
const MARCO_VIDEO_DRIVE_FILE_ID = '18UXKUCj-c9kYZUbWItB-pViqEhzxbNCG';

export const MARCO_VIDEO = {
  embedUrl: `https://drive.google.com/file/d/${MARCO_VIDEO_DRIVE_FILE_ID}/preview`,
} as const;

export type MarcoCard = {
  num: string;
  title: string;
  icon: AppIconName;
  /** Pregunta principal del pilar (vista compacta). */
  question: string;
  /** Concepto que aporta al sistema (vista compacta). */
  apport: string;
  /** Explicación extendida al expandir. */
  deep: string;
  /** Enlace editorial opcional a una página de profundización dedicada. */
  link?: { href: string; label: string };
};

export type MarcoStage = {
  num: string;
  tag: string;
  icon: AppIconName;
  title: string;
  body: string;
  platform: string;
};

export type HdrpBlock = {
  title: string;
  body: string;
};

export type ActionStep = {
  num: string;
  title: string;
  body: string;
};

/** Cinco etapas del flujo: lectura → auditoría → interpretación → integración → ejecución. */
export const MARCO_STAGES: ReadonlyArray<MarcoStage> = [
  {
    num: '01',
    tag: 'Lectura inicial',
    icon: 'scan-line',
    title: 'Diagnóstico',
    body: 'Construye una primera representación de tu estado actual y detecta dónde existe mayor alineación, tensión o desequilibrio.',
    platform: 'Diagnóstico inicial',
  },
  {
    num: '02',
    tag: 'Auditoría profunda',
    icon: 'columns',
    title: 'Los nueve pilares',
    body: 'Exploran las definiciones, principios, patrones y decisiones que sostienen tu forma de vivir.',
    platform: 'Auditorías de la Ruta',
  },
  {
    num: '03',
    tag: 'Interpretación',
    icon: 'shadow',
    title: 'Arquetipo y sombra',
    body: 'Muestran cómo expresas tus capacidades, dónde pierdes equilibrio y qué patrones pueden distorsionar tu desarrollo.',
    platform: 'Perfil Maestro',
  },
  {
    num: '04',
    tag: 'Integración',
    icon: 'map',
    title: 'Hoja de Ruta de Propósito',
    body: 'Reúne lo descubierto y lo convierte en una arquitectura personal: dirección, principios, prioridades y criterios de decisión.',
    platform: 'HdRP',
  },
  {
    num: '05',
    tag: 'Ejecución',
    icon: 'target',
    title: 'Ruta MK',
    body: 'Convierte el plano en acciones, misiones, indicadores y revisiones que mantienen vivo el proceso.',
    platform: 'Ruta MK',
  },
];

/**
 * Orden canónico de los pilares del Marco Central (Espíritu).
 * Fuente: formularios × paso — no alterar sin actualizar formularios y producto.
 *
 * 01 Nombre, apellido y linaje → 02 Visión → 03 Valores → 04 Estándares →
 * 05 Identidad → 06 Dificultades → 07 Factores de la personalidad →
 * 08 Ikigai → 09 Huella Personal
 */
export const MARCO_CARDS: ReadonlyArray<MarcoCard> = [
  {
    num: '01',
    title: 'Nombre, apellido y linaje',
    icon: 'anchor',
    question: '¿Qué has heredado y qué te corresponde transformar?',
    apport: 'Contexto',
    deep: 'Explora el nombre, el apellido y el linaje para instalar una conciencia de continuidad. Examina historias, modelos, fortalezas, lealtades y patrones recibidos. No puedes elegir tu origen, pero sí decidir qué continúas, qué reparas y qué termina contigo.',
  },
  {
    num: '02',
    title: 'Visión',
    icon: 'helm',
    question: '¿Hacia qué vida estás construyendo?',
    apport: 'Dirección',
    deep: 'Define la imagen del hombre que quieres llegar a ser y de la vida que deseas sostener en el corto, mediano y largo plazo. No es una lista de metas. Es una representación de cómo vives, cómo decides, qué relaciones construyes y qué clase de realidad quieres hacer posible.',
  },
  {
    num: '03',
    title: 'Valores',
    icon: 'columns',
    question: '¿Qué principios no estás dispuesto a traicionar?',
    apport: 'Criterio',
    deep: 'Identifica los criterios que deben orientar tus decisiones cuando aparecen presión, incertidumbre o conveniencia. Un valor que no modifica una elección es solamente una palabra.',
  },
  {
    num: '04',
    title: 'Estándares',
    icon: 'laurel-wreath',
    question: '¿Qué comportamientos hacen visibles tus valores?',
    apport: 'Consistencia',
    deep: 'Convierte principios abstractos en mínimos concretos para tu cuerpo, relaciones, trabajo, finanzas y conducta cotidiana. Los estándares marcan la distancia entre lo que dices defender y lo que realmente sostienes.',
  },
  {
    num: '05',
    title: 'Identidad',
    icon: 'sword',
    question: '¿Quién debe existir para sostener esa visión?',
    apport: 'Coherencia',
    deep: 'Define los rasgos, responsabilidades y formas de actuar que deben convertirse en parte estable de quién eres. La identidad no describe solamente cómo te ves hoy. Establece desde qué lugar quieres aprender a decidir.',
  },
  {
    num: '06',
    title: 'Dificultades',
    icon: 'shadow',
    question: '¿Qué parte de ti puede deformar lo que intentas construir?',
    apport: 'Honestidad',
    deep: 'Trabaja la sombra en acción: patrones repetitivos, emociones rechazadas, proyecciones, excusas y autoengaño. No busca eliminar esa parte de ti. Busca reconocerla e integrarla para que deje de gobernarte en silencio.',
  },
  {
    num: '07',
    title: 'Factores de la personalidad',
    icon: 'brain',
    question: '¿Cómo operas cuando nadie te está midiendo?',
    apport: 'Temperamento',
    deep: 'Observa tendencias estables de tu personalidad: apertura, responsabilidad, energía social, cooperación y estabilidad emocional. No asigna una etiqueta definitiva. Muestra cómo tiendes a pensar, relacionarte y sostener el esfuerzo cuando construyes tu dirección.',
  },
  {
    num: '08',
    title: 'Ikigai',
    icon: 'ikigai',
    question: '¿Dónde convergen capacidad, sentido y contribución?',
    apport: 'Propósito',
    deep: 'Explora la relación entre aquello que puedes desarrollar, lo que consideras significativo, las necesidades que puedes resolver y la vida que deseas sostener. No entrega una profesión predeterminada. Ayuda a construir una dirección con sentido y viabilidad.',
    link: { href: '/ikigai', label: 'Profundiza en el Ikigai' },
  },
  {
    num: '09',
    title: 'Huella Personal',
    icon: 'fingerprint',
    question: '¿Qué debe permanecer después de ti?',
    apport: 'Legado',
    deep: 'Define la contribución que quieres construir mediante tu trabajo, tus relaciones, tu familia, tus decisiones y la forma en que utilizas tus capacidades. La huella no comienza al final de la vida. Se construye en la forma de vivirla.',
  },
];

export const HDRP_BLOCKS: ReadonlyArray<HdrpBlock> = [
  {
    title: 'Dirección',
    body: 'La vida y el hombre que estás intentando construir.',
  },
  {
    title: 'Principios',
    body: 'Los valores y criterios que deben orientar tus decisiones.',
  },
  {
    title: 'Estándares',
    body: 'Las conductas mínimas necesarias para sostener lo que declaras.',
  },
  {
    title: 'Patrones',
    body: 'Las sombras, tensiones y contradicciones que debes observar.',
  },
  {
    title: 'Prioridades',
    body: 'Las áreas que requieren atención primero.',
  },
  {
    title: 'Compromisos',
    body: 'Las decisiones que convierten la reflexión en responsabilidad.',
  },
];

export const ACTION_STEPS: ReadonlyArray<ActionStep> = [
  {
    num: '01',
    title: 'Define',
    body: 'Establece qué necesita atención y qué resultado se busca construir.',
  },
  {
    num: '02',
    title: 'Ejecuta',
    body: 'Convierte prioridades en acciones concretas dentro de la vida cotidiana.',
  },
  {
    num: '03',
    title: 'Registra',
    body: 'Conserva decisiones, avances, obstáculos y patrones repetidos.',
  },
  {
    num: '04',
    title: 'Revisa',
    body: 'Compara la ejecución con la arquitectura definida.',
  },
  {
    num: '05',
    title: 'Ajusta',
    body: 'Actualiza la Ruta cuando cambia el usuario, su contexto o sus prioridades.',
  },
];
