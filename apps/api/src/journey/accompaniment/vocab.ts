import type { Pillar, Territory } from '../../instrumentos/glossary';

/** Situated accompaniment. Not an identity and not a cut of the alignment index. */
export const ENGINE_VERSION = 'acompanamiento@0.1';
export const RULES_VERSION = 'reglas-acompanamiento@0.1';
export const CATALOG_VERSION = 'catalogo-acompanamiento@0.1';

/** Visible estimate. A shorter review can replace it. It is not a reserved block of ten minutes. */
export const REVIEW_ESTIMATE_MINUTES = 5;

/** Versioned invitation only. It does not prove absence or change the plan. */
export const CONTEXT_REVIEW_DAYS = 14;

export const MODES = ['CONTENCION', 'ESTABILIZACION', 'CONSOLIDACION', 'EXPANSION'] as const;
export type Mode = (typeof MODES)[number];
export type ModeStatus = 'PROPOSED' | 'PROVISIONAL' | 'UNDETERMINED';

export const SITUATIONS = ['NONE', 'PAUSE', 'RETURN', 'RECONFIRM'] as const;
export type Situation = (typeof SITUATIONS)[number];

export const GOAL_KINDS = [
  'ENTREGAR',
  'ENSENAR_O_CONTRIBUIR',
  'CONSTRUIR_O_PROBAR',
  'CUIDAR',
  'ORDENAR',
  'VINCULAR',
  'SOSTENER',
  'EXPLORAR_IKIGAI',
  'PROPIA',
] as const;
export type GoalKind = (typeof GOAL_KINDS)[number];

export const BARRIERS = [
  'PLANIFICACION_POR_ACLARAR',
  'SIN_OCASION',
  'NO_SE_POR_DONDE_EMPEZAR',
  'FALTA_INFORMACION',
  'PULIR_ANTES_DE_MOSTRAR',
  'ESPERAR_EL_MOMENTO',
  'TEMOR_A_LA_RESPUESTA',
  'ENERGIA_O_SALUD',
  'OTRA',
  'NINGUNA_IDENTIFICADA',
] as const;
export type BarrierKind = (typeof BARRIERS)[number];
export type BarrierChoice = 'RECOGNIZE' | 'REJECT' | 'OTHER' | 'UNKNOWN';

export type GoalDeclaration = {
  kind: GoalKind | null;
  situation: Situation | null;
  territory: Territory | null;
};

/**
 * Maps a declared label to a goal or a route situation.
 * Return and pause are situations. They do not become a required goal class.
 */
export function declarationToGoal(raw: string | null | undefined): GoalDeclaration {
  const key = (raw ?? '').trim().toUpperCase();
  const table: Record<string, GoalDeclaration> = {
    TRABAJO: { kind: 'ENTREGAR', situation: null, territory: 'MENTALIDAD' },
    TRABAJO_Y_PROYECTOS: { kind: 'ENTREGAR', situation: null, territory: 'MENTALIDAD' },
    TERMINAR_PROPUESTA: { kind: 'ENTREGAR', situation: null, territory: 'MENTALIDAD' },
    COMPARTIR_UN_BORRADOR: { kind: 'ENTREGAR', situation: null, territory: 'MENTALIDAD' },
    ENSEÑAR_UN_OFICIO: { kind: 'ENSENAR_O_CONTRIBUIR', situation: null, territory: 'MENTALIDAD' },
    ENSENAR: { kind: 'ENSENAR_O_CONTRIBUIR', situation: null, territory: 'MENTALIDAD' },
    IKIGAI: { kind: 'EXPLORAR_IKIGAI', situation: null, territory: 'MENTALIDAD' },
    CUIDADO: { kind: 'CUIDAR', situation: null, territory: 'SALUD_FISICA' },
    FINANZAS: { kind: 'ORDENAR', situation: null, territory: 'FINANZAS' },
    ORDEN_FINANCIERO: { kind: 'ORDENAR', situation: null, territory: 'FINANZAS' },
    RELACIONES: { kind: 'VINCULAR', situation: null, territory: 'RELACIONES' },
    LIMITES_RELACIONALES: { kind: 'VINCULAR', situation: null, territory: 'RELACIONES' },
    CUIDAR_UN_VINCULO: { kind: 'VINCULAR', situation: null, territory: 'RELACIONES' },
    CONDUCTA: { kind: 'SOSTENER', situation: null, territory: 'MENTALIDAD' },
    PAUSA: { kind: null, situation: 'PAUSE', territory: null },
    RETOMAR: { kind: null, situation: 'RETURN', territory: null },
    REPARAR: { kind: null, situation: 'RECONFIRM', territory: null },
    REPARAR_LECTURA: { kind: null, situation: 'RECONFIRM', territory: null },
  };
  return table[key] ?? { kind: null, situation: null, territory: null };
}

export function isGoalKind(value: string | null | undefined): value is GoalKind {
  return GOAL_KINDS.includes(value as GoalKind);
}

export function pillarFor(territory: Territory | null, mode: Mode | null): Pillar | null {
  if (mode === 'CONTENCION' && territory === 'SALUD_FISICA') return 'CUERPO';
  if (territory === 'FINANZAS') return 'MENTE';
  if (territory === 'RELACIONES') return 'ESPIRITU';
  if (mode === 'EXPANSION') return 'ESPIRITU';
  if (territory === 'SALUD_FISICA') return 'CUERPO';
  if (territory === 'MENTALIDAD') return 'MENTE';
  return null;
}
