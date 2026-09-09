'use client';

import { useEffect, useMemo, useState } from 'react';
import { DomainChip } from './domain-chip';
import type { LabCatalog, LabQuestion, LabRunSummary } from '@/lib/lab-api';
import { applyQuestionAnswer } from '@/lib/lab-ui/response-draft';
import { domainToken, humanDimensionLabel } from '@/lib/lab-ui/domain';
import { labUiLabels } from '@/lib/lab-ui/labels';
import {
  expandChoiceAnchors,
  filterDecimalInput,
  formatDecimal,
  isTypedScale,
  numberLayout,
  parseBoundedNumber,
  parseFieldMap,
  playKind,
  rangeHint,
  serializeFieldMap,
  type NumberFieldSpec,
  type NumberLayout,
} from '@/lib/lab-ui/play-scale';

export function Questionnaire({
  run,
  questions,
  catalog,
  dirty,
  saving,
  onChange,
  onSave,
}: {
  run: LabRunSummary;
  questions: LabQuestion[];
  catalog: LabCatalog | null;
  dirty: boolean;
  saving: boolean;
  onChange: (next: LabQuestion[]) => void;
  onSave: () => void;
}) {
  const phases = catalog?.questionnaire?.phases ?? [];
  const hybrid = phases.length > 0 && (run.case_kind === 'SELF' || run.case_kind === 'SIMULATION');
  const domains = catalog?.questionnaire?.domains ?? [];
  const [phase, setPhase] = useState(phases[0]?.key ?? 'auditoria');
  const [moduleKey, setModuleKey] = useState<string | null>(null);
  const [domain, setDomain] = useState(domains[0]?.key ?? questions[0]?.domain ?? 'MENTALIDAD');
  const [section, setSection] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const activePhase = phases.find((item) => item.key === phase) ?? phases[0] ?? null;
  const activeModule = activePhase?.modules?.find((item) => item.key === (moduleKey ?? activePhase.modules?.[0]?.key));
  const inDomain = useMemo(
    () => questions.filter((item) => (item.domain ?? '') === domain),
    [questions, domain],
  );
  const currentSection = section ?? domains.find((item) => item.key === domain)?.sections[0]?.key ?? null;
  const inSection = useMemo(() => {
    if (hybrid && activePhase) {
      const ids = new Set(activeModule?.question_ids ?? activePhase.question_ids);
      return questions.filter((item) => ids.has(item.id));
    }
    if (!currentSection) return inDomain;
    return inDomain.filter((item) => item.dimension === currentSection);
  }, [hybrid, activePhase, activeModule, questions, inDomain, currentSection]);
  const question = inSection[index] ?? inSection[0] ?? null;

  useEffect(() => {
    setIndex(0);
  }, [domain, currentSection, phase, moduleKey]);

  const editable = Boolean(run.responses_editable);

  function goForward() {
    if (index < inSection.length - 1) {
      setIndex(index + 1);
      return;
    }
    if (hybrid) {
      const mods = activePhase?.modules ?? [];
      const moduleAt = mods.findIndex((item) => item.key === activeModule?.key);
      for (let next = moduleAt + 1; next < mods.length; next += 1) {
        if (mods[next].question_ids.length) {
          setModuleKey(mods[next].key);
          return;
        }
      }
      const phaseAt = phases.findIndex((item) => item.key === phase);
      for (let next = phaseAt + 1; next < phases.length; next += 1) {
        if (phases[next].question_ids.length) {
          setPhase(phases[next].key);
          setModuleKey(phases[next].modules?.[0]?.key ?? null);
          return;
        }
      }
      return;
    }
    const domainMeta = domains.find((item) => item.key === domain);
    const sections = domainMeta?.sections ?? [];
    const sectionAt = sections.findIndex((item) => item.key === currentSection);
    if (sectionAt >= 0 && sectionAt < sections.length - 1) {
      setSection(sections[sectionAt + 1].key);
      return;
    }
    const domainAt = domains.findIndex((item) => item.key === domain);
    if (domainAt >= 0 && domainAt < domains.length - 1) {
      setDomain(domains[domainAt + 1].key);
      setSection(domains[domainAt + 1].sections[0]?.key ?? null);
    }
  }

  function setAnswer(raw: unknown, status?: string) {
    if (!question) return;
    const typed = isTypedScale(question);
    const advance = !typed && (status === 'SKIPPED_BY_USER' || question.status !== 'ANSWERED');
    onChange(questions.map((item) => (item.id === question.id ? applyQuestionAnswer(item, raw, status) : item)));
    if (advance) goForward();
  }

  const canGoNext = canAdvanceFromEnd(
    index,
    inSection.length,
    hybrid,
    phases,
    phase,
    domains,
    domain,
    currentSection,
    activePhase,
    activeModule,
  );

  return (
    <div className="lab-qplay">
      {hybrid ? (
        <div className="lab-seg lab-qprog" role="tablist" aria-label="Sección">
          {phases.map((item) => {
            const rows = questions.filter((row) => item.question_ids.includes(row.id));
            const done = rows.filter((row) => row.status === 'ANSWERED').length;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={item.key === phase}
                className={item.key === phase ? 'lab-chip is-active' : 'lab-chip'}
                onClick={() => {
                  setPhase(item.key);
                  setModuleKey(item.modules?.[0]?.key ?? null);
                }}
              >
                {item.chip} {done}/{item.question_ids.length}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="lab-seg lab-qprog" role="tablist" aria-label="Ámbito">
          {domains.map((item) => {
            const token = domainToken(item.key);
            const rows = questions.filter((row) => row.domain === item.key);
            const done = rows.filter((row) => row.status === 'ANSWERED').length;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={item.key === domain}
                className={item.key === domain ? 'lab-chip is-active' : 'lab-chip'}
                onClick={() => {
                  setDomain(item.key);
                  setSection(item.sections[0]?.key ?? null);
                }}
              >
                {token ? <DomainChip domain={item.key} compact /> : null}
                {labUiLabels.domain(item.key)} {done}/{item.total}
              </button>
            );
          })}
        </div>
      )}

      {hybrid && activePhase ? (
        <div className="lab-qplay__intro">
          <h2 className="lab-h2">{activePhase.title}</h2>
          {activePhase.help ? <p className="lab-hint">{activePhase.help}</p> : null}
          {activePhase.modules ? (
            <>
              <p className="lab-hint">
                Para estudiar Dirección hacen falta al menos: Visión, Valores, Estándares, Identidad. Origen,
                Interferencia, Integración, Tendencias, Hipótesis, Contraste y Huella son opcionales en un caso de
                prueba.
              </p>
              <div className="lab-seg">
                {activePhase.modules.map((item) => {
                  const done = questions.filter((row) => item.question_ids.includes(row.id) && row.status === 'ANSWERED')
                    .length;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={item.key === activeModule?.key ? 'lab-chip is-active' : 'lab-chip'}
                      onClick={() => setModuleKey(item.key)}
                    >
                      {item.name} {done}/{item.question_ids.length}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      ) : domains.length ? (
        <div className="lab-seg">
          {(domains.find((item) => item.key === domain)?.sections ?? []).map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.key === currentSection ? 'lab-chip is-active' : 'lab-chip'}
              onClick={() => setSection(item.key)}
            >
              {humanDimensionLabel(item.label)}
            </button>
          ))}
        </div>
      ) : null}

      {question ? (
        <QuestionPlay question={question} editable={editable} onChange={setAnswer} />
      ) : (
        <div className="lab-qplay__item">
          <p className="lab-qplay__dim">{'\u00a0'}</p>
          <p className="lab-qplay__q lab-muted">No hay preguntas en esta sección.</p>
          <div className="lab-qplay__choices" />
        </div>
      )}

      <div className="lab-qnav">
        <button
          type="button"
          className="lab-btn lab-btn--ghost"
          disabled={index <= 0}
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
        >
          Anterior
        </button>
        {editable ? (
          <button
            type="button"
            className="lab-btn lab-btn--ghost"
            disabled={!question}
            onClick={() => setAnswer(null, 'SKIPPED_BY_USER')}
          >
            Omitir
          </button>
        ) : (
          <span className="lab-qnav__slot" aria-hidden />
        )}
        <button type="button" className="lab-btn lab-btn--ghost" disabled={!canGoNext} onClick={goForward}>
          Siguiente
        </button>
        <span className="lab-muted lab-qnav__count">
          {Math.min(index + 1, inSection.length || 1)} de {inSection.length || 1}
        </span>
        {editable ? (
          <>
            <p className="lab-save" role="status">
              {saving ? 'Guardando…' : dirty ? 'Hay cambios sin guardar.' : '\u00a0'}
            </p>
            <button type="button" className="lab-btn lab-btn--ghost" disabled={!dirty || saving} onClick={onSave}>
              Guardar respuestas
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function canAdvanceFromEnd(
  index: number,
  sectionLength: number,
  hybrid: boolean,
  phases: Array<{ key: string; question_ids: string[]; modules?: Array<{ key: string; question_ids: string[] }> }>,
  phase: string,
  domains: Array<{ key: string; sections: Array<{ key: string }> }>,
  domain: string,
  currentSection: string | null,
  activePhase: { modules?: Array<{ key: string; question_ids: string[] }> } | null,
  activeModule: { key: string } | undefined,
) {
  if (index < sectionLength - 1) return true;
  if (hybrid) {
    const mods = activePhase?.modules ?? [];
    const moduleAt = mods.findIndex((item) => item.key === activeModule?.key);
    if (mods.slice(moduleAt + 1).some((item) => item.question_ids.length)) return true;
    const phaseAt = phases.findIndex((item) => item.key === phase);
    return phases.slice(phaseAt + 1).some((item) => item.question_ids.length);
  }
  const domainMeta = domains.find((item) => item.key === domain);
  const sections = domainMeta?.sections ?? [];
  const sectionAt = sections.findIndex((item) => item.key === currentSection);
  if (sectionAt >= 0 && sectionAt < sections.length - 1) return true;
  const domainAt = domains.findIndex((item) => item.key === domain);
  return domainAt >= 0 && domainAt < domains.length - 1;
}

function QuestionPlay({
  question,
  editable,
  onChange,
}: {
  question: LabQuestion;
  editable: boolean;
  onChange: (raw: unknown, status?: string) => void;
}) {
  const typed = isTypedScale(question);
  const kind = playKind(question);
  const layout = kind === 'NUMBER' ? numberLayout(question) : null;
  const anchors = expandChoiceAnchors(question.scale);
  const pad = typed ? 0 : Math.max(0, 5 - anchors.length);
  const rawText =
    typeof question.raw_value === 'string' || typeof question.raw_value === 'number'
      ? String(question.raw_value ?? '')
      : '';
  return (
    <div className={typed ? 'lab-qplay__item is-typed' : 'lab-qplay__item'}>
      <p className="lab-qplay__dim">
        {question.dimension_label ? humanDimensionLabel(question.dimension_label) : '\u00a0'}
      </p>
      <p className="lab-qplay__q">{question.text}</p>
      {!editable ? (
        <div className="lab-qplay__choices">
          <p className="lab-muted">{question.answer_label ?? labUiLabels.responseStatus(question.status)}</p>
        </div>
      ) : layout ? (
        <div className="lab-qplay__choices">
          <NumericAnswer question={question} layout={layout} onChange={onChange} />
        </div>
      ) : typed ? (
        <div className="lab-qplay__choices">
          <textarea
            className="lab-textarea lab-qplay__text"
            value={rawText}
            onChange={(event) => onChange(event.target.value.trim() ? event.target.value : null)}
          />
        </div>
      ) : (
        <div className="lab-qplay__choices">
          <div className="lab-scale" role="radiogroup" aria-label="Respuesta">
            {anchors.map((anchor) => (
              <button
                key={String(anchor.value ?? anchor.label)}
                type="button"
                className={String(question.raw_value) === String(anchor.value) ? 'lab-scale__opt is-active' : 'lab-scale__opt'}
                aria-pressed={String(question.raw_value) === String(anchor.value)}
                onClick={() => onChange(anchor.value)}
              >
                {anchor.label}
              </button>
            ))}
            {Array.from({ length: pad }, (_, slot) => (
              <span key={`pad-${slot}`} className="lab-scale__opt is-pad" aria-hidden />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NumericAnswer({
  question,
  layout,
  onChange,
}: {
  question: LabQuestion;
  layout: NumberLayout;
  onChange: (raw: unknown, status?: string) => void;
}) {
  if (layout.type === 'single') {
    return (
      <SingleNumberField
        questionId={question.id}
        value={typeof question.raw_value === 'number' ? question.raw_value : null}
        layout={layout}
        onChange={onChange}
      />
    );
  }
  return (
    <NumberFields
      questionId={question.id}
      raw={question.raw_value}
      fields={layout.fields}
      onChange={onChange}
    />
  );
}

function SingleNumberField({
  questionId,
  value,
  layout,
  onChange,
}: {
  questionId: string;
  value: number | null;
  layout: Extract<NumberLayout, { type: 'single' }>;
  onChange: (raw: unknown) => void;
}) {
  const [text, setText] = useState(() => (value == null ? '' : formatDecimal(value)));
  useEffect(() => {
    setText(value == null ? '' : formatDecimal(value));
  }, [questionId]);
  const parsed = parseBoundedNumber(text, layout.min, layout.max);
  const invalid = text.trim() !== '' && parsed == null;
  return (
    <label className="lab-qnum">
      <span className="lab-qnum__row">
        <input
          className="lab-input lab-qplay__value"
          type="text"
          inputMode={layout.integers ? 'numeric' : 'decimal'}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${questionId}-range` : undefined}
          value={text}
          onChange={(event) => {
            const next = filterDecimalInput(event.target.value, layout.integers);
            setText(next);
            if (!next) {
              onChange(null);
              return;
            }
            const value = parseBoundedNumber(next, layout.min, layout.max);
            if (value != null) onChange(value);
          }}
        />
        {layout.unit ? <span className="lab-qnum__unit">{layout.unit}</span> : null}
      </span>
      {invalid ? (
        <span id={`${questionId}-range`} className="lab-qnum__hint">
          {rangeHint(layout.min, layout.max, layout.unit)}
        </span>
      ) : null}
    </label>
  );
}

function NumberFields({
  questionId,
  raw,
  fields,
  onChange,
}: {
  questionId: string;
  raw: unknown;
  fields: NumberFieldSpec[];
  onChange: (raw: unknown) => void;
}) {
  const [draft, setDraft] = useState(() => hydrateFields(fields, raw));
  useEffect(() => {
    setDraft(hydrateFields(fields, raw));
  }, [questionId]);
  return (
    <div className="lab-qnums">
      {fields.map((field) => {
        const text = draft[field.key] ?? '';
        const invalid = text.trim() !== '' && parseBoundedNumber(text, field.min, field.max) == null;
        return (
          <label key={field.key} className="lab-qnum">
            <span className="lab-qnum__label">
              {field.label}
              {field.optional ? ' (opcional)' : ''}
            </span>
            <span className="lab-qnum__row">
              <input
                className="lab-input lab-qplay__value"
                type="text"
                inputMode={field.integers ? 'numeric' : 'decimal'}
                aria-invalid={invalid}
                value={text}
                onChange={(event) => {
                  const next = { ...draft, [field.key]: filterDecimalInput(event.target.value, field.integers) };
                  setDraft(next);
                  onChange(serializeFieldMap(fields, next));
                }}
              />
              <span className="lab-qnum__unit">{field.unit}</span>
            </span>
            {invalid ? <span className="lab-qnum__hint">{rangeHint(field.min, field.max, field.unit)}</span> : null}
          </label>
        );
      })}
    </div>
  );
}

function hydrateFields(fields: NumberFieldSpec[], raw: unknown): Record<string, string> {
  const values = parseFieldMap(raw);
  const draft: Record<string, string> = {};
  for (const field of fields) {
    draft[field.key] = values[field.key] == null ? '' : formatDecimal(values[field.key]);
  }
  return draft;
}
