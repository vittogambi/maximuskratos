import { STATE_BANDS, type ResultSnapshot } from '@mk/matrix-engine';

const PLANNED = ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'] as const;

export function nextThreshold(scoreDisplay: number | null) {
  if (scoreDisplay == null) return null;
  const next = STATE_BANDS.find((band) => scoreDisplay < band.min);
  if (!next) return null;
  return {
    score: next.min,
    state: next.state,
    distance: next.min - scoreDisplay,
  };
}

export function domainComposition(
  snapshot: ResultSnapshot,
  domainKey: string,
  dimensionLabels: Record<string, string>,
) {
  const dimensions = snapshot.dimensions.filter((dimension) => dimension.domain === domainKey);
  const used = dimensions.filter((dimension) => dimension.score != null);
  const weight = used.length === 0 ? 0 : 1 / used.length;
  return used.map((dimension) => ({
    key: dimension.key,
    label: dimensionLabels[dimension.key] ?? dimension.key,
    score: dimension.score_display ?? dimension.score,
    items_scoreable: dimension.items_scoreable,
    items_scored: dimension.items_scored,
    weight,
    contribution: dimension.score == null ? null : dimension.score * weight,
  }));
}

export function decisiveRules(snapshot: ResultSnapshot, tie: boolean): Array<{ label: string; id: string }> {
  const rules: Array<{ label: string; id: string }> = [
    { label: 'Igual ponderación entre dimensiones', id: 'R-SCORE-03' },
  ];
  const planned = snapshot.domains.filter((domain) => (PLANNED as readonly string[]).includes(domain.key));
  const bandUsed = planned.find((domain) => domain.state_rule_id && domain.classification !== 'NO_CLASIFICADO');
  if (bandUsed?.state_from_band && bandUsed.state_rule_id) {
    rules.push({
      label: `Banda ${bandLabel(bandUsed.state_from_band)} = ${humanState(bandUsed.state_from_band)}`,
      id: bandUsed.state_rule_id,
    });
  }
  if (tie) {
    rules.push({
      label: 'Desempate fijo entre ámbitos prioritarios',
      id: snapshot.priority.rule_id || 'LAB-PRIORITY-01',
    });
  } else if (snapshot.priority.domain && snapshot.priority.rule_id) {
    rules.push({
      label: snapshot.priority.tier === 'CRITICA' || snapshot.priority.tier === 'ALTA'
        ? 'Ámbito prioritario por alerta'
        : 'Ámbito prioritario por estado y puntaje',
      id: snapshot.priority.rule_id,
    });
  }
  const primary = snapshot.recommendations.primary;
  if (primary?.plan_id && snapshot.priority.domain && planned.find((d) => d.key === snapshot.priority.domain)?.state_final) {
    const state = planned.find((d) => d.key === snapshot.priority.domain)?.state_final;
    rules.push({
      label: `${humanDomain(snapshot.priority.domain)} + ${humanState(state)} → ${primary.plan_id}`,
      id: primary.plan_id,
    });
  }
  for (const alert of snapshot.safety.alerts.filter((item) => item.fired && item.override_applied)) {
    rules.push({
      label: 'La alerta modifica el estado del ámbito',
      id: alert.question_id,
    });
  }
  return rules;
}

const DOMAIN_LABEL: Record<string, string> = {
  MENTALIDAD: 'Mentalidad',
  RELACIONES: 'Relaciones',
  FINANZAS: 'Finanzas',
  CUERPO: 'Cuerpo',
};

const STATE_LABEL: Record<string, string> = {
  'CONTENCIÓN': 'Contención',
  'ESTABILIZACIÓN': 'Estabilización',
  'CONSOLIDACIÓN': 'Consolidación',
  'EXPANSIÓN': 'Expansión',
};

function humanDomain(value: string | null | undefined): string {
  if (!value) return 'sin ámbito';
  return DOMAIN_LABEL[value] ?? value;
}

function humanState(value: string | null | undefined): string {
  if (!value) return 'sin estado';
  return STATE_LABEL[value] ?? value;
}

function bandLabel(state: string): string {
  const band = STATE_BANDS.find((item) => item.state === state);
  if (!band) return state;
  return `${band.min} a ${band.max}`;
}

export function tieBreakDecided(snapshot: ResultSnapshot): boolean {
  const candidates = snapshot.priority.candidates;
  if (candidates.length < 2) return false;
  const [first, second] = candidates;
  return (
    first.tier === second.tier &&
    first.state === second.state &&
    first.score_display === second.score_display
  );
}
