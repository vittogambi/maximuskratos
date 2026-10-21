import type { Territory } from '../instrumentos/glossary';

export type TerritoryProposal = {
  territory: Territory | null;
  confidence: 'SINGLE' | 'MIXED' | 'NONE';
  reason: string;
};

export function inferPlanTerritory(actions: { territory: string | null }[]): TerritoryProposal {
  const counts = new Map<string, number>();
  for (const action of actions) {
    if (!action.territory) continue;
    counts.set(action.territory, (counts.get(action.territory) ?? 0) + 1);
  }
  if (counts.size === 0) {
    return { territory: null, confidence: 'NONE', reason: 'Sin señales de ámbito en las acciones.' };
  }
  if (counts.size === 1) {
    const territory = [...counts.keys()][0] as Territory;
    return { territory, confidence: 'SINGLE', reason: 'Todas las acciones activas apuntan al mismo ámbito.' };
  }
  return { territory: null, confidence: 'MIXED', reason: 'Hay acciones de más de un ámbito. Hay que elegir.' };
}
