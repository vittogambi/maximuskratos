'use client';

import { useState, type ReactNode } from 'react';
import { DomainChip } from './domain-chip';
import { Alert, LabCard, Tech } from './primitives';
import { PairCompare } from './pair-compare';
import { WhyTree } from './why-tree';
import type { LabComparison, LabExpectation, LabPairCompare, LabParentCompare, LabQuestion, LabResult } from '@/lib/lab-api';
import { formatScore, formatState } from '@/lib/lab-ui/format';
import { labUiLabels } from '@/lib/lab-ui/labels';
import { anticipatedMatrix, compareOptionalPrediction } from '@/lib/lab-ui/compare';
import { criterionVsMatrix, stanceFromRecord } from '@/lib/lab-ui/criterion-compare';
import { resolveCaseCounts } from '@/lib/lab-ui/question-counts';

const PLANNED = ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'];

/** True when the top candidates only differ by the fixed tie break order. */
export function tieBreakDecided(result: LabResult): boolean {
  const candidates = result.snapshot.priority.candidates;
  if (candidates.length < 2) return false;
  const [first, second] = candidates;
  return (
    first.tier === second.tier &&
    first.state === second.state &&
    first.score_display === second.score_display
  );
}

/** True when this run belongs to an A/B pair, not merely a failed pairCompare fetch. */
export function isAbPair(pair?: LabPairCompare | null): boolean {
  return Boolean(pair);
}

export function tiedPriorityExplanation(result: LabResult): string | null {
  if (!tieBreakDecided(result)) return null;
  const candidates = result.snapshot.priority.candidates;
  const [first] = candidates;
  if (!first) return null;
  const tied = candidates.filter(
    (item) =>
      item.tier === first.tier &&
      item.state === first.state &&
      item.score_display === first.score_display,
  );
  if (tied.length < 2) return null;
  const names = tied.map((item) => labUiLabels.domain(item.domain));
  const score = first.score_display ?? '—';
  const chosen = result.snapshot.priority.domain
    ? labUiLabels.domain(result.snapshot.priority.domain)
    : 'ninguno';
  if (names.length === 4) {
    return `Los cuatro ámbitos quedaron empatados en ${score} / 100. La regla de desempate vigente seleccionó ${chosen} como ámbito prioritario.`;
  }
  const list =
    names.length === 2 ? `${names[0]} y ${names[1]}` : names.join(', ');
  const quantifier = names.length === 2 ? 'ambos' : 'todos';
  return `${list} quedaron empatados, ${quantifier} con ${score} / 100. La regla de desempate vigente seleccionó ${chosen} como ámbito prioritario.`;
}

