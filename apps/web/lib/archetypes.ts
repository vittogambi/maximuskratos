export type ArchetypeSlug = 'rey' | 'guerrero' | 'mago' | 'amante';

export type ArchetypeShadow = {
  label: string;
  description: string;
};

export type ArchetypeMeta = {
  slug: ArchetypeSlug;
  label: string;
  tagline: string;
  description: string;
  roman: string;
  symbol: string;
  image: string;
  shadow: ArchetypeShadow;
};

export const ARCHETYPES: Record<ArchetypeSlug, ArchetypeMeta> = {
  rey: {
    slug: 'rey',
    label: 'El Rey',
    tagline: 'Sostiene el orden; no lo domina.',
    description:
      'Tu presencia impone estructura y los demás confían en tu palabra. El poder, para MK, no es para dominar ni por vanidad, sino para sostener: un hombre fuerte es un escudo para los suyos. El riesgo: convertir esa soberanía en control, o cederla por evitar el conflicto.',
    roman: 'I · IDENTIDAD × RELACIONES',
    symbol: '♛',
    image: '/images/archetypes/rey.png',
    shadow: {
      label: 'El Tirano / El Débil',
      description:
        'Dominar en vez de sostener, o abdicar la autoridad por miedo al conflicto: las dos formas de traicionar el poder como deber.',
    },
  },
  guerrero: {
    slug: 'guerrero',
    label: 'El Guerrero',
    tagline: 'La excelencia es un hábito, no un instante.',
    description:
      'Actúas bajo presión y no negocias tus estándares. No es la perfección lo que persigues, sino la virtud en la acción: cada hábito sostenido es un ladrillo en la construcción de quien decides ser. El riesgo: confundir disciplina con dureza, o fuerza con castigo.',
    roman: 'II · MENTALIDAD × HÁBITOS',
    symbol: '⚔',
    image: '/images/archetypes/guerrero.png',
    shadow: {
      label: 'El Sádico / El Masoquista',
      description:
        'Usar la fuerza para herir en vez de proteger, o volver la disciplina un castigo contra sí mismo.',
    },
  },
  mago: {
    slug: 'mago',
    label: 'El Mago',
    tagline: 'Diseña los sistemas; no los sufre.',
    description:
      'Piensas en estructuras, no en eventos sueltos. Diseñas tu entorno y tus recursos para que trabajen a tu favor, dejando de ser un habitante pasivo del caos para ser arquitecto de tu propio destino. El riesgo: usar esa inteligencia para controlar en vez de construir.',
    roman: 'III · FINANZAS × ENTORNO',
    symbol: '✦',
    image: '/images/archetypes/mago.png',
    shadow: {
      label: 'El Manipulador / El Inocente',
      description:
        'Usar el conocimiento de los sistemas para manipular, o esconderse en la ingenuidad para no asumir el peso de ser arquitecto de algo.',
    },
  },
  amante: {
    slug: 'amante',
    label: 'El Amante',
    tagline: 'Vive desde el propósito trascendental.',
    description:
      'Tu entusiasmo mueve a quienes te rodean y conectas profundo con lo que te importa. Sin un propósito trascendental que alinee esa voluntad, la pasión se dispersa en cualquier dirección. El riesgo: perseguir la intensidad sin sostener ningún compromiso.',
    roman: 'IV · PROPÓSITO × IKIGAI',
    symbol: '♥',
    image: '/images/archetypes/amante.png',
    shadow: {
      label: 'El Adicto / El Impotente',
      description:
        'Perderse en el exceso y la búsqueda constante de sensación, o reprimir el deseo hasta quedar desconectado de todo.',
    },
  },
};

export const ARCHETYPE_SLUGS = Object.keys(ARCHETYPES) as ArchetypeSlug[];

export function getArchetype(slug: string): ArchetypeMeta | null {
  return ARCHETYPES[slug as ArchetypeSlug] ?? null;
}

export function getArchetypeLabel(slug: string): string {
  return getArchetype(slug)?.label ?? slug;
}
