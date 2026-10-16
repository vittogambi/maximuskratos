/** Product vocabulary. Pillars, published territories and purpose sections are different entities. */

export const PILLARS = ['ESPIRITU', 'MENTE', 'CUERPO'] as const;
export type Pillar = (typeof PILLARS)[number];

export const PILLAR_LABEL: Record<Pillar, string> = {
  ESPIRITU: 'Espíritu',
  MENTE: 'Mente',
  CUERPO: 'Cuerpo',
};

/** Published life territories. Not the four sense sources of the standards question. */
export const TERRITORIES = ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'SALUD_FISICA'] as const;
export type Territory = (typeof TERRITORIES)[number];

export const TERRITORY_LABEL: Record<Territory, string> = {
  MENTALIDAD: 'Mentalidad',
  RELACIONES: 'Relaciones',
  FINANZAS: 'Finanzas',
  SALUD_FISICA: 'Salud física',
};

/** Nine sections of the purpose sheet. Not the nine indicator groups of the alignment core. */
export const PURPOSE_COMPONENTS = [
  'origen',
  'vision',
  'valores',
  'estandares',
  'identidad',
  'dificultades',
  'personalidad',
  'ikigai',
  'huella',
] as const;
export type PurposeComponent = (typeof PURPOSE_COMPONENTS)[number];

export const PURPOSE_COMPONENT_LABEL: Record<PurposeComponent, string> = {
  origen: 'Origen y linaje',
  vision: 'Visión',
  valores: 'Valores',
  estandares: 'Estándares',
  identidad: 'Identidad',
  dificultades: 'Dificultades y recursos',
  personalidad: 'Personalidad',
  ikigai: 'IKIGAI',
  huella: 'Huella',
};

/** Indicator groups of ia-mk-cuest@0.1. Distinct from purpose components. */
export const INDICATOR_GROUPS = [
  'NUC-E1',
  'NUC-E2',
  'NUC-E3',
  'NUC-M1',
  'NUC-M2',
  'NUC-M3',
  'NUC-C1',
  'NUC-C2',
  'NUC-C3',
] as const;
export type IndicatorGroup = (typeof INDICATOR_GROUPS)[number];

export const GROUP_PILLAR: Record<IndicatorGroup, Pillar> = {
  'NUC-E1': 'ESPIRITU',
  'NUC-E2': 'ESPIRITU',
  'NUC-E3': 'ESPIRITU',
  'NUC-M1': 'MENTE',
  'NUC-M2': 'MENTE',
  'NUC-M3': 'MENTE',
  'NUC-C1': 'CUERPO',
  'NUC-C2': 'CUERPO',
  'NUC-C3': 'CUERPO',
};

export const GROUP_LABEL: Record<IndicatorGroup, string> = {
  'NUC-E1': 'Sentido y contribución',
  'NUC-E2': 'Identidad y dirección vividas',
  'NUC-E3': 'Coherencia con valores',
  'NUC-M1': 'Autorregulación',
  'NUC-M2': 'Planificación y entorno',
  'NUC-M3': 'Corrección y aprendizaje',
  'NUC-C1': 'Conducta coherente',
  'NUC-C2': 'Cuidado cotidiano',
  'NUC-C3': 'Recuperación',
};
