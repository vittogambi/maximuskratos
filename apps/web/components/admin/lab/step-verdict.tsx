'use client';

import { useEffect, useState } from 'react';
import { LabCard, RadioCards } from './primitives';
import {
  labApi,
  type LabComparison,
  type LabExpectation,
  type LabFinding,
  type LabResult,
  type LabReviewRecord,
  type LabRunSummary,
} from '@/lib/lab-api';
import { formatState } from '@/lib/lab-ui/format';
import {
  CASE_VERDICT_OPTIONS,
  DISPOSITION_OPTIONS,
  FINDING_CONFIDENCE_OPTIONS,
  FINDING_LAYER_OPTIONS,
  FINDING_SEVERITY_OPTIONS,
  labUiLabels,
} from '@/lib/lab-ui/labels';
import { type ReviewDraft } from './step-review';
import { type ChangePreset } from '@/lib/lab-ui/change-preset';
import { definitionChangeFromCause, findingLayerFromProblem } from '@/lib/lab-ui/review-followup';

export function StepVerdict({
  run,
  result,
  expectation,
  comparison,
  flaggedQuestions,
  saved,
  reviewDraft,
  pending,
  onSaved,
  onTryChange,
  onContinue,
}: {
  run: LabRunSummary;
  result: LabResult;
  expectation: LabExpectation | null;
  comparison?: LabComparison | null;
  flaggedQuestions?: string[];
  saved: LabReviewRecord | null;
  reviewDraft: ReviewDraft;
  pending: boolean;
  onSaved: (next: LabReviewRecord) => void;
  onTryChange?: (preset: ChangePreset) => void;
  onContinue: () => void;
}) {
  const [caseVerdict, setCaseVerdict] = useState(
    saved?.caseVerdict ??
      (reviewDraft.overallSense === 'YES'
        ? 'REPRESENTS'
        : reviewDraft.overallSense === 'UNSURE'
          ? 'NEED_MORE_INFO'
          : reviewDraft.overallSense === 'PARTIAL' || reviewDraft.overallSense === 'NO'
            ? 'IMPORTANT_DIFF'
            : ''),
  );
  const [hypothesis, setHypothesis] = useState(saved?.hypothesis ?? '');
  const [disposition, setDisposition] = useState(
    saved?.disposition ??
      (reviewDraft.overallSense === 'YES'
        ? 'NO_CHANGE'
        : reviewDraft.overallSense === 'UNSURE'
          ? 'REVIEW_MORE'
          : reviewDraft.overallSense === 'PARTIAL' || reviewDraft.overallSense === 'NO'
            ? 'CREATE_FINDING'
            : ''),
  );
  const [linkedFindingId, setLinkedFindingId] = useState(saved?.linkedFindingId ?? '');
  const [findings, setFindings] = useState<LabFinding[]>([]);
  const [reopen, setReopen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [findingTitle, setFindingTitle] = useState('');
  const [findingSummary, setFindingSummary] = useState('');
  const [findingLayer, setFindingLayer] = useState(
    findingLayerFromProblem(reviewDraft.firstDivergence || 'OTHER'),
  );
  const [findingSeverity, setFindingSeverity] = useState('');
  const [findingConfidence, setFindingConfidence] = useState('');
  const [findingWhy, setFindingWhy] = useState('');

  useEffect(() => {
    labApi.findings().then((body) => setFindings(body.findings)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!saved) return;
    setCaseVerdict(saved.caseVerdict ?? '');
    setHypothesis(saved.hypothesis ?? '');
    setDisposition(saved.disposition ?? '');
    setLinkedFindingId(saved.linkedFindingId ?? '');
  }, [saved]);

  const snapshot = result.snapshot;
  const primary = snapshot.recommendations.primary;
  const plan = result.catalog.plans.find((item) => item.id === primary?.plan_id);
  const personalFirst = expectation?.personalFirstDomain ?? expectation?.openFirstFocus ?? 'Sin registrar';
  const predictedFirst = expectation?.expectedPriorityDomain ?? 'UNSURE';
  const plannedState = snapshot.domains.find((domain) => domain.key === snapshot.priority.domain)?.state_final;

  async function persist(extra: {
    case_verdict: string;
    hypothesis: string | null;
    disposition: string | null;
    linked_finding_id: string | null;
  }) {
    await labApi.patchReviewVerdict(run.id, extra);
    const rev = await labApi.getReview(run.id);
    if (rev.latest) onSaved(rev.latest);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      let linked = linkedFindingId || saved?.linkedFindingId || null;
      if (disposition === 'CREATE_FINDING' && !linked) {
        if (findingTitle.trim().length < 8 || findingSummary.trim().length < 12 || !findingSeverity) {
          setError('Un hallazgo necesita qué observaste, qué debería haber ocurrido y una severidad.');
          return;
        }
        if (
          (findingSeverity === 'IMPORTANT' || findingSeverity === 'CRITICAL') &&
          findingWhy.trim().length < 8
        ) {
          setError('En un hallazgo importante o crítico hay que decir por qué importa.');
          return;
        }
        const created = await labApi.createFinding({
          title: findingTitle.trim(),
          summary: findingSummary.trim(),
          layer: findingLayer || findingLayerFromProblem(reviewDraft.firstDivergence || 'OTHER'),
          severity: findingSeverity,
          hypothesis: [
            findingWhy.trim() ? `Por qué importa: ${findingWhy.trim()}` : '',
            findingConfidence ? `Confianza: ${labUiLabels.confidence(findingConfidence)}.` : '',
            hypothesis.trim(),
          ]
            .filter(Boolean)
            .join(' ') || null,
          current_behavior: findingTitle.trim(),
          rafa_expected_behavior: findingSummary.trim(),
          related_rules: result.lab_reading.decisive_rules?.map((item) => item.id) ?? [],
          evidence_ids: reviewDraft.evidence,
          case_ids: [run.case_id],
          content_change_required: definitionChangeFromCause(
            reviewDraft.firstDivergence,
            reviewDraft.rootCauses[0] ?? '',
          ),
        });
        linked = created.id;
        setLinkedFindingId(created.id);
        setFindings((current) => [created, ...current]);
      }
      if (disposition === 'LINK_FINDING' && linked) {
        await labApi.linkFindingCases(linked, [run.case_id]);
      }
      await persist({
        case_verdict: caseVerdict,
        hypothesis: hypothesis || null,
        disposition: disposition || null,
        linked_finding_id: linked,
      });
      onContinue();
    } catch {
      setError('No pudimos completar esta acción.');
    } finally {
      setSaving(false);
    }
  }

  const wantFinding = caseVerdict === 'MINOR_DIFF' || caseVerdict === 'IMPORTANT_DIFF';
  const wantDoubt = caseVerdict === 'UNSURE' || caseVerdict === 'NEED_MORE_INFO';
  const needsDefinition = definitionChangeFromCause(
    reviewDraft.firstDivergence,
    reviewDraft.rootCauses[0] ?? '',
  );
  const related = findings.filter((item) => {
    if (item.status === 'KEEP_MATRIX' || item.status === 'CHANGE_MATRIX' || item.status === 'OUTSIDE_MATRIX') {
      return false;
    }
    const layer = findingLayerFromProblem(reviewDraft.firstDivergence);
    return item.layer === layer || item.layer === findingLayer;
  });
  const hasFinding =
    Boolean(saved?.linkedFindingId) ||
    findings.some((item) => item.cases.some((row) => row.id === run.case_id));
  const findingReady =
    !wantFinding ||
    hasFinding ||
    (disposition === 'CREATE_FINDING' &&
      findingTitle.trim().length >= 8 &&
      findingSummary.trim().length >= 12 &&
      Boolean(findingSeverity) &&
      (findingSeverity === 'MINOR' || findingWhy.trim().length >= 8)) ||
    (disposition === 'LINK_FINDING' && Boolean(linkedFindingId)) ||
    disposition === 'REVIEW_MORE';
  const closeOptions = CASE_VERDICT_OPTIONS.filter((item) =>
    ['REPRESENTS', 'IMPORTANT_DIFF', 'NEED_MORE_INFO'].includes(item.value),
  );

  const alreadyClosed = Boolean(saved?.caseVerdict);

  if (alreadyClosed && !reopen) {
    return (
      <div className="lab-stack">
        <LabCard title="Revisión completada">
          <p className="lab-lead">{labUiLabels.caseVerdict(caseVerdict)}</p>
          <p className="lab-muted">
            {snapshot.priority.domain ? labUiLabels.domain(snapshot.priority.domain) : 'Sin un ámbito prioritario claro'}
            {plannedState ? `. ${formatState(plannedState)}` : ''}
            {plan ? `. ${plan.name}` : ''}
          </p>
          {hasFinding ? <p className="lab-muted">Hay un hallazgo vinculado a este caso.</p> : null}
          <button type="button" className="lab-btn lab-btn--ghost" onClick={() => setReopen(true)}>
            Reabrir revisión
          </button>
        </LabCard>
      </div>
    );
  }

  return (
    <div className="lab-stack">
      <div className="lab-ctabar lab-ctabar--dock">
        <p className="lab-ctabar__note">
          {wantFinding && !findingReady
            ? 'Si encontraste un problema, regístralo como hallazgo. No hace falta probar un cambio para cerrar.'
            : alreadyClosed
              ? 'Si cambias el cierre, se guarda y vuelves a los casos.'
              : 'Cerrar termina la revisión de este caso y vuelve al listado.'}
        </p>
        <button
          type="button"
          className="lab-btn"
          disabled={pending || saving || !caseVerdict || !findingReady}
          onClick={() => void save()}
        >
          {alreadyClosed ? 'Guardar y volver' : 'Cerrar revisión'}
        </button>
      </div>

      <LabCard
        title={
          (run.method_families?.length ?? 0) > 1
            ? `Este caso participa en ${run.method_families!.length} pruebas metodológicas`
            : 'Qué estamos probando'
        }
      >
        {(run.method_families?.length ?? 0) > 1 ? (
          <ul style={{ paddingLeft: '1.1rem' }}>
            {run.method_families!.map((item) => (
              <li key={item.id}>{item.label}</li>
            ))}
          </ul>
        ) : (
          <p className="lab-lead">
            {run.method_families?.[0]?.question ||
              run.test_intent ||
              'Comprobar si la Matriz se comporta con sentido en este caso.'}
          </p>
        )}
      </LabCard>
      <LabCard title="Resumen del caso">
        <p className="lab-muted">{run.expert_context || run.facilitator_note || run.case_label}</p>
      </LabCard>
      <LabCard title="Resultado de la Matriz">
        <p className="lab-lead">
          {snapshot.priority.domain ? labUiLabels.domain(snapshot.priority.domain) : 'Sin un ámbito prioritario claro'}
          {plannedState ? `. ${formatState(plannedState)}` : ''}
          {plan ? `. ${plan.name}` : ''}
        </p>
        <p className="lab-muted">
          Ámbitos:{' '}
          {snapshot.domains
            .filter((domain) => domain.key !== 'PROPÓSITO')
            .map((domain) => `${labUiLabels.domain(domain.key)} ${formatState(domain.state_final)}`)
            .join('. ')}
        </p>
        <p className="lab-muted">
          Alertas: {snapshot.safety.alerts.filter((alert) => alert.fired).length || 'ninguna'}.
          Cobertura: {run.answered} respuestas.
        </p>
      </LabCard>
      <LabCard title="Tu lectura antes de ver la Matriz">
        <p className="lab-muted">
          {expectation
            ? labUiLabels.expectedPriority(personalFirst)
            : 'Todavía no registraste un criterio aparte. El veredicto de abajo basta para cerrar el caso.'}
        </p>
        {reviewDraft.firstDivergence && reviewDraft.firstDivergence !== 'NONE' ? (
          <p className="lab-muted">{labUiLabels.firstDivergence(reviewDraft.firstDivergence)}</p>
        ) : null}
      </LabCard>

      <LabCard title="Después de ver cómo llegó la Matriz a este resultado, ¿qué concluyes?">
        <RadioCards
          name="case-verdict"
          value={caseVerdict}
          options={closeOptions}
          compact
          onChange={(value) => {
            setCaseVerdict(value);
            if (value === 'NEED_MORE_INFO' || value === 'UNSURE') setDisposition('REVIEW_MORE');
            else if (value === 'MINOR_DIFF' || value === 'IMPORTANT_DIFF') setDisposition('CREATE_FINDING');
            else setDisposition('NO_CHANGE');
          }}
        />
      </LabCard>

      {wantFinding && hasFinding ? (
        <LabCard title="Hallazgo">
          <p className="lab-muted">
            Ya hay un hallazgo vinculado a este caso. El cambio se prueba después, si aplica.
          </p>
        </LabCard>
      ) : null}

      {wantFinding && !hasFinding ? (
        <LabCard title="Hallazgo">
          <p className="lab-hint">Primero el problema observado. El cambio se prueba después, si aplica.</p>
          {related.length ? (
            <div className="lab-stack lab-stack--tight">
              <p className="lab-lead">Este problema ya apareció en otros casos.</p>
              {related.slice(0, 5).map((item) => (
                <label key={item.id} className="lab-check">
                  <input
                    type="radio"
                    name="link-finding"
                    checked={linkedFindingId === item.id}
                    onChange={() => {
                      setLinkedFindingId(item.id);
                      setDisposition('LINK_FINDING');
                    }}
                  />
                  Relacionar con {item.code}: {item.title}
                  {item.cases[0]?.label ? ` (${item.cases.map((row) => row.label).join(', ')})` : ''}
                </label>
              ))}
            </div>
          ) : null}
          <RadioCards
            name="finding-disposition"
            value={disposition}
            options={DISPOSITION_OPTIONS.filter((item) =>
              related.length ? true : item.value !== 'LINK_FINDING',
            )}
            compact
            onChange={setDisposition}
          />
          {disposition === 'CREATE_FINDING' ? (
            <>
              <div className="lab-field">
                <span className="lab-label">Dónde está el problema</span>
                <RadioCards
                  name="finding-layer"
                  value={findingLayer}
                  options={FINDING_LAYER_OPTIONS.filter((item) =>
                    ['QUESTION', 'SCALE', 'DIMENSION', 'COVERAGE', 'SCORE', 'STATE', 'SAFETY', 'PRIORITY', 'PLAN', 'INTERPRETATION'].includes(
                      item.value,
                    ),
                  )}
                  compact
                  columns={2}
                  onChange={setFindingLayer}
                />
              </div>
              <label className="lab-field">
                <span className="lab-label">Qué observaste</span>
                <input
                  className="lab-input"
                  value={findingTitle}
                  onChange={(event) => setFindingTitle(event.target.value)}
                  placeholder="La diferencia concreta que no tiene sentido"
                />
              </label>
              <label className="lab-field">
                <span className="lab-label">Qué debería haber ocurrido</span>
                <textarea
                  className="lab-textarea"
                  value={findingSummary}
                  onChange={(event) => setFindingSummary(event.target.value)}
                  placeholder="La lectura que consideras correcta y por qué"
                />
              </label>
              <label className="lab-field">
                <span className="lab-label">
                  Por qué importa
                  {findingSeverity === 'IMPORTANT' || findingSeverity === 'CRITICAL' ? '' : ' (si aplica)'}
                </span>
                <textarea
                  className="lab-textarea"
                  value={findingWhy}
                  onChange={(event) => setFindingWhy(event.target.value)}
                  placeholder="Por qué este problema cambia la Matriz o la experiencia"
                />
              </label>
              <label className="lab-field">
                <span className="lab-label">Hipótesis de causa (opcional)</span>
                <textarea
                  className="lab-textarea"
                  value={hypothesis}
                  onChange={(event) => setHypothesis(event.target.value)}
                />
              </label>
              <div className="lab-field">
                <span className="lab-label">Severidad</span>
                <RadioCards
                  name="finding-severity"
                  value={findingSeverity}
                  options={FINDING_SEVERITY_OPTIONS}
                  compact
                  columns={2}
                  onChange={setFindingSeverity}
                />
              </div>
              <div className="lab-field">
                <span className="lab-label">Confianza</span>
                <RadioCards
                  name="finding-confidence"
                  value={findingConfidence}
                  options={FINDING_CONFIDENCE_OPTIONS}
                  compact
                  columns={2}
                  onChange={setFindingConfidence}
                />
              </div>
              {needsDefinition ? (
                <p className="lab-hint">
                  Esto requiere un cambio de definición en la Matriz. No se simula con un número. Queda
                  como pendiente metodológico.
                </p>
              ) : null}
            </>
          ) : null}
        </LabCard>
      ) : null}

      {wantDoubt ? (
        <LabCard title="Duda pendiente">
          <p className="lab-muted">
            Puedes cerrar el caso sin cambiar la Matriz. Queda como decisión pendiente.
          </p>
          <label className="lab-field">
            <span className="lab-label">Qué te falta para decidir</span>
            <textarea className="lab-textarea" value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} />
          </label>
        </LabCard>
      ) : null}

      {wantFinding && !hasFinding && related.length === 0 ? (
        <p className="lab-hint">
          Si el hallazgo no se creó en la revisión, puedes registrarlo aquí o relacionarlo con uno existente.
        </p>
      ) : null}

      {error ? <p className="lab-error">{error}</p> : null}
    </div>
  );
}

export function verdictMatrixLine(result: LabResult): string {
  const domain = result.snapshot.priority.domain;
  const plan = result.catalog.plans.find((item) => item.id === result.snapshot.recommendations.primary?.plan_id);
  return [domain ? labUiLabels.domain(domain) : 'Sin un ámbito prioritario claro', plan?.name].filter(Boolean).join('. ');
}

export function formatStateLine(state: string | null | undefined): string {
  return formatState(state);
}
