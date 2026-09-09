'use client';

import { useState } from 'react';
import { LabCard, Tech } from './primitives';
import type { LabItemTrace, LabResult } from '@/lib/lab-api';
import { describePriorityChoice, labUiLabels } from '@/lib/lab-ui/labels';

function scoreText(value: number | null | undefined) {
  return value == null ? 'sin puntaje' : String(value);
}

export function WhyTree({
  result,
  domainKey,
  onTryAlternative,
  defaultOpenDimension = null,
}: {
  result: LabResult;
  domainKey: string;
  onTryAlternative?: (domain: string) => void;
  defaultOpenDimension?: string | null;
}) {
  const [openDimension, setOpenDimension] = useState<string | null>(defaultOpenDimension);
  const domain = result.snapshot.domains.find((item) => item.key === domainKey);
  const rows = result.lab_reading.composition?.[domainKey] ?? [];
  const items = (result.lab_reading.item_trace ?? []).filter((item) => item.domain === domainKey);
  const formula = result.lab_reading.domain_formula?.[domainKey];
  const bands = result.lab_reading.state_bands ?? [];
  const counter = result.lab_reading.counterfactual_item_weighted?.[domainKey];
  const alerts = result.snapshot.safety.alerts.filter(
    (alert) => alert.fired && alert.domain === domainKey && alert.override_applied,
  );
  const primary = result.snapshot.recommendations.primary;
  const display = domain?.score_display ?? formula?.display ?? null;
  const used = rows.filter((row) => row.score != null);
  const chosen = result.snapshot.priority.domain;
  const low = used.length > 1 ? Math.min(...used.map((row) => row.score as number)) : null;
  const spread = low != null && used.some((row) => row.score !== low);

  return (
    <div className="lab-why">
      <LabCard title={labUiLabels.domain(domainKey)}>
        {!chosen ? (
          <p className="lab-muted">{describePriorityChoice(result.snapshot.priority)}</p>
        ) : null}
        <p className="lab-why__summary">
          <span className="lab-why__summary-score">{scoreText(display)}</span>
          <span className="lab-why__summary-state">{labUiLabels.state(domain?.state_final)}</span>
        </p>
        <p className="lab-muted">
          Hoy estas áreas cuentan por igual para calcular {labUiLabels.domain(domainKey)}.
        </p>
        <div className="lab-why__dims">
          {rows.map((row) => {
            const dimItems = items.filter((item) => item.dimension === row.key);
            const open = openDimension === row.key;
            const dimClass = [
              'lab-why__dim',
              open ? 'is-open' : '',
              spread && row.score === low ? 'is-low' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <div key={row.key} className="lab-why__block">
                <button
                  type="button"
                  className={dimClass}
                  aria-expanded={open}
                  onClick={() => setOpenDimension(open ? null : row.key)}
                >
                  <span className="lab-why__dim-label">{row.label}</span>
                  <span className="sr-only">{open ? 'Ocultar preguntas' : 'Ver preguntas'}</span>
                  <span className="lab-why__dim-score">{scoreText(row.score)}</span>
                </button>
                {open ? <DimensionQuestions items={dimItems} /> : null}
              </div>
            );
          })}
        </div>
        {used.length ? null : (
          <p className="lab-muted">Este ámbito no tiene dimensiones con puntaje.</p>
        )}

        {bands.length || alerts.length || primary?.executable_recommendation === 'BLOCKED' ? (
          <div className="lab-why__readout">
            {bands.length ? (
              <div className="lab-why__bands">
                {bands.map((band) => (
                  <span
                    key={band.rule_id}
                    className={band.state === domain?.state_from_band ? 'lab-why__band is-active' : 'lab-why__band'}
                  >
                    {labUiLabels.state(band.state)} {band.min} a {band.max}
                  </span>
                ))}
              </div>
            ) : null}
            {alerts.map((alert) => (
              <p key={alert.question_id}>
                Una alerta {alert.severity === 'CRITICA' ? 'fuerza Contención' : 'limita a Estabilización'}.
                Estado final: {labUiLabels.state(domain?.state_final)}.
              </p>
            ))}
            {primary?.executable_recommendation === 'BLOCKED' ? (
              <p>Recomendación bloqueada por una alerta.</p>
            ) : null}
          </div>
        ) : null}
      </LabCard>

      {counter != null ? (
        <Tech>
          <p>
            item_weighted {counter}
            {onTryAlternative ? (
              <button type="button" className="lab-btn lab-btn--ghost" onClick={() => onTryAlternative(domainKey)}>
                Probar esta alternativa
              </button>
            ) : null}
          </p>
        </Tech>
      ) : null}
    </div>
  );
}

function DimensionQuestions({ items }: { items: LabItemTrace[] }) {
  const counted = items.filter((item) => item.excluded_reason == null);
  const out = items.filter((item) => item.excluded_reason);
  return (
    <div className="lab-why__qs">
      {counted.map((item) => (
        <QuestionLine key={item.question_id} item={item} />
      ))}
      {out.length ? (
        <>
          <p className="lab-why__out-label">No entran al cálculo</p>
          {out.map((item) => (
            <QuestionLine key={item.question_id} item={item} />
          ))}
        </>
      ) : null}
    </div>
  );
}

function QuestionLine({ item }: { item: LabItemTrace }) {
  const out = Boolean(item.excluded_reason);
  const skipped = item.excluded_reason === 'SKIPPED_BY_USER';
  const answer = skipped ? 'Sin respuesta' : (item.answer_label ?? (out ? null : 'Sin respuesta'));
  const whyOut = out && !skipped ? labUiLabels.excludedReason(item.excluded_reason) : null;
  return (
    <div className={out ? 'lab-why__q is-out' : 'lab-why__q'}>
      <p className="lab-why__q-text">{item.text}</p>
      {answer ? <p className="lab-why__q-answer">{answer}</p> : null}
      {whyOut ? <p className="lab-why__q-answer">{whyOut}</p> : null}
      <span className="lab-why__q-score">{out ? '—' : scoreText(item.normalized_score)}</span>
    </div>
  );
}
