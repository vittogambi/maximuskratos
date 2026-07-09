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
  quote?: string;
  body: string;
  /** Explicación extendida para la página de profundización (/marco-central). */
  deep: string;
};

export const MARCO_CARDS: ReadonlyArray<MarcoCard> = [
  {
    num: '01',
    title: 'Visión',
    icon: 'helm',
    quote: 'Lo que me gustaría llegar a ser.',
    body: 'Define el hombre que quieres encarnar. Tu timón orienta cada decisión hacia ese futuro.',
    deep: 'Es la imagen del hombre que quieres llegar a ser si todo fuera posible: tu "yo ideal". No es una lista de metas: es cómo te ves, cómo te comportas y qué relaciones sostienes, a corto (5 años), mediano (10) y largo plazo (20 años o más). Tu visión es el timón: orienta cada decisión hacia ese futuro, incluso cuando el presente es incierto.',
  },
  {
    num: '02',
    title: 'Identidad',
    icon: 'sword',
    quote: 'Diga el débil: Fuerte soy.',
    body: 'No cambias resultados hasta cambiar cómo te ves. La tensión entre quién eres y quién declaras ser.',
    deep: 'Las personas no cambian sus resultados hasta que cambian la forma en que se ven a sí mismas. Este pilar no busca metas externas ni planes de acción inmediatos: tensiona la identidad actual contra la que declaras querer encarnar, y expone las brechas entre lo que dices, lo que haces y los estándares con los que realmente vives. Ahí, en lo que haces cuando nadie te observa, se construye o se erosiona quién eres.',
  },
  {
    num: '03',
    title: 'Valores',
    icon: 'columns',
    quote: 'Principios que me guían.',
    body: 'Pilares que guían tus decisiones. Coherencia con la visión, no solo con las metas.',
    deep: 'Los valores son los pilares que sostienen cada decisión, las columnas del futuro templo que estás construyendo. No son aspiraciones abstractas: son los principios que, identificados con honestidad, dan coherencia entre lo que dices creer y cómo vives. Sin coherencia con tu visión, un valor es solo una palabra bonita.',
  },
  {
    num: '04',
    title: 'Estándares',
    icon: 'laurel-wreath',
    quote: 'La identidad se construye sobre la base de los estándares, no de la motivación.',
    body: 'Reglas personales, no deseos. Los valores hechos acción y hábito diario.',
    deep: 'Un estándar no es un deseo: es una regla personal que no negocias. Los estándares traducen tus valores en acciones concretas y hábitos diarios: qué haces, qué toleras y qué eliminas de tu rutina para sostener la versión de ti que declaraste en tu Visión. La identidad se construye sobre la base de los estándares, no de la motivación.',
  },
  {
    num: '05',
    title: 'La Sombra',
    icon: 'shadow',
    quote: 'Lo que niegas, te somete. Lo que aceptas, te transforma.',
    body: 'Lo oculto esconde fortalezas. Integrarlo devuelve energía y baja el sabotaje interno.',
    deep: 'Inspirada en la Sombra de Carl Jung: la suma de las cualidades que niegas u ocultas de ti mismo. Ahí no solo vive lo que rechazas: también viven fortalezas y potenciales que, sin explorar, empobrecen tu personalidad y drenan tu energía en autosabotaje, proyección o evitación. Encontrar la verdad en tu sombra es lo que libera la energía vital que necesitas para tus objetivos.',
  },
  {
    num: '06',
    title: 'Ikigai',
    icon: 'ikigai',
    quote: 'Mi razón de ser.',
    body: 'Pasión, vocación, misión y profesión alineados. De ahí sale el sentido de tu vida.',
    deep: 'Concepto japonés que significa "mi razón de ser". Nace de la intersección entre cuatro elementos: lo que amas (pasión), lo que se te da bien (vocación), lo que el mundo necesita (misión) y aquello por lo que te pueden pagar (profesión). No es un ideal profesional: es una filosofía para vivir con sentido. Cuando los cuatro se alinean, ahí se revela tu propósito trascendental.',
  },
  {
    num: '07',
    title: 'Origen y Linaje',
    icon: 'anchor',
    quote: 'Mis antepasados habitan en mí.',
    body: 'Nombre, apellido y linaje como raíz. Eslabón consciente de una cadena que honras y transformas.',
    deep: 'Tus antepasados habitan en ti. Este pilar instala una conciencia identitaria profunda a través de tu nombre, apellido y linaje, para que dejes de vivir tu vida como un hecho aislado y la asumas como la continuación de una historia. Te posiciona como el eslabón consciente de una cadena humana milenaria, de un yo aislado a un yo anclado, integrado a algo mayor que tú mismo.',
  },
  {
    num: '08',
    title: 'Huella Personal',
    icon: 'fingerprint',
    quote: 'El sello que dejaré en el mundo.',
    body: 'El legado que construyes: el mensaje que dejas en quienes te rodean y la marca que imprimes en el mundo.',
    deep: 'El sello que dejarás en el mundo. Es el legado que quieres construir, el mensaje que dejarás en quienes te rodean y la marca que tu paso imprime en tu familia, tu comunidad y tu profesión. No se trata de ser recordado: se trata de vivir de un modo que merezca serlo.',
  },
];
