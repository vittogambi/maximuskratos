export type ArchetypeSlug = 'guerrero' | 'constructor' | 'rey' | 'mentor' | 'visionario';

export type ArchetypeMeta = {
  slug: ArchetypeSlug;
  label: string;
  tagline: string;
  description: string;
  roman: string;
  symbol: string;
  image: string;
};

export const ARCHETYPES: Record<ArchetypeSlug, ArchetypeMeta> = {
  guerrero: {
    slug: 'guerrero',
    label: 'El Guerrero',
    tagline: 'Domina su mente y su cuerpo.',
    description:
      'Tu mayor activo es la disciplina operativa. Actúas bajo presión, mantienes estándares altos y no toleras la mediocridad. El riesgo: confundir dureza con rigidez.',
    roman: 'I · MENTALIDAD × HÁBITOS',
    symbol: '⚔',
    image: '/images/archetypes/guerrero.png',
  },
  constructor: {
    slug: 'constructor',
    label: 'El Constructor',
    tagline: 'Arquitecto de su entorno.',
    description:
      'Piensas en sistemas, no en eventos. Diseñas para el largo plazo y construyes lo que otros solo describen. El riesgo: ejecutar sin suficiente claridad de propósito.',
    roman: 'II · FINANZAS × ENTORNO',
    symbol: '⌂',
    image: '/images/archetypes/constructor.png',
  },
  rey: {
    slug: 'rey',
    label: 'El Rey',
    tagline: 'Lidera con autoridad y presencia.',
    description:
      'Tu identidad es sólida y tu presencia genera orden. Las personas confían en ti naturalmente. El riesgo: cargarte responsabilidades que no son tuyas.',
    roman: 'III · IDENTIDAD × RELACIONES',
    symbol: '♛',
    image: '/images/archetypes/rey.png',
  },
  mentor: {
    slug: 'mentor',
    label: 'El Mentor',
    tagline: 'Transforma lo que toca.',
    description:
      'Tu impacto más alto viene cuando sirves con profundidad. Escuchas, conectas y elevas a los que están alrededor. El riesgo: descuidar tu propio avance mientras cuidas el de otros.',
    roman: 'IV · PROPÓSITO × RELACIONES',
    symbol: '✦',
    image: '/images/archetypes/mentor.png',
  },
  visionario: {
    slug: 'visionario',
    label: 'El Visionario',
    tagline: 'Su propósito es su motor.',
    description:
      'Ves más allá del presente. Tu imaginación y claridad de dirección son excepcionales. El riesgo: vivir en el futuro y perder tracción en el presente.',
    roman: 'V · PROPÓSITO × IKIGAI',
    symbol: '◎',
    image: '/images/archetypes/visionario.png',
  },
};

export const ARCHETYPE_SLUGS = Object.keys(ARCHETYPES) as ArchetypeSlug[];

export function getArchetype(slug: string): ArchetypeMeta | null {
  return ARCHETYPES[slug as ArchetypeSlug] ?? null;
}

export function getArchetypeLabel(slug: string): string {
  return getArchetype(slug)?.label ?? slug;
}
