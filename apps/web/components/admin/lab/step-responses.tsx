'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon } from '@/components/app-icon';
import { LabCoverageStrip } from './domain-chip';
import { Questionnaire } from './questionnaire';
import { LabDomainSection, LabQuestionCard } from './question-card';
import { Modal, Tech } from './primitives';
import { labApi, type LabCatalog, type LabItemTrace, type LabQuestion, type LabRunSummary } from '@/lib/lab-api';
import { countResponses, describeResponseBuckets } from '@/lib/lab-ui/format';
import { factualCoverageCopy, formatDomainAccordionLine, isPurposeDomain, resolveCaseCounts } from '@/lib/lab-ui/question-counts';
import { humanDimensionLabel } from '@/lib/lab-ui/domain';
import { labUiLabels } from '@/lib/lab-ui/labels';
import { answersSnapshot, changedResponses } from '@/lib/lab-ui/response-draft';

type StatusFilter = 'todas' | 'respondidas' | 'sin-respuesta' | 'omitidas' | 'marcadas' | 'seguridad';

const STATUS_FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'todas', label: 'Todas' },
  { id: 'respondidas', label: 'Respondidas' },
  { id: 'sin-respuesta', label: 'Sin respuesta' },
  { id: 'omitidas', label: 'Omitidas' },
  { id: 'marcadas', label: 'Marcadas' },
  { id: 'seguridad', label: 'Seguridad' },
];

