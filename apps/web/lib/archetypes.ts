import type { AppIconName } from '@/components/icons/registry';

export type ArchetypeSlug = 'rey' | 'guerrero' | 'mago' | 'amante';

export type ArchetypeShadow = {
  label: string;
  description: string;
};

export type ArchetypeMeta = {
  slug: ArchetypeSlug;
  label: string;
  /** Función principal del arquetipo. */
  tagline: string;
  description: string;
  /** Expresión en equilibrio. */
  balanced: string;
  roman: string;
  icon: AppIconName;
  image: string;
  /** Resumen combinado de sombra (otras vistas). */
  shadow: ArchetypeShadow;
  /** Dos polos de sombra. */
  shadowPoles: readonly [ArchetypeShadow, ArchetypeShadow];
  /** Relación con la plataforma. */
  platform: string;
};

export const ARCHETYPES: Record<ArchetypeSlug, ArchetypeMeta> = {
  rey: {
    slug: 'rey',
    label: 'El Rey',
    tagline: 'Da orden, dirección y responsabilidad.',
    description:
      'El Rey sano no controla todo lo que lo rodea. Construye condiciones para que algo pueda prosperar y asume el peso de las decisiones que le corresponden.',
    balanced: 'Ordena, protege y dirige.',
    roman: 'I · IDENTIDAD × RELACIONES',
    icon: 'crown',
    image: '/images/archetypes/rey.png',
    shadow: {
      label: 'Tirano / Débil',
      description:
        'El Tirano utiliza la autoridad para someter. El Débil abandona su responsabilidad para evitar conflicto, juicio o fracaso.',
    },
    shadowPoles: [
      {
        label: 'Tirano',
        description: 'Utiliza la autoridad para someter.',
      },
      {
        label: 'Débil',
        description: 'Abandona su responsabilidad para evitar conflicto, juicio o fracaso.',
      },
    ],
    platform: 'En Perfil Maestro: soberanía, orden y peso de las decisiones.',
  },
  guerrero: {
    slug: 'guerrero',
    label: 'El Guerrero',
    tagline: 'Convierte una decisión en acción sostenida.',
    description:
      'El Guerrero entrega disciplina, límites, coraje y capacidad de actuar incluso cuando no existe comodidad.',
    balanced: 'Protege, ejecuta y persevera.',
    roman: 'II · MENTALIDAD × HÁBITOS',
    icon: 'sword',
    image: '/images/archetypes/guerrero.png',
    shadow: {
      label: 'Sádico / Masoquista',
      description:
        'El Sádico utiliza la fuerza para destruir. El Masoquista convierte la disciplina en castigo y termina luchando contra sí mismo.',
    },
    shadowPoles: [
      {
        label: 'Sádico',
        description: 'Utiliza la fuerza para destruir.',
      },
      {
        label: 'Masoquista',
        description: 'Convierte la disciplina en castigo y termina luchando contra sí mismo.',
      },
    ],
    platform: 'En Perfil Maestro: disciplina, límites y ejecución bajo presión.',
  },
  mago: {
    slug: 'mago',
    label: 'El Mago',
    tagline: 'Comprende, relaciona y diseña sistemas.',
    description:
      'El Mago observa patrones, interpreta la realidad y convierte conocimiento en estructuras útiles.',
    balanced: 'Comprende, transforma y construye.',
    roman: 'III · FINANZAS × ENTORNO',
    icon: 'sparkles',
    image: '/images/archetypes/mago.png',
    shadow: {
      label: 'Manipulador / Inocente',
      description:
        'El Manipulador utiliza el conocimiento para controlar. El Inocente evita comprender para no asumir responsabilidad.',
    },
    shadowPoles: [
      {
        label: 'Manipulador',
        description: 'Utiliza el conocimiento para controlar.',
      },
      {
        label: 'Inocente',
        description: 'Evita comprender para no asumir responsabilidad.',
      },
    ],
    platform: 'En Perfil Maestro: patrones, estructuras y diseño del entorno.',
  },
  amante: {
    slug: 'amante',
    label: 'El Amante',
    tagline: 'Conecta la vida con significado, presencia y deseo.',
    description:
      'El Amante permite vincularse profundamente con personas, experiencias, belleza, propósito y creación.',
    balanced: 'Conecta, aprecia y da sentido.',
    roman: 'IV · PROPÓSITO × IKIGAI',
    icon: 'heart-pulse',
    image: '/images/archetypes/amante.png',
    shadow: {
      label: 'Adicto / Impotente',
      description:
        'El Adicto queda sometido a la búsqueda de estímulo. El Impotente se desconecta del deseo para evitar exposición, pérdida o dolor.',
    },
    shadowPoles: [
      {
        label: 'Adicto',
        description: 'Queda sometido a la búsqueda de estímulo.',
      },
      {
        label: 'Impotente',
        description: 'Se desconecta del deseo para evitar exposición, pérdida o dolor.',
      },
    ],
    platform: 'En Perfil Maestro: vínculo, sentido y presencia en lo que construyes.',
  },
};

export const ARCHETYPE_SLUGS = Object.keys(ARCHETYPES) as ArchetypeSlug[];

export function getArchetype(slug: string): ArchetypeMeta | null {
  return ARCHETYPES[slug as ArchetypeSlug] ?? null;
}

export function getArchetypeLabel(slug: string): string {
  return getArchetype(slug)?.label ?? slug;
}
