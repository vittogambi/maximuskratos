import type { Territory } from '../../instrumentos/glossary';
import type { GoalKind } from './vocab';

export type GoalClassChoice =
  | 'FINISH'
  | 'SUSTAIN'
  | 'TRY'
  | 'DEPENDS_ON_OTHER'
  | 'SUGGEST';

const TABLE: Record<Territory, Record<Exclude<GoalClassChoice, 'SUGGEST'>, GoalKind>> = {
  MENTALIDAD: { FINISH: 'ENTREGAR', SUSTAIN: 'SOSTENER', TRY: 'CONSTRUIR_O_PROBAR', DEPENDS_ON_OTHER: 'VINCULAR' },
  FINANZAS: { FINISH: 'ORDENAR', SUSTAIN: 'ORDENAR', TRY: 'CONSTRUIR_O_PROBAR', DEPENDS_ON_OTHER: 'VINCULAR' },
  RELACIONES: { FINISH: 'VINCULAR', SUSTAIN: 'VINCULAR', TRY: 'CONSTRUIR_O_PROBAR', DEPENDS_ON_OTHER: 'VINCULAR' },
  SALUD_FISICA: { FINISH: 'CUIDAR', SUSTAIN: 'CUIDAR', TRY: 'CONSTRUIR_O_PROBAR', DEPENDS_ON_OTHER: 'VINCULAR' },
};

const SUGGEST_DEFAULT: Record<Territory, GoalKind> = {
  MENTALIDAD: 'ENTREGAR',
  FINANZAS: 'ORDENAR',
  RELACIONES: 'VINCULAR',
  SALUD_FISICA: 'CUIDAR',
};

export function goalKindFromClass(territory: Territory, choice: GoalClassChoice): GoalKind {
  if (choice === 'SUGGEST') return SUGGEST_DEFAULT[territory];
  return TABLE[territory][choice];
}