export function StepResponses({
  run,
  questions,
  catalog,
  pending,
  onFreeze,
  onQuestions,
  firedSafetyIds,
  onDirty,
  saveRef,
  discardRef,
  itemTraces,
  onOpenWhy,
  onTryChange,
}: {
  run: LabRunSummary;
  questions: LabQuestion[];
  catalog?: LabCatalog | null;
  pending: boolean;
  onFreeze: () => void;
  onQuestions?: (next: LabQuestion[]) => void;
  firedSafetyIds?: string[];
  onDirty?: (dirty: boolean) => void;
  saveRef?: { current: (() => Promise<void>) | null };
  discardRef?: { current: (() => void) | null };
  itemTraces?: LabItemTrace[];
  onOpenWhy?: (domain: string) => void;
  onTryChange?: (preset: { kind: string; target_id: string; value: string }) => void;
}) {
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('todos');
  const [status, setStatus] = useState<StatusFilter>(
    run.case_kind === 'SELF' || run.case_kind === 'SIMULATION' ? 'todas' : 'respondidas',
  );
  const [grouped, setGrouped] = useState(true);
  const [expandAll, setExpandAll] = useState(false);
  const [openDomain, setOpenDomain] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [draft, setDraft] = useState(questions);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dirtyRef = useRef(false);

  const dirty = answersSnapshot(draft) !== answersSnapshot(questions);
  dirtyRef.current = dirty;

  useEffect(() => {
    setDraft((prev) => {
      if (!dirtyRef.current) return questions;
      const fresh = new Map(questions.map((item) => [item.id, item]));
      return prev.map((item) => {
        const next = fresh.get(item.id);
        if (!next) return item;
        return {
          ...item,
          flagged_here: next.flagged_here,
          other_notes: next.other_notes,
          other_observations: next.other_observations,
        };
      });
    });
  }, [questions]);

  useEffect(() => {
    onDirty?.(dirty);
  }, [dirty, onDirty]);
  useEffect(() => () => onDirty?.(false), [onDirty]);

  async function saveDraft() {
    const changed = changedResponses(draft, questions);
    if (!changed.length) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const rows = await labApi.saveResponses(
        run.id,
        changed.map((item) => ({
          question_id: item.id,
          raw_value: item.raw_value,
          qualitative_confirmed: item.qualitative_confirmed,
          status: item.status,
        })),
      );
      setDraft(rows);
      onQuestions?.(rows);
    } catch {
      setSaveError('No pudimos completar esta acción.');
      throw new Error('save-failed');
    } finally {
      setSaving(false);
    }
  }

  if (saveRef) saveRef.current = saveDraft;
  if (discardRef) {
    discardRef.current = () => {
      setDraft(questions);
      setSaveError(null);
    };
  }

  const counts = useMemo(() => countResponses(draft), [draft]);
  const domains = useMemo(() => {
    const seen: string[] = [];
    for (const question of questions) {
      const key = question.domain ?? 'SIN ÁMBITO';
      if (!seen.includes(key)) seen.push(key);
    }
    return seen;
  }, [questions]);

  const display = useMemo(() => {
    const byId = new Map(draft.map((item) => [item.id, item]));
    return questions.map((question) => {
      const local = byId.get(question.id);
      if (!local) return question;
      return {
        ...question,
        raw_value: local.raw_value,
        status: local.status,
        answer_label: local.answer_label,
        answer_ordinal: local.answer_ordinal,
        flagged_here: question.flagged_here,
        other_notes: question.other_notes,
        other_observations: question.other_observations,
      };
    });
  }, [questions, draft]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return display.filter((question) => {
      if (domain !== 'todos') {
        const key = question.domain ?? 'SIN ÁMBITO';
        const purpose =
          key === 'PROPÓSITO' || key === 'PURPOSE' || key === 'PROPOSITO';
        const filterPurpose =
          domain === 'PROPÓSITO' || domain === 'PURPOSE' || domain === 'PROPOSITO';
        if (key !== domain && !(purpose && filterPurpose)) return false;
      }
      if (status === 'respondidas' && question.status !== 'ANSWERED') return false;
      if (status === 'sin-respuesta' && question.status !== 'UNANSWERED') return false;
      if (status === 'omitidas' && question.status !== 'SKIPPED_BY_USER') return false;
      if (status === 'marcadas' && !question.flagged_here) return false;
      if (status === 'seguridad' && !question.is_risk) return false;
      if (!term) return true;
      return (
        question.text.toLowerCase().includes(term) ||
        question.id.toLowerCase().includes(term) ||
        (question.dimension_label ?? '').toLowerCase().includes(term)
      );
    });
  }, [display, query, domain, status]);

  const groups = useMemo(() => {
    if (!grouped) return [{ key: 'ALL', label: 'Todas las respuestas', items: visible }];
    const order: string[] = [];
    const map = new Map<string, LabQuestion[]>();
    for (const question of visible) {
      const key = question.domain ?? 'SIN ÁMBITO';
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)?.push(question);
    }
    return order.map((key) => ({
      key,
      label: labUiLabels.domain(key),
      items: map.get(key) ?? [],
    }));
  }, [visible, grouped]);

  const frozen = run.status !== 'COLLECTING';
  const filling = Boolean(run.responses_editable && catalog && onQuestions);

  return (
    <div className={filling ? 'lab-stack lab-stack--tight lab-responses lab-responses--fill' : 'lab-stack lab-stack--tight lab-responses'}>
      {filling ? null : (
        <div className="lab-overview-block">
          {run.evidence ? (
            <LabCoverageStrip
              evidence={run.evidence}
              questions={display}
              selected={domain}
              onSelect={setDomain}
              firedSafetyIds={run.status === 'REVEALED' ? firedSafetyIds : []}
            />
          ) : (
            <>
              <p className="lab-muted">{describeResponseBuckets(counts)}.</p>
              <div className="lab-seg" role="group" aria-label="Ámbito">
                <button
                  type="button"
                  className={domain === 'todos' ? 'lab-chip is-active' : 'lab-chip'}
                  aria-pressed={domain === 'todos'}
                  onClick={() => setDomain('todos')}
                >
                  Todos
                </button>
                {domains.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={domain === item ? 'lab-chip is-active' : 'lab-chip'}
                    aria-pressed={domain === item}
                    onClick={() => setDomain(item)}
                  >
                    {labUiLabels.domain(item)}
                  </button>
                ))}
              </div>
            </>
          )}
          <p className="lab-hint">
            {factualCoverageCopy(
              resolveCaseCounts(display, run.evidence?.domains),
              run.status === 'REVEALED' ? firedSafetyIds?.length ?? 0 : 0,
              run.status === 'REVEALED',
            )}
            {run.status === 'REVEALED' && run.test_intent ? (
              <>
                {' '}
                Qué estamos probando con este caso: {run.test_intent}
              </>
            ) : null}
          </p>
        </div>
      )}

      {frozen ? (
        <p className="lab-lockbar">
          <AppIcon name="lock" size={14} />
          Este caso está cerrado. Las respuestas no se pueden modificar.
        </p>
      ) : null}

      {filling ? (
        <div className="lab-ctabar lab-ctabar--dock lab-ctabar--slim">
          <p className="lab-ctabar__note">
            Puedes guardar y seguir después. Las respuestas se cierran cuando tú lo decidas.
          </p>
          <button
            type="button"
            className="lab-btn"
            disabled={pending || saving}
            onClick={() => setConfirming(true)}
          >
            Cerrar respuestas y registrar mi criterio
          </button>
        </div>
      ) : (
        <div className={frozen ? 'lab-qbar' : 'lab-qbar lab-ctabar lab-ctabar--dock'}>
          <div className="lab-qbar__tools">
            <div className="lab-qbar__search">
              <input
                className="lab-input"
                type="search"
                value={query}
                placeholder="Buscar pregunta"
                aria-label="Buscar pregunta"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="lab-seg" role="group" aria-label="Estado de la respuesta">
              {STATUS_FILTERS.filter((item) => item.id !== 'marcadas' && item.id !== 'seguridad').map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={status === item.id ? 'lab-chip is-active' : 'lab-chip'}
                  aria-pressed={status === item.id}
                  onClick={() => setStatus(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="lab-seg" role="group" aria-label="Marcas">
              {STATUS_FILTERS.filter((item) => item.id === 'marcadas' || item.id === 'seguridad').map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={[
                    'lab-chip',
                    status === item.id ? 'is-active' : '',
                    item.id === 'seguridad' ? 'lab-chip--safety' : '',
                    item.id === 'seguridad' && (firedSafetyIds?.length ?? 0) > 0 ? 'is-fired' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={status === item.id}
                  onClick={() => setStatus(item.id)}
                >
                  {item.id === 'seguridad' ? <AppIcon name="shield" size={13} /> : null}
                  {item.label}
                </button>
              ))}
            </div>
            {frozen ? null : (
            <div className="lab-seg lab-view" role="group" aria-label="Vista">
              <span className="sr-only">Vista</span>
              <button
                type="button"
                className={grouped ? 'lab-chip is-active' : 'lab-chip'}
                aria-pressed={grouped}
                onClick={() => setGrouped(true)}
              >
                Por ámbito
              </button>
              <button
                type="button"
                className={!grouped ? 'lab-chip is-active' : 'lab-chip'}
                aria-pressed={!grouped}
                onClick={() => setGrouped(false)}
              >
                Lista
              </button>
            </div>
            )}
          </div>
          {frozen ? null : (
            <button
              type="button"
              className="lab-btn lab-ctabar__cta"
              disabled={pending || saving}
              onClick={() => setConfirming(true)}
            >
              Cerrar respuestas y registrar mi criterio
            </button>
          )}
        </div>
      )}

      {run.responses_editable && catalog && onQuestions ? (
        <>
          <Questionnaire
            run={run}
            questions={draft}
            catalog={catalog}
            dirty={dirty}
            saving={saving}
            onChange={setDraft}
            onSave={() => {
              void saveDraft().catch(() => undefined);
            }}
          />
        </>
      ) : null}
      {saveError ? (
        <p className="lab-error" role="alert">
          {saveError}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <div className="lab-empty">
          <p style={{ margin: 0 }}>Ninguna pregunta coincide con estos filtros.</p>
        </div>
      ) : null}

      {run.responses_editable ? (
        <details className="lab-details">
          <summary>Ver todas las respuestas</summary>
          <ResponseGroups
            groups={groups}
            run={run}
            firedSafetyIds={firedSafetyIds}
            onQuestions={onQuestions}
            itemTraces={itemTraces}
            onOpenWhy={onOpenWhy}
            onTryChange={onTryChange}
          />
          <ResponseTech run={run} visible={visible} />
        </details>
      ) : frozen ? (
        <>
          <div className="lab-actions">
            <button
              type="button"
              className="lab-btn lab-btn--ghost"
              onClick={() => {
                setExpandAll((value) => !value);
                setOpenDomain(null);
              }}
            >
              {expandAll ? 'Ver por ámbito' : 'Ver todas las respuestas'}
            </button>
          </div>
          {expandAll ? (
            <ResponseGroups
              groups={groups}
              run={run}
              firedSafetyIds={firedSafetyIds}
              onQuestions={onQuestions}
              itemTraces={itemTraces}
              onOpenWhy={onOpenWhy}
              onTryChange={onTryChange}
            />
          ) : (
            <FrozenAccordion
              groups={groups}
              run={run}
              questions={display}
              openDomain={openDomain}
              onOpenDomain={setOpenDomain}
              firedSafetyIds={firedSafetyIds}
              onQuestions={onQuestions}
              itemTraces={itemTraces}
              onOpenWhy={onOpenWhy}
              onTryChange={onTryChange}
            />
          )}
          <div className="lab-qtech">
            <ResponseTech run={run} visible={visible} />
          </div>
        </>
      ) : (
        <>
          <ResponseGroups
            groups={groups}
            run={run}
            firedSafetyIds={firedSafetyIds}
            onQuestions={onQuestions}
            itemTraces={itemTraces}
            onOpenWhy={onOpenWhy}
            onTryChange={onTryChange}
          />
          <div className="lab-qtech">
            <ResponseTech run={run} visible={visible} />
          </div>
        </>
      )}

      {confirming ? (
        <Modal
          title="¿Cerrar estas respuestas?"
          onClose={() => setConfirming(false)}
          actions={
            <>
              <button type="button" className="lab-btn lab-btn--ghost" onClick={() => setConfirming(false)}>
                Volver
              </button>
              <button
                type="button"
                className="lab-btn"
                disabled={pending}
                onClick={() => {
                  setConfirming(false);
                  if (dirty) {
                    void saveDraft()
                      .then(() => onFreeze())
                      .catch(() => undefined);
                    return;
                  }
                  onFreeze();
                }}
              >
                {dirty ? 'Guardar y cerrar respuestas' : 'Cerrar respuestas'}
              </button>
            </>
          }
        >
          <p className="lab-muted">
            {dirty
              ? 'Hay respuestas sin guardar. Se guardarán ahora y después se cerrarán. Ya no podrás modificarlas.'
              : 'Después de cerrarlas no se pueden modificar.'}
          </p>
          <p className="lab-muted">El resultado queda oculto hasta que registres tu criterio.</p>
        </Modal>
      ) : null}
    </div>
  );
}

function dimensionGroups(items: LabQuestion[]) {
  const groups: Array<{ label: string | null; items: LabQuestion[] }> = [];
  for (const question of items) {
    const label = question.dimension_label ?? null;
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(question);
    } else {
      groups.push({ label, items: [question] });
    }
  }
  return groups;
}

