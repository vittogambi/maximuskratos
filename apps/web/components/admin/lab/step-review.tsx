'use client';

import { useEffect, useState } from 'react';
import { LabCard, QuestionPicker, RadioCards, SavedNote } from './primitives';
import {
  labApi,
  type LabComparison,
  type LabExpectation,
  type LabFinding,
  type LabQuestion,
  type LabResult,
  type LabReviewRecord,
} from '@/lib/lab-api';
import { formatAnswer, formatState } from '@/lib/lab-ui/format';
import {
  FIRST_PROBLEM_OPTIONS,
  OVERALL_SENSE_OPTIONS,
  FINDING_CONFIDENCE_OPTIONS,
  labUiLabels,
} from '@/lib/lab-ui/labels';
import { resolveCaseCounts } from '@/lib/lab-ui/question-counts';
import {
  DOUBT_OPTIONS,
  WEIGHT_INTENT_OPTIONS,
  followupCauseLabel,
  followupForLayer,
  needsFirstProblem,
  PRIORITY_EXPECTATION_OPTIONS,
  STATE_EXPECTATION_OPTIONS,
  showsWeightFollowup,
} from '@/lib/lab-ui/review-followup';

const DOMAINS = ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'] as const;

export interface ReviewDraft {
  overallSense: string;
  verdicts: Record<string, string>;
  states: Record<string, string>;
  postRevealStates: Record<string, string>;
  postRevealPriority: string;
  recommendedPlanId: string;
  firstDivergence: string;
  rootCauses: string[];
  evidence: string[];
  notes: string;
  doubtedRules: string[];
  findingConfidence: string;
  linkedFindingId: string;
}

export const emptyReviewDraft: ReviewDraft = {
  overallSense: '',
  verdicts: { safety: 'UNCERTAIN', priority: 'UNCERTAIN', plan: 'UNCERTAIN', interpretation: 'UNCERTAIN' },
  states: { MENTALIDAD: 'UNCERTAIN', RELACIONES: 'UNCERTAIN', FINANZAS: 'UNCERTAIN', CUERPO: 'UNCERTAIN' },
  postRevealStates: {},
  postRevealPriority: '',
  recommendedPlanId: '',
  firstDivergence: '',
  rootCauses: [],
  evidence: [],
  notes: '',
  doubtedRules: [],
  findingConfidence: 'MEDIA',
  linkedFindingId: '',
};