export function StepResult({
  result,
  comparison,
  pair,
  parentCompare,
  questions,
  expectation,
  why,
  trace,
  onTryAlternative,
  initialWhyDomain = null,
  footer,
}: {
  result: LabResult;
  comparison: LabComparison | null;
  pair?: LabPairCompare | null;
  parentCompare?: LabParentCompare | null;
  questions?: LabQuestion[];
  expectation?: LabExpectation | null;
  why: string;
  trace: string;
  onContinue?: () => void;
  onTryAlternative?: (domain: string) => void;
  initialWhyDomain?: string | null;
  footer?: ReactNode;
}) {
  const [whyOpen, setWhyOpen] = useState(Boolean(initialWhyDomain));
  const [whyDomain, setWhyDomain] = useState<string | null>(initialWhyDomain);
  const snapshot = result.snapshot;
  const planned = snapshot.domains.filter((domain) => PLANNED.includes(domain.key));
  const firedAlerts = snapshot.safety.alerts.filter((alert) => alert.fired);
  const critical = firedAlerts.filter((alert) => alert.severity === 'CRITICA');
  const high = firedAlerts.filter((alert) => alert.severity === 'ALTA');
  const primary = snapshot.recommendations.primary;
  const plan = result.catalog.plans.find((item) => item.id === primary?.plan_id) ?? null;
  const tie = tieBreakDecided(result);
  const allUnclassified = planned.every((domain) => domain.classification === 'NO_CLASIFICADO');
  const blocked = primary?.executable_recommendation === 'BLOCKED';

  const focusDomain = snapshot.priority.domain ?? planned.find((domain) => domain.score != null)?.key ?? null;
  const shownDomain = whyDomain ?? focusDomain ?? planned[0]?.key ?? 'CUERPO';

  return (
    <div className="lab-stack">
      <div className="lab-stack">
          {critical.length ? (
            <Alert tone="danger" title="Atención prioritaria">
              Se detectó una alerta crítica en {labUiLabels.domain(critical[0].domain)}. Por esta razón el
              estado de ese ámbito quedó forzado por la alerta y no se puede entregar una
              recomendación ejecutable.
            </Alert>
          ) : null}
          {!critical.length && high.length ? (
            <Alert tone="warn" title="Alerta alta registrada">
              {labUiLabels.domain(high[0].domain)} requiere atención por una alerta alta.{' '}
              {planned.find((domain) => domain.key === high[0].domain)?.classification === 'NO_CLASIFICADO'
                ? 'Aun así no hay cobertura suficiente en ese ámbito para asignar estado ni ruta.'
                : 'La regla actual limita el estado de ese ámbito.'}
            </Alert>
          ) : null}
          {snapshot.safety.safety_incomplete ? (
            <Alert tone="warn" title="Alertas sin evaluar por completo">
              Quedaron preguntas de seguridad sin responder, así que no se puede cerrar esa revisión.
            </Alert>
          ) : null}

          <CriterionVsMatrixCard
            expectation={expectation ?? comparison?.expectation ?? null}
            result={result}
          />

          <h1 className="lab-h2">Resultado de la Matriz</h1>

          <LabCard title="Ámbito prioritario">
            {allUnclassified || !snapshot.priority.domain ? (
              <>
                <p className="lab-domain__score">Ningún ámbito</p>
                <p className="lab-muted">No hay cobertura suficiente para proponer un ámbito primero.</p>
              </>
            ) : (
              <>
                <p className="lab-domain__score">{labUiLabels.domain(snapshot.priority.domain)}</p>
                {tie && tiedPriorityExplanation(result) ? (
                  <p className="lab-muted">{tiedPriorityExplanation(result)}</p>
                ) : (
                  <p className="lab-muted">
                    Quedó primero por {describeTier(snapshot.priority.tier)}.
                  </p>
                )}
              </>
            )}
          </LabCard>

          <h2 className="lab-h3">Estado actual de los cuatro ámbitos</h2>
          <div className="lab-grid-4">
            {planned.map((domain) => {
              const unclassified = domain.classification === 'NO_CLASIFICADO';
              const fraction = unclassified
                ? domainEvaluableFraction(domain.key, questions, result)
                : null;
              return (
                <button
                  key={domain.key}
                  type="button"
                  className={
                    domain.key === snapshot.priority.domain
                      ? 'lab-domain lab-domain--why is-first'
                      : 'lab-domain lab-domain--why'
                  }
                  aria-expanded={whyDomain === domain.key}
                  onClick={() => {
                    setWhyDomain(domain.key);
                    setWhyOpen(true);
                  }}
                >
                  <DomainChip domain={domain.key} />
                  <span className="lab-domain__score">
                    {unclassified ? '—' : formatScore(domain.score_display)}
                  </span>
                  <span className="lab-domain__state">
                    {unclassified ? 'No clasificado' : formatState(domain.state_final)}
                  </span>
                  {fraction ? <span className="lab-domain__meta">{fraction}</span> : null}
                </button>
              );
            })}
          </div>

          <p className="lab-muted">Ruta diagnóstica: {plan?.name && !blocked ? plan.name : 'No se propone'}</p>
          <p className="lab-muted">
            Alertas:{' '}
            {firedAlerts.length
              ? `Alerta ${labUiLabels.severity(firedAlerts[0].severity)} en ${labUiLabels.domain(firedAlerts[0].domain)}`
              : 'No hay alertas activas'}
          </p>
          {blocked ? (
            <Alert tone="danger" title="Recomendación bloqueada">
              Esta ruta no se entrega como recomendación ejecutable
              {critical.length
                ? ` mientras siga activa la alerta de ${labUiLabels.domain(critical[0].domain)}.`
                : '.'}
            </Alert>
          ) : null}

          {pair?.available ? (
            <PairCompare
              pair={pair}
              aColumn={pair.columns?.a ?? 'A'}
              bColumn={pair.columns?.b ?? 'B'}
            />
          ) : null}

          {pair && isAbPair(pair) && !pair.available ? (
            <p className="lab-hint">La comparación aparece cuando ambos casos estén revelados.</p>
          ) : null}

          {parentCompare?.parent && !parentCompare.available ? (
            <p className="lab-hint">El resultado de la Matriz se compara cuando ambos casos están revelados.</p>
          ) : null}

          <details className="lab-details" open={whyOpen} onToggle={(event) => setWhyOpen(event.currentTarget.open)}>
            <summary>Cómo llegó la Matriz aquí</summary>
            <div className="lab-stack">
              <div className="lab-why-nav" role="tablist" aria-label="Ámbito">
                {planned.map((domain) => {
                  const active = shownDomain === domain.key;
                  return (
                    <button
                      key={domain.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={[
                        'lab-why-nav__item',
                        active ? 'is-active' : '',
                        domain.key === snapshot.priority.domain ? 'is-first' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setWhyDomain(domain.key)}
                    >
                      <span className="lab-why-nav__name">{labUiLabels.domain(domain.key)}</span>
                      <span className="lab-why-nav__score">
                        {domain.classification === 'NO_CLASIFICADO' || domain.score_display == null
                          ? '—'
                          : String(domain.score_display)}
                      </span>
                      <span className="lab-why-nav__state">
                        {domain.classification === 'NO_CLASIFICADO'
                          ? 'No clasificado'
                          : formatState(domain.state_final)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <HowMatrixArrived result={result} questions={questions} domainKey={shownDomain} />
              <WhyTree result={result} domainKey={shownDomain} onTryAlternative={onTryAlternative} />
              <Tech>
                <pre className="lab-pre">{why}</pre>
                <pre className="lab-pre">{trace}</pre>
              </Tech>
            </div>
          </details>

          {footer}
      </div>
    </div>
  );
}

function describeTier(tier: string | null): string {
  if (tier === 'CRITICA') return 'una alerta crítica en ese ámbito';
  if (tier === 'ALTA') return 'una alerta alta en ese ámbito';
  return 'su estado y puntaje frente a los demás ámbitos';
}

export function buildHumanWhy(result: LabResult, tie: boolean): string[] {
  const snapshot = result.snapshot;
  const planned = snapshot.domains.filter((domain) => PLANNED.includes(domain.key));
  const lines: string[] = [];
  const fired = snapshot.safety.alerts.filter((alert) => alert.fired);

  if (planned.every((domain) => domain.classification === 'NO_CLASIFICADO')) {
    lines.push('Ningún ámbito alcanzó la cobertura mínima de respuestas.');
    lines.push('Sin cobertura no se calcula puntaje ni se asigna estado.');
    lines.push('Sin estado no hay ámbito candidato, así que no hay ámbito prioritario ni ruta.');
    return lines;
  }

  const states = planned.map((domain) => domain.state_final);
  const scores = planned.map((domain) => domain.score_display);
  const sameState = states.every((state) => state === states[0]);
  const sameScore = scores.every((score) => score === scores[0]);

  if (sameState && sameScore) {
    lines.push('Los cuatro ámbitos terminaron con el mismo puntaje y el mismo estado.');
  } else {
    lines.push(
      `Cada ámbito terminó con su propio puntaje: ${planned
        .map((domain) => `${labUiLabels.domain(domain.key)} ${domain.score_display ?? 'sin puntaje'}`)
        .join(', ')}.`,
    );
  }

  if (fired.length === 0) {
    lines.push('Ninguna alerta cambió el resultado.');
  } else {
    lines.push(
      `Se disparó una alerta ${labUiLabels.severity(fired[0].severity)} en ${labUiLabels.domain(
        fired[0].domain,
      )}, y eso condiciona el estado de ese ámbito.`,
    );
  }

  if (tie) {
    lines.push(
      `La regla de desempate vigente seleccionó ${labUiLabels.domain(
        snapshot.priority.domain,
      )} como ámbito prioritario.`,
    );
  } else if (snapshot.priority.domain) {
    lines.push(
      `${labUiLabels.domain(snapshot.priority.domain)} quedó primero por ${describeTier(
        snapshot.priority.tier,
      )}.`,
    );
  }

  const primary = snapshot.recommendations.primary;
  if (primary?.plan_id) {
    const plan = result.catalog.plans.find((item) => item.id === primary.plan_id);
    lines.push(
      `A ese ámbito y ese estado les corresponde la ruta sugerida ${plan?.name ?? primary.plan_id}.`,
    );
  }
  return lines;
}

function domainEvaluableFraction(
  domainKey: string,
  questions: LabQuestion[] | undefined,
  result: LabResult,
): string | null {
  if (questions?.length) {
    const row = resolveCaseCounts(questions).domains.find((item) => item.domain === domainKey);
    if (row && row.evaluable > 0) return `${row.evaluableAnswered} de ${row.evaluable}`;
  }
  const dims = result.snapshot.dimensions.filter((item) => item.domain === domainKey);
  if (!dims.length) return null;
  const evaluable = dims.reduce((total, item) => total + item.items_scoreable, 0);
  const answered = dims.reduce((total, item) => total + item.items_scored, 0);
  if (evaluable <= 0) return null;
  return `${answered} de ${evaluable}`;
}

function CriterionVsMatrixCard({
  expectation,
  result,
}: {
  expectation: LabExpectation | null | undefined;
  result: LabResult;
}) {
  const snapshot = result.snapshot;
  const plan = result.catalog.plans.find(
    (item) => item.id === snapshot.recommendations.primary?.plan_id,
  );
  const stance = stanceFromRecord({
    openFirstAction: expectation?.openFirstAction,
    personalFirstDomain: expectation?.personalFirstDomain,
  });
  const focus = snapshot.priority.domain;
  const matrixState = snapshot.domains.find((domain) => domain.key === focus)?.state_final ?? null;
  const expectedState = focus ? expectation?.expectedStates?.[focus] : undefined;
  const view = criterionVsMatrix({
    stance,
    personalDomain: expectation?.personalFirstDomain,
    expectedState,
    expectedPlanId: expectation?.expectedPlanId,
    matrixDomain: snapshot.priority.domain,
    matrixState,
    matrixPlanName: plan?.name ?? null,
    matrixBlocked: snapshot.recommendations.primary?.executable_recommendation === 'BLOCKED',
  });
  const usedPrediction = anticipatedMatrix({
    expected_states: expectation?.expectedStates,
    expected_priority_domain: expectation?.expectedPriorityDomain,
    expected_plan_id: expectation?.expectedPlanId,
  });
  const predicted = compareOptionalPrediction(
    expectation?.expectedPriorityDomain,
    snapshot.priority.domain,
  );

  return (
    <LabCard title="Tu lectura antes de ver la Matriz">
      <table className="lab-table">
        <thead>
          <tr>
            <th> </th>
            <th>Tu lectura</th>
            <th>Matriz</th>
          </tr>
        </thead>
        <tbody>
          {view.rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.you}</td>
              <td>{row.matrix}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="lab-lead">{view.phrase}</p>
      {view.firstDifference ? (
        <p className="lab-muted">
          Diferencia en {view.firstDifference}: {view.rows.find((row) => row.label.toLowerCase().includes(view.firstDifference!))?.you ?? 'tu lectura'} frente a la Matriz.
        </p>
      ) : usedPrediction && predicted === 'DIFFERENT' ? (
        <p className="lab-muted">
          Diferencia: {labUiLabels.expectedPriority(expectation?.expectedPriorityDomain)} frente a{' '}
          {snapshot.priority.domain ? labUiLabels.domain(snapshot.priority.domain) : 'ninguno'}.
        </p>
      ) : null}
    </LabCard>
  );
}

function HowMatrixArrived({
  result,
  questions,
  domainKey,
}: {
  result: LabResult;
  questions?: LabQuestion[];
  domainKey: string;
}) {
  const snapshot = result.snapshot;
  const domain = snapshot.domains.find((item) => item.key === domainKey);
  const dims = snapshot.dimensions.filter((item) => item.domain === domainKey);
  const scoreable = (questions ?? []).filter((item) => item.scoreable && item.domain === domainKey);
  const answered = scoreable.filter((item) => item.status === 'ANSWERED' || item.raw_value != null).length;
  const coveragePct =
    domain?.coverage_definition != null ? Math.round(domain.coverage_definition * 100) : null;
  const fired = snapshot.safety.alerts.filter((alert) => alert.fired);
  const plan = result.catalog.plans.find(
    (item) => item.id === snapshot.recommendations.primary?.plan_id,
  );
  const candidates = snapshot.priority.candidates;
  const next = candidates.find((item) => item.domain !== snapshot.priority.domain);
  const gap =
    domain?.score_display != null && next?.score_display != null
      ? Math.abs(domain.score_display - next.score_display)
      : null;
  const band = result.lab_reading.state_bands?.find((item) => item.state === domain?.state_from_band);
  const scoredTrace = (result.lab_reading.item_trace ?? []).filter(
    (item) => item.domain === domainKey && item.normalized_score != null,
  );
  const direction = result.direction_reading ?? null;

  return (
    <div className="lab-stack">
      <LabCard title="A. Cómo se clasificó">
        <p className="lab-muted">
          {scoreable.length
            ? `${answered} de ${scoreable.length} preguntas puntuables de este ámbito.`
            : 'Preguntas puntuables de este ámbito.'}{' '}
          {coveragePct != null ? `Cobertura: ${coveragePct} %.` : ''}
        </p>
        {scoredTrace.length ? (
          <p className="lab-muted">
            {scoredTrace.length} respuestas de este ámbito entran al puntaje.
          </p>
        ) : (
          <p className="lab-muted">Ninguna respuesta de este ámbito entra al puntaje.</p>
        )}
        {dims.length ? (
          <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
            {dims.map((item) => (
              <li key={item.key}>
                {result.catalog.dimension_labels[item.key] ?? item.key}: {item.score_display ?? 'sin puntaje'}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="lab-muted">
          {band
            ? `Regla de estado: ${band.min} a ${band.max} produce ${formatState(band.state)}.`
            : domain?.classification === 'NO_CLASIFICADO'
              ? 'No hay cobertura suficiente para asignar estado.'
              : 'El estado sigue la banda del puntaje.'}
        </p>
      </LabCard>

      <LabCard title="B. Fuera del puntaje">
        <p className="lab-muted">
          Cobertura diagnóstica: {coveragePct != null ? `${coveragePct} %.` : 'sin dato.'}
        </p>
        <p className="lab-muted">
          {snapshot.priority.domain
            ? `Ámbito prioritario: ${labUiLabels.domain(snapshot.priority.domain)}.${gap != null ? ` Diferencia con el siguiente: ${gap} puntos.` : ''}`
            : 'Ningún ámbito alcanzó cobertura suficiente para un ámbito prioritario.'}
        </p>
        <p className="lab-muted">
          Alertas:{' '}
          {fired.length
            ? fired
                .map((alert) => `${labUiLabels.severity(alert.severity)} en ${labUiLabels.domain(alert.domain)}`)
                .join('. ')
            : 'ninguna activada.'}
        </p>
        <p className="lab-muted">
          Ruta: {plan ? `${plan.name}, derivada de ${labUiLabels.domain(plan.domain)} y ${formatState(plan.state)}.` : 'no se propone.'}
        </p>
      </LabCard>

      <LabCard title="C. Dirección">
        {direction ? (
          <>
            <p className="lab-muted">
              Cobertura de señal: {direction.signal_coverage}. Base: {direction.basis}.
            </p>
            {direction.evidence.length ? (
              <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
                {direction.evidence.slice(0, 8).map((item) => (
                  <li key={item.question_id}>
                    {item.question_id}: {item.original_text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="lab-muted">No hay evidencia textual de dirección en este corrido.</p>
            )}
            <p className="lab-muted">Se usa ahora: {direction.used_now}</p>
            <p className="lab-muted">Se usará después: {direction.used_later}</p>
            <p className="lab-muted">No modifica {direction.does_not_modify}.</p>
          </>
        ) : (
          <p className="lab-muted">Este corrido no tiene una lectura de dirección congelada.</p>
        )}
      </LabCard>
    </div>
  );
}


