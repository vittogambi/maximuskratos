import { formatState } from './format';
import { labUiLabels } from './labels';

export type ReplayRow = {
  run_id: string;
  case_label: string;
  impact?: string;
  critical_regression?: boolean;
  domains: Array<{
    key: string;
    from_score: number | null;
    to_score: number | null;
    from_state: string | null;
    to_state: string | null;
  }>;
  priority: { from: string | null; to: string | null };
  plan: { from: string | null; to: string | null; from_name?: string | null; to_name?: string | null };
  safety: { from: number; to: number };
};

export type ReplayLayerChange = { layer: string; text: string };

export function replayLayerChanges(row: ReplayRow): ReplayLayerChange[] {
  const layers: ReplayLayerChange[] = [];
  for (const domain of row.domains) {
    const name = labUiLabels.domain(domain.key);
    if (domain.from_score !== domain.to_score) {
      layers.push({
        layer: 'ámbito',
        text: `${name} ${domain.from_score ?? 'sin puntaje'} → ${domain.to_score ?? 'sin puntaje'}`,
      });
    }
    if (domain.from_state !== domain.to_state) {
      layers.push({
        layer: 'estado',
        text: `${name}: ${formatState(domain.from_state)} → ${formatState(domain.to_state)}`,
      });
    }
  }
  if (row.priority.from !== row.priority.to) {
    layers.push({
      layer: 'ámbito prioritario',
      text: `${labUiLabels.domain(row.priority.from)} → ${labUiLabels.domain(row.priority.to)}`,
    });
  }
  if (row.plan.from !== row.plan.to) {
    layers.push({
      layer: 'ruta',
      text: `${row.plan.from_name ?? row.plan.from ?? 'Sin ruta'} → ${row.plan.to_name ?? row.plan.to ?? 'Sin ruta'}`,
    });
  }
  if (row.safety.from !== row.safety.to) {
    layers.push({
      layer: 'seguridad',
      text: `Alertas ${row.safety.from} → ${row.safety.to}`,
    });
  }
  return layers;
}

export function groupReplayRows(rows: ReplayRow[]) {
  const worsened = rows.filter((row) => row.impact === 'WORSENS' || row.critical_regression);
  const worsenedIds = new Set(worsened.map((row) => row.run_id));
  return {
    changed: rows.filter(
      (row) => row.impact && row.impact !== 'UNCHANGED' && !worsenedIds.has(row.run_id),
    ),
    improved: rows.filter((row) => row.impact === 'IMPROVES'),
    worsened,
    unchanged: rows.filter((row) => !row.impact || row.impact === 'UNCHANGED'),
    needsReview: rows.filter((row) => row.impact === 'NEEDS_REVIEW'),
  };
}

export function singleCaseBacking(rows: ReplayRow[]): boolean {
  return rows.filter((row) => row.impact && row.impact !== 'UNCHANGED').length <= 1;
}