function ResponseGroups({
  groups,
  run,
  firedSafetyIds,
  onQuestions,
  itemTraces,
  onOpenWhy,
  onTryChange,
  embedded,
}: {
  groups: Array<{ key: string; label: string; items: LabQuestion[] }>;
  run: LabRunSummary;
  firedSafetyIds?: string[];
  onQuestions?: (next: LabQuestion[]) => void;
  itemTraces?: LabItemTrace[];
  onOpenWhy?: (domain: string) => void;
  onTryChange?: (preset: { kind: string; target_id: string; value: string }) => void;
  embedded?: boolean;
}) {
  return (
    <>
      {groups.map((group) => {
        const byDomain = group.key !== 'ALL';
        const chunks = byDomain ? dimensionGroups(group.items) : [{ label: null, items: group.items }];
        const body = chunks.map((chunk, index) => (
          <div key={`${group.key}-${index}-${chunk.label ?? 'none'}`} className="lab-qc-dimgroup">
            {byDomain && chunk.label ? (
              <h4 className="lab-qc-dim">{humanDimensionLabel(chunk.label)}</h4>
            ) : null}
            <div className="lab-qc-list">
              {chunk.items.map((question) => (
                <LabQuestionCard
                  key={question.id}
                  question={question}
                  runId={run.id}
                  revealed={run.status === 'REVEALED'}
                  fired={Boolean(firedSafetyIds?.includes(question.id)) && run.status === 'REVEALED'}
                  itemTrace={itemTraces?.find((item) => item.question_id === question.id) ?? null}
                  onOpenWhy={onOpenWhy}
                  onTryChange={onTryChange}
                  hideDomain={byDomain}
                  hideDimension={byDomain}
                  onReload={() => {
                    void labApi.responses(run.id).then((rows) => onQuestions?.(rows));
                  }}
                />
              ))}
            </div>
          </div>
        ));
        if (embedded) return <div key={group.key}>{body}</div>;
        return (
          <LabDomainSection
            key={group.key}
            domain={byDomain ? group.key : null}
            title={isPurposeDomain(group.key) ? 'Dirección' : group.label}
            count={group.items.length}
          >
            {body}
          </LabDomainSection>
        );
      })}
    </>
  );
}