export function StepReview({
  result,
  questions,
  expectation,
  saved,
  draft,
  onDraft,
  pending,
  onSubmit,
  onContinue,
  runId,
  comparison,
}: {
  result: LabResult;
  questions: LabQuestion[];
  expectation: LabExpectation | null;
  comparison?: LabComparison | null;
  saved: LabReviewRecord | null;
  draft: ReviewDraft;
  onDraft: (next: ReviewDraft) => void;
  pending: boolean;
  onSubmit: () => void;
  onContinue: () => void;
  runId?: string;
}) {
  const [showSaved, setShowSaved] = useState(false);
  const [findings, setFindings] = useState<LabFinding[]>([]);
  const snapshot = result.snapshot;

  useEffect(() => {
    labApi.findings().then((body) => setFindings(body.findings)).catch(() => undefined);
  }, []);

  function set<K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) {
    onDraft({ ...draft, [key]: value });
  }

  const disagree = needsFirstProblem(draft.overallSense);
  const unsure = draft.overallSense === 'UNSURE';
  const firstRequired = disagree && (!draft.firstDivergence || draft.firstDivergence === 'NONE');
  const followup = draft.firstDivergence ? followupForLayer(draft.firstDivergence) : null;
  const notesRequired = disagree && draft.firstDivergence && draft.firstDivergence !== 'UNSURE' && !draft.notes.trim();
  const doubtRequired = unsure && !draft.doubtedRules[0];
  const focusDomain = snapshot.priority.domain;
  const matrixState = snapshot.domains.find((domain) => domain.key === focusDomain)?.state_final;
  const related = findings.filter((item) => {
    if (item.status === 'KEEP_MATRIX' || item.status === 'CHANGE_MATRIX' || item.status === 'OUTSIDE_MATRIX') {
      return false;
    }
    return true;
  });

  function applySense(value: string) {
    const all =
      value === 'YES' ? 'CORRECT' : value === 'PARTIAL' ? 'PARTIAL' : value === 'NO' ? 'INCORRECT' : 'UNCERTAIN';
    onDraft({
      ...draft,
      overallSense: value,
      verdicts: { safety: all, priority: all, plan: all, interpretation: all },
      firstDivergence:
        value === 'YES' ? 'NONE' : draft.firstDivergence === 'NONE' ? '' : draft.firstDivergence,
      doubtedRules: value === 'UNSURE' ? draft.doubtedRules : [],
    });
  }

  function applyFirstProblem(value: string) {
    onDraft(draftWithFirstProblem(draft, value));
  }

  const cta = !draft.overallSense
    ? 'Responde si coincide'
    : draft.overallSense === 'YES'
      ? 'Cerrar revisión'
      : unsure
        ? 'Registrar duda'
        : 'Registrar hallazgo';

  return (
    <div className="lab-stack">
      <div className="lab-ctabar lab-ctabar--dock">
        <div>
          {saved ? <SavedNote>Evaluación guardada.</SavedNote> : null}
          {showSaved && !saved ? <SavedNote>Evaluación guardada.</SavedNote> : null}
          <p className="lab-ctabar__note">
            {!draft.overallSense
              ? 'Primero responde si el resultado coincide con lo que esperabas.'
              : draft.overallSense === 'YES'
                ? 'Puedes cerrar este caso como correcto.'
                : unsure
                  ? 'Una duda metodológica no obliga a cambiar la Matriz.'
                  : firstRequired
                    ? 'Indica dónde aparece la primera diferencia.'
                    : notesRequired
                      ? 'Describe qué esperabas.'
                      : 'Registra el hallazgo. El cambio se prueba después, si aplica.'}
          </p>
        </div>
        <button
          type="button"
          className="lab-btn"
          disabled={pending || !draft.overallSense || firstRequired || notesRequired || doubtRequired}
          onClick={() => {
            setShowSaved(true);
            onSubmit();
          }}
        >
          {cta}
        </button>
      </div>

      <LabCard title="¿El resultado coincide con lo que esperabas?">
        <RadioCards
          name="overall-sense"
          value={draft.overallSense}
          options={OVERALL_SENSE_OPTIONS}
          compact
          columns={2}
          onChange={applySense}
        />
        {draft.overallSense === 'YES' ? (
          <>
            <p className="lab-lead">Perfecto. Puedes cerrar este caso como correcto.</p>
            <label className="lab-field">
              <span className="lab-label">Nota opcional</span>
              <textarea
                className="lab-textarea lab-textarea--short"
                value={draft.notes}
                onChange={(event) => set('notes', event.target.value)}
              />
            </label>
          </>
        ) : null}
      </LabCard>

      {unsure ? (
        <LabCard title="¿Qué te falta para poder decidir?">
          <RadioCards
            name="doubt"
            value={draft.doubtedRules[0] ?? ''}
            options={DOUBT_OPTIONS}
            compact
            onChange={(value) => set('doubtedRules', [value])}
          />
          <label className="lab-field">
            <span className="lab-label">Nota opcional</span>
            <textarea
              className="lab-textarea lab-textarea--short"
              value={draft.notes}
              onChange={(event) => set('notes', event.target.value)}
            />
          </label>
        </LabCard>
      ) : null}

      {disagree ? (
        <LabCard title="¿Dónde aparece la primera diferencia?">
          <RadioCards
            name="first-problem"
            value={draft.firstDivergence}
            options={FIRST_PROBLEM_OPTIONS}
            compact
            onChange={applyFirstProblem}
          />
        </LabCard>
      ) : null}

      {disagree && draft.firstDivergence && draft.firstDivergence !== 'NONE' && draft.firstDivergence !== 'UNSURE' ? (
        <DivergenceBranch
          draft={draft}
          questions={questions}
          result={result}
          followup={followup}
          focusDomain={focusDomain}
          matrixState={matrixState}
          onDraft={onDraft}
        />
      ) : null}

      {disagree && draft.firstDivergence && draft.firstDivergence !== 'NONE' ? (
        <LabCard title="Hallazgo">
          {related.length ? (
            <div className="lab-stack lab-stack--tight">
              <p className="lab-lead">Relacionar con hallazgo existente</p>
              <label className="lab-check">
                <input
                  type="radio"
                  name="link-finding"
                  checked={!draft.linkedFindingId}
                  onChange={() => set('linkedFindingId', '')}
                />
                Registrar un hallazgo nuevo
              </label>
              {related.slice(0, 8).map((item) => (
                <label key={item.id} className="lab-check">
                  <input
                    type="radio"
                    name="link-finding"
                    checked={draft.linkedFindingId === item.id}
                    onChange={() => set('linkedFindingId', item.id)}
                  />
                  {item.code}: {item.title}
                  {item.cases[0]?.label ? ` (${item.cases.map((row) => row.label).join(', ')})` : ''}
                </label>
              ))}
            </div>
          ) : null}
          <label className="lab-field">
            <span className="lab-label">Qué ocurrió</span>
            <p className="lab-muted">
              {labUiLabels.firstDivergence(draft.firstDivergence)}
              {draft.rootCauses[0] ? `. ${followupCauseLabel(draft.firstDivergence, draft.rootCauses)}` : ''}
            </p>
          </label>
          <label className="lab-field">
            <span className="lab-label">Qué esperabas</span>
            <textarea
              className="lab-textarea"
              value={draft.notes}
              aria-label="Qué esperabas"
              onChange={(event) => set('notes', event.target.value)}
            />
          </label>
          <div className="lab-field">
            <span className="lab-label">Confianza</span>
            <RadioCards
              name="finding-confidence"
              value={draft.findingConfidence}
              options={FINDING_CONFIDENCE_OPTIONS}
              compact
              onChange={(value) => set('findingConfidence', value)}
            />
          </div>
        </LabCard>
      ) : null}
    </div>
  );
}

