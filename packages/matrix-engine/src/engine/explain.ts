import type { DomainResult, ResultSnapshot } from '../types';
import { indexTrace } from './trace';

function pct(value: number | null): string {
  if (value == null) return 'n/d';
  return `${Math.round(value * 100)}%`;
}

function domainBlock(domain: DomainResult): string[] {
  const lines: string[] = [domain.key];
  if (domain.classification === 'NO_CLASIFICADO' && !domain.state_final) {
    lines.push(`NO CLASIFICADO`);
    lines.push(`cobertura ${pct(domain.coverage_definition)}`);
    return lines;
  }
  if (domain.score_display != null) {
    lines.push(`score ${domain.score_display}`);
  } else {
    lines.push('sin score');
  }
  lines.push(`cobertura ${pct(domain.coverage_definition)}`);
  if (domain.state_final) {
    lines.push(domain.state_final);
  }
  if (domain.state_source && domain.state_source !== 'BAND') {
    lines.push(`origen ${domain.state_source}`);
  }
  if (domain.classification === 'PROVISIONAL') {
    lines.push('PROVISIONAL');
  }
  return lines;
}

export function formatSummary(snapshot: ResultSnapshot, caseId?: string): string {
  const lines: string[] = [];
  if (caseId) lines.push(`CASE: ${caseId}`);
  lines.push(`definition ${snapshot.definition_ref}`);
  lines.push(`policy ${snapshot.policy_id}`);
  lines.push('');
  lines.push('SAFETY');
  const active = snapshot.safety.alerts.filter((alert) => alert.fired);
  if (active.length === 0) {
    lines.push('No hay alertas activas');
  } else {
    for (const alert of active) {
      lines.push(
        `${alert.question_id} ${alert.domain} ${alert.severity} ${alert.condition_confirmed ?? 'FULL'}`,
      );
    }
  }
  const suppressed = snapshot.safety.alerts.filter((alert) => !alert.fired);
  for (const alert of suppressed) {
    lines.push(
      `${alert.question_id} registrada ${alert.condition_confirmed ?? 'SUPPRESSED_BY_INPUT'}`,
    );
  }
  lines.push(`cobertura de riesgo ${pct(snapshot.safety.risk_coverage)}`);
  if (snapshot.safety.safety_incomplete) {
    lines.push(`riesgos no evaluados: ${snapshot.safety.not_evaluated.join(', ') || 'ninguno'}`);
  }
  lines.push('');

  for (const domain of snapshot.domains) {
    lines.push(...domainBlock(domain));
    lines.push('');
  }

  lines.push('PROPOSITO');
  lines.push('la matriz no habla a nivel de ambito');
  lines.push('dimensiones disponibles');
  lines.push('');

  lines.push('PRIORITY');
  if (snapshot.priority.domain) {
    lines.push(snapshot.priority.domain);
    lines.push(`fuente ${snapshot.priority.rule_id}`);
    lines.push(`nivel ${snapshot.priority.tier}`);
  } else {
    lines.push(`nula (${snapshot.priority.reason})`);
  }
  lines.push(snapshot.priority.purpose_note);
  lines.push('');

  lines.push('MAINTENANCE');
  lines.push(snapshot.maintenance.domain ?? 'nulo');
  lines.push('');

  lines.push('PLAN');
  const primary = snapshot.recommendations.primary;
  if (primary?.plan_id) {
    lines.push(primary.plan_id);
    lines.push(primary.label);
    if (primary.executable_recommendation === 'BLOCKED') {
      lines.push('Catalogo de la matriz, no recomendacion de ejecucion');
      if (primary.blocked_reason) lines.push(primary.blocked_reason);
    }
  } else {
    lines.push('sin plan');
  }

  return `${lines.join('\n')}\n`;
}