function FrozenAccordion({
  groups,
  run,
  questions,
  openDomain,
  onOpenDomain,
  firedSafetyIds,
  onQuestions,
  itemTraces,
  onOpenWhy,
  onTryChange,
}: {
  groups: Array<{ key: string; label: string; items: LabQuestion[] }>;
  run: LabRunSummary;
  questions: LabQuestion[];
  openDomain: string | null;
  onOpenDomain: (key: string | null) => void;
  firedSafetyIds?: string[];
  onQuestions?: (next: LabQuestion[]) => void;
  itemTraces?: LabItemTrace[];
  onOpenWhy?: (domain: string) => void;
  onTryChange?: (preset: { kind: string; target_id: string; value: string }) => void;
}) {
  const counts = resolveCaseCounts(questions, run.evidence?.domains);
  const rows = groups.filter((group) => group.key !== 'ALL');
  const hasPurposeGroup = rows.some((group) => isPurposeDomain(group.key));
  return (
    <div className="lab-stack lab-stack--tight">
      {rows.map((group) => {
        const countRow = counts.domains.find((item) => item.domain === group.key);
        const title = isPurposeDomain(group.key) ? 'Dirección' : group.label;
        const line = isPurposeDomain(group.key)
          ? counts.purpose.answered
            ? `${counts.purpose.answered}/${counts.purpose.total}`
            : 'Sin información'
          : countRow
            ? formatDomainAccordionLine(countRow)
            : String(group.items.length);
        const open = openDomain === group.key;
        return (
          <section key={group.key} className="lab-qc-section">
            <button
              type="button"
              className="lab-qc-section__head"
              aria-expanded={open}
              onClick={() => onOpenDomain(open ? null : group.key)}
              style={{ width: '100%', cursor: 'pointer', background: 'none', border: 0, textAlign: 'left' }}
            >
              <span className="lab-qc-section__title">{title}</span>
              <span className="lab-qc-section__count">
                {line} {open ? 'Ocultar' : 'Ver'}
              </span>
            </button>
            {open ? (
              <ResponseGroups
                groups={[group]}
                run={run}
                firedSafetyIds={firedSafetyIds}
                onQuestions={onQuestions}
                itemTraces={itemTraces}
                onOpenWhy={onOpenWhy}
                onTryChange={onTryChange}
                embedded
              />
            ) : null}
          </section>
        );
      })}
      {!hasPurposeGroup ? (
        <section className="lab-qc-section">
          <div className="lab-qc-section__head">
            <h3 className="lab-qc-section__title">Dirección</h3>
            <span className="lab-qc-section__count">
              {counts.purpose.answered ? `${counts.purpose.answered}/${counts.purpose.total}` : 'Sin información'}
            </span>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ResponseTech({ run, visible }: { run: LabRunSummary; visible: LabQuestion[] }) {
  return (
    <Tech>
      <p className="lab-muted">
        Total: {run.answered} de {run.served}
      </p>
      {run.evidence
        ? run.evidence.domains.map((domain) => (
            <p key={domain.key} className="lab-muted">
              {labUiLabels.domain(domain.key)}: {domain.answered} de {domain.scoreable}, cobertura{' '}
              {Math.round(domain.coverage * 100)}%
            </p>
          ))
        : null}
      <table className="lab-table">
        <thead>
          <tr>
            <th>question_id</th>
            <th>dimension</th>
            <th>scale_id</th>
            <th>status</th>
            <th>raw</th>
            <th>weight</th>
            <th>active</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((question) => (
            <tr key={question.id}>
              <td className="lab-mono">{question.id}</td>
              <td className="lab-mono">{question.dimension ?? '—'}</td>
              <td className="lab-mono">{question.scale_id ?? '—'}</td>
              <td className="lab-mono">{question.status}</td>
              <td className="lab-mono">{question.raw_value ?? '—'}</td>
              <td className="lab-mono">{question.weight ?? '—'}</td>
              <td className="lab-mono">{String(question.active)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Tech>
  );
}