function DivergenceBranch({
  draft,
  questions,
  result,
  followup,
  focusDomain,
  matrixState,
  onDraft,
}: {
  draft: ReviewDraft;
  questions: LabQuestion[];
  result: LabResult;
  followup: ReturnType<typeof followupForLayer>;
  focusDomain: string | null;
  matrixState: string | null | undefined;
  onDraft: (next: ReviewDraft) => void;
}) {
  const layer = draft.firstDivergence;
  const snapshot = result.snapshot;
  const plan = result.catalog.plans.find(
    (item) => item.id === snapshot.recommendations.primary?.plan_id,
  );

  function set<K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) {
    onDraft({ ...draft, [key]: value });
  }

  return (
    <>
      {layer === 'RESPONSE_VALIDATION' ? (
        <LabCard title="Buscar pregunta del caso">
          <QuestionPicker
            requireSearch
            label="Buscar pregunta del caso"
            help="Escribe para encontrar la pregunta. No se listan todas de entrada."
            max={3}
            questions={questions
              .filter((question) => question.status === 'ANSWERED')
              .map((question) => ({
                id: question.id,
                text: question.text,
                domain: question.domain,
                answer: formatAnswer(question),
              }))}
            picked={draft.evidence}
            onChange={(next) => set('evidence', next)}
          />
        </LabCard>
      ) : null}

      {followup ? (
        <LabCard title={followup.title}>
          <RadioCards
            name="root-cause"
            value={draft.rootCauses[0] ?? ''}
            options={followup.options}
            compact
            onChange={(value) => set('rootCauses', [value, ...draft.rootCauses.slice(1)])}
          />
        </LabCard>
      ) : null}

      {showsWeightFollowup(layer, draft.rootCauses[0] ?? '') ? (
        <LabCard title="¿Cómo debería influir?">
          <RadioCards
            name="weight-intent"
            value={draft.rootCauses[1] ?? ''}
            options={WEIGHT_INTENT_OPTIONS}
            compact
            onChange={(value) => set('rootCauses', [draft.rootCauses[0] ?? 'WEIGHT', value])}
          />
          {draft.rootCauses[1] === 'LESS' ? (
            <p className="lab-hint">Una prueba habitual es dejarla en la mitad (0,5 si hoy vale 1).</p>
          ) : null}
          {draft.rootCauses[1] === 'MORE' ? (
            <p className="lab-hint">Una prueba habitual es duplicarla (2 si hoy vale 1).</p>
          ) : null}
        </LabCard>
      ) : null}

      {layer === 'DOMAIN_COVERAGE' ? (
        <LabCard title="Cobertura de este caso">
          <CoverageFacts result={result} questions={questions} />
        </LabCard>
      ) : null}

      {layer === 'STATE_BAND' && focusDomain ? (
        <LabCard title="¿Qué estado esperabas?">
          <p className="lab-muted">
            Matriz: {formatState(matrixState)}. Ámbito: {labUiLabels.domain(focusDomain)}.
          </p>
          <RadioCards
            name="expected-state"
            value={draft.postRevealStates[focusDomain] ?? ''}
            options={STATE_EXPECTATION_OPTIONS}
            compact
            onChange={(value) =>
              set('postRevealStates', { ...draft.postRevealStates, [focusDomain]: value })
            }
          />
        </LabCard>
      ) : null}

      {layer === 'SAFETY_EVAL' ? (
        <LabCard title="Alertas">
          {snapshot.safety.alerts.filter((alert) => alert.fired).length ? (
            <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
              {snapshot.safety.alerts
                .filter((alert) => alert.fired)
                .map((alert) => (
                  <li key={alert.question_id}>
                    {labUiLabels.domain(alert.domain)}. {labUiLabels.severity(alert.severity)}. {alert.condition_text}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="lab-muted">En este caso no hay una alerta disparada. Revisa si debería haberla.</p>
          )}
        </LabCard>
      ) : null}

      {layer === 'PRIORITY' ? (
        <LabCard title="¿Qué debería ir primero?">
          <p className="lab-muted">
            La Matriz eligió: {focusDomain ? labUiLabels.domain(focusDomain) : 'ningún ámbito'}.
          </p>
          <RadioCards
            name="expected-priority"
            value={draft.postRevealPriority}
            options={PRIORITY_EXPECTATION_OPTIONS}
            compact
            columns={2}
            onChange={(value) => set('postRevealPriority', value)}
          />
        </LabCard>
      ) : null}

      {layer === 'RECOMMENDATION' ? (
        <LabCard title="Ámbito prioritario y ruta">
          <p className="lab-muted">Ámbito prioritario: {focusDomain ? labUiLabels.domain(focusDomain) : 'ninguno'}.</p>
          <p className="lab-muted">Ruta Matriz: {plan?.name ?? 'No se propone'}.</p>
          {draft.rootCauses[0] === 'PLAN' ? (
            <label className="lab-field">
              <span className="lab-label">Ruta que esperarías, o ninguna todavía</span>
              <select
                className="lab-select"
                value={draft.recommendedPlanId}
                onChange={(event) => set('recommendedPlanId', event.target.value)}
              >
                <option value="">Todavía no propondría ruta</option>
                {result.catalog.plans
                  .filter((item) => !focusDomain || item.domain === focusDomain)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}
        </LabCard>
      ) : null}

      {layer === 'CONTEXT_MISSING' ? (
        <LabCard title="Qué se pierde al resumir">
          <QuestionPicker
            requireSearch
            label="Preguntas relacionadas, si aplica"
            max={3}
            questions={questions
              .filter((question) => question.status === 'ANSWERED')
              .map((question) => ({
                id: question.id,
                text: question.text,
                domain: question.domain,
                answer: formatAnswer(question),
              }))}
            picked={draft.evidence}
            onChange={(next) => set('evidence', next)}
          />
        </LabCard>
      ) : null}
    </>
  );
}

function CoverageFacts({ result, questions }: { result: LabResult; questions: LabQuestion[] }) {
  const counts = resolveCaseCounts(questions);
  const rows = DOMAINS.map((key) => {
    const fromQ = counts.domains.find((item) => item.domain === key);
    const dims = result.snapshot.dimensions.filter((item) => item.domain === key);
    const evaluable = fromQ?.evaluable || dims.reduce((total, item) => total + item.items_scoreable, 0);
    const answered = fromQ?.evaluableAnswered || dims.reduce((total, item) => total + item.items_scored, 0);
    const domain = result.snapshot.domains.find((item) => item.key === key);
    return { key, evaluable, answered, classification: domain?.classification };
  });
  return (
    <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
      {rows.map((row) => (
        <li key={row.key}>
          {labUiLabels.domain(row.key)} tiene {row.answered} de {row.evaluable} preguntas evaluables respondidas.
          {row.classification === 'NO_CLASIFICADO' ? ' Cobertura insuficiente.' : ''}
        </li>
      ))}
    </ul>
  );
}

/** Maps the human choice to the review contract. */
export function draftWithFirstProblem(draft: ReviewDraft, value: string): ReviewDraft {
  return { ...draft, firstDivergence: value, rootCauses: [] };
}

export function reviewPayload(draft: ReviewDraft) {
  const postStates = Object.fromEntries(
    Object.entries(draft.postRevealStates).filter(([, value]) => value),
  );
  return {
    verdicts: {
      safety: draft.verdicts.safety,
      priority: draft.verdicts.priority,
      plan: draft.verdicts.plan,
      interpretation: draft.verdicts.interpretation,
      states: draft.states,
    },
    first_wrong_layer: draft.firstDivergence || null,
    no_methodological_problem: draft.firstDivergence === 'NONE',
    root_cause_codes: [...draft.rootCauses],
    evidence_refs: draft.evidence,
    recommended_plan_id: draft.recommendedPlanId || null,
    post_reveal_states: Object.keys(postStates).length ? postStates : null,
    post_reveal_priority_domain: draft.postRevealPriority || null,
    notes: draft.notes || null,
    doubted_rules: draft.doubtedRules ?? [],
    linked_finding_id: draft.linkedFindingId || null,
  };
}

export function draftFromReview(saved: {
  verdicts?: Record<string, unknown> | null;
  postRevealStates?: Record<string, string> | null;
  postRevealPriorityDomain?: string | null;
  wouldRecommendPlanId?: string | null;
  recommendedPlanId?: string | null;
  firstWrongLayer?: string | null;
  noMethodologicalProblem?: boolean;
  rootCauseCodes?: string[] | null;
  evidenceRefs?: string[] | null;
  notes?: string | null;
  doubtedRules?: string[] | null;
  linkedFindingId?: string | null;
}): ReviewDraft {
  const verdicts = (saved.verdicts ?? {}) as Record<string, string | Record<string, string>>;
  const states = (verdicts.states as Record<string, string> | undefined) ?? emptyReviewDraft.states;
  return {
    verdicts: {
      safety: String(verdicts.safety ?? 'UNCERTAIN'),
      priority: String(verdicts.priority ?? 'UNCERTAIN'),
      plan: String(verdicts.plan ?? 'UNCERTAIN'),
      interpretation: String(verdicts.interpretation ?? 'UNCERTAIN'),
    },
    states,
    postRevealStates: saved.postRevealStates ?? {},
    postRevealPriority: saved.postRevealPriorityDomain ?? '',
    recommendedPlanId: saved.wouldRecommendPlanId ?? saved.recommendedPlanId ?? '',
    firstDivergence: saved.firstWrongLayer ?? (saved.noMethodologicalProblem ? 'NONE' : ''),
    rootCauses: saved.rootCauseCodes ?? [],
    evidence: saved.evidenceRefs ?? [],
    notes: saved.notes ?? '',
    doubtedRules: saved.doubtedRules ?? [],
    findingConfidence: 'MEDIA',
    linkedFindingId: saved.linkedFindingId ?? '',
    overallSense: saved.noMethodologicalProblem
      ? 'YES'
      : saved.doubtedRules?.length
        ? 'UNSURE'
        : saved.firstWrongLayer === 'UNKNOWN' || saved.firstWrongLayer === 'UNSURE'
          ? 'UNSURE'
          : saved.firstWrongLayer
            ? 'NO'
            : '',
  };
}