export function formatWhy(snapshot: ResultSnapshot, domainKey?: string): string {
  const focus =
    domainKey ??
    snapshot.priority.domain ??
    snapshot.domains.find((domain) => domain.classification !== 'NO_CLASIFICADO')?.key ??
    snapshot.domains[0]?.key;
  if (!focus) return 'Sin ambito para explicar.\n';

  const domain = snapshot.domains.find((item) => item.key === focus);
  const dims = snapshot.dimensions.filter((item) => item.domain === focus);
  const index = indexTrace(snapshot.trace);
  const scoreNode = index.get(`domain_score:${focus}`);
  const counterfactual =
    scoreNode &&
    typeof scoreNode.output === 'object' &&
    scoreNode.output != null &&
    'counterfactual_item_weighted' in scoreNode.output
      ? (scoreNode.output as { counterfactual_item_weighted: number | null })
          .counterfactual_item_weighted
      : null;

  const lines: string[] = [];
  lines.push(`POR QUE ${focus} = ${domain?.state_final ?? domain?.classification ?? 'sin estado'}`);
  lines.push('');
  lines.push('1. preguntas relevantes y valores normalizados');
  let shown = 0;
  for (const dim of dims) {
    const dimNode = index.get(`dimension:${dim.key}`);
    const questionIds = (dimNode?.inputs ?? [])
      .filter((ref) => ref.kind === 'question')
      .map((ref) => ref.id);
    for (const questionId of questionIds) {
      const item = index.get(`normalize:${questionId}`);
      const output = item?.output as
        | { rawValue: unknown; score: number | null; reason: string | null }
        | undefined;
      if (!output) continue;
      shown += 1;
      if (output.score == null) {
        lines.push(
          `  ${questionId}  ${String(output.rawValue)}  sin puntaje  ${output.reason ?? ''}`,
        );
      } else {
        lines.push(`  ${questionId}  ${String(output.rawValue)} se normaliza a ${output.score}`);
      }
    }
  }
  if (shown === 0) {
    lines.push('  ninguna pregunta puntuable respondida');
  }

  lines.push('');
  lines.push('2. scores por dimension');
  for (const dim of dims) {
    lines.push(
      `  ${dim.key}  ${dim.score ?? 'nulo'}  ${dim.items_scored} de ${dim.items_scoreable}`,
    );
  }

  lines.push('');
  lines.push('3. agregacion del ambito (LAB-SCORE-01, peso igual por dimension)');
  if (domain?.score == null) {
    lines.push('  sin score de ambito');
  } else {
    lines.push(`  media de dimensiones = ${domain.score}`);
    if (counterfactual != null) {
      lines.push(`  con peso por item habria sido ${counterfactual}`);
    }
  }

  lines.push('');
  lines.push('4. coverage');
  lines.push(
    `  definicion ${domain?.coverage_definition} (${pct(domain?.coverage_definition ?? 0)}) ${domain?.classification}`,
  );

  lines.push('');
  lines.push('5. banda');
  lines.push(
    domain?.state_from_band
      ? `  score_display ${domain.score_display}  ${domain.state_from_band}  distancia al borde ${domain.distance_to_band_edge}`
      : '  sin estado por banda',
  );

  lines.push('');
  lines.push('6. safety / override');
  lines.push(`  state_final ${domain?.state_final ?? 'nulo'}  ${domain?.state_source ?? 'sin override'}`);
  const domainAlerts = snapshot.safety.alerts.filter((alert) => alert.domain === focus);
  if (domainAlerts.length === 0) {
    lines.push('  sin alertas de este ambito');
  } else {
    for (const alert of domainAlerts) {
      lines.push(
        `  ${alert.question_id} ${alert.fired ? 'dispara' : 'registrada'} ${alert.condition_confirmed ?? ''} ${alert.override_applied ?? ''}`,
      );
    }
  }

  lines.push('');
  lines.push('7. priority');
  lines.push(
    snapshot.priority.domain
      ? `  ${snapshot.priority.domain} por ${snapshot.priority.tier}`
      : `  nula (${snapshot.priority.reason})`,
  );
  lines.push(
    `  criterios no evaluados: ${snapshot.priority.criteria_not_evaluated.map((item) => item.criterion).join(', ')}`,
  );
  lines.push(`  ${snapshot.priority.purpose_note}`);

  lines.push('');
  lines.push('8. plan');
  const primary = snapshot.recommendations.primary;
  lines.push(primary?.plan_id ? `  ${primary.plan_id}  ${primary.label}` : '  sin plan');
  if (primary?.executable_recommendation === 'BLOCKED') {
    lines.push('  Catalogo de la matriz, no recomendacion de ejecucion');
    if (primary.blocked_reason) lines.push(`  ${primary.blocked_reason}`);
  }

  return `${lines.join('\n')}\n`;
}

export function formatTrace(snapshot: ResultSnapshot): string {
  return `${JSON.stringify(snapshot.trace, null, 2)}\n`;
}
