'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { LineField, MeasureField, QuestionDto } from '@/lib/api';
import { ArchetypeChoices, isArchetypeChoice } from './options/ArchetypeChoices';
import { ArchetypeOriginPicker, archetypeSlugFromStored } from './options/ArchetypeOriginPicker';
import { optionListItem, reasonBoxVariants } from './diagnostic-motion';
import { FreeTextOption } from './options/FreeTextOption';
import { MultiChoiceOptions } from './options/MultiChoiceOptions';
import { ScaleOptions } from './options/ScaleOptions';
import { ageInYears, birthdateBounds } from '@/lib/birthdate';
import { activityGuide } from '@/lib/activity-guide';
import { activitySlot, type ActivityCounts } from '@/lib/activity-map';
import type { IkigaiFieldKey } from '@/lib/ikigai-api';
import { COVERAGE_LABELS } from '@/lib/ikigai-ui/format';
import { DiagnosticIkigaiMap } from './DiagnosticIkigaiMap';
import { scalePromptFor } from '@/lib/scale-prompts';
import { questionSectionHeading, shadowHeading } from './section-copy';
import { SingleChoiceOptions } from './options/SingleChoiceOptions';

type SelectionState =
  | { type: 'single'; selected: string | null }
  | { type: 'multi'; selected: string[] }
  | { type: 'scale'; selected: string | null; selectedOrder: number | null; reason: string }
  | { type: 'text'; value: string }
  | { type: 'ranking'; order: string[] }
  | { type: 'exception'; kind: 'UNKNOWN' | 'NOT_APPLICABLE' | 'DECLINED' };

type Props = {
  question: QuestionDto;
  selection: SelectionState;
  onChange: (next: SelectionState) => void;
  /** While a save is in flight the draft stays visible and cannot change. */
  locked?: boolean;
  moduleTitle?: string | null;
  questionIndex?: number | null;
  questionTotal?: number | null;
  ikigaiMap?: { focus: IkigaiFieldKey; counts: ActivityCounts; reached: IkigaiFieldKey[]; ideas: string[] } | null;
};

const CAPTURES_WITHOUT_MEMBER_HINT = new Set([
  'measures',
  'lines',
  'hours',
  'birthdate',
  'number',
  'activity',
  'ikigai',
  'archetype',
]);

const COACH_ONLY_HINTS = new Set(['Registre respuesta', 'Respuesta libre']);

function memberHintFor(question: QuestionDto): string | null {
  const text = question.contextEs?.trim();
  if (!text || question.type !== 'FREE_TEXT') return null;
  if (COACH_ONLY_HINTS.has(text)) return null;
  const kind = question.capture?.kind;
  if (kind && CAPTURES_WITHOUT_MEMBER_HINT.has(kind)) return null;
  return text;
}

const MEASURE_PICKERS: Record<string, {
  label: string;
  unit: string;
  low: number;
  high: number;
  step?: number;
  empty: string;
  hint: string;
}> = {
  'formulario-v1:F-RAD-001!R8': { label: 'Altura en cm', unit: 'cm', low: 150, high: 210, empty: 'Elige la altura', hint: 'Elige la altura en cm para continuar.' },
  'formulario-v1:F-RAD-001!R9': { label: 'Peso en kg', unit: 'kg', low: 45, high: 150, empty: 'Elige el peso', hint: 'Elige el peso en kg para continuar.' },
  'formulario-v1:F-RAD-001!R10': { label: 'Grasa corporal en porcentaje', unit: '%', low: 5, high: 50, empty: 'Elige el porcentaje', hint: 'Elige el porcentaje para continuar.' },
  'formulario-v1:F-RAD-001!R11': { label: 'Cintura en cm', unit: 'cm', low: 60, high: 140, empty: 'Elige la cintura', hint: 'Elige la cintura en cm para continuar.' },
  'formulario-v1:F-RAD-001!R26': { label: 'Nivel de dolor', unit: '', low: 0, high: 10, empty: 'Elige el nivel', hint: 'Elige el nivel para continuar.' },
  'formulario-v1:F-RAD-001!R35': { label: 'Comidas al día', unit: '', low: 1, high: 8, empty: 'Elige la cantidad', hint: 'Elige cuántas comidas para continuar.' },
  'formulario-v1:F-RAD-001!R53': { label: 'Minutos por sesión', unit: 'min', low: 15, high: 180, step: 5, empty: 'Elige los minutos', hint: 'Elige los minutos para continuar.' },
  'formulario-v1:F-RAD-001!R61': { label: 'Horas de sueño', unit: 'horas', low: 4, high: 12, empty: 'Elige las horas', hint: 'Elige las horas para continuar.' },
};

function shadowNote(note: string): string {
  const text = note.trim();
  if (!text) return '';
  return text.charAt(0).toLocaleUpperCase('es') + text.slice(1);
}

function shadowReading(detail: string): { status: string; note: string; empty: boolean } {
  const text = detail.trim();
  if (/^sin desarrollo$/i.test(text)) return { status: 'Sin desarrollo', note: '', empty: true };
  const colon = text.indexOf(':');
  if (colon > 0 && colon < 42) {
    return { status: text.slice(0, colon).trim(), note: shadowNote(text.slice(colon + 1)), empty: false };
  }
  const period = text.indexOf('. ');
  if (period > 0 && period < 48) {
    return { status: text.slice(0, period).trim(), note: shadowNote(text.slice(period + 2)), empty: false };
  }
  return { status: text, note: '', empty: false };
}

function shadowFamily(label: string): { mark: string; title: string; quote: string } | null {
  const match = label.match(/^([A-E])\.\s+(.+?)(?::\s*«([^»]+)»)?$/);
  if (!match) return null;
  return { mark: match[1] ?? '', title: (match[2] ?? '').trim(), quote: (match[3] ?? '').trim() };
}

function shadowName(value: string): string {
  return value.toLocaleLowerCase('es').replace(/\s+/g, ' ').trim();
}

const AMBIT_ALIAS: Record<string, string> = {
  'autoridad y entorno': 'autoridad',
  'idolatría (sombra dorada)': 'idolatría',
  'poder personal': 'reclamar talentos',
  'compasión y flexibilidad': 'gestión del error',
};

export function ShadowResult({
  lines,
  currentAmbit = null,
  showNotes = false,
}: {
  lines: { label: string; detail: string }[];
  currentAmbit?: string | null;
  showNotes?: boolean;
}) {
  const family = lines.find((row) => shadowFamily(row.label));
  const overall = lines.find((row) => row.label === 'Diagnóstico sombra');
  const ambits = lines.filter((row) => row !== family && row !== overall);
  const familyShape = family ? shadowFamily(family.label) : null;
  const familyReading = family ? shadowReading(family.detail) : null;
  const overallReading = overall ? shadowReading(overall.detail) : null;
  const current = currentAmbit ? AMBIT_ALIAS[shadowName(currentAmbit)] ?? shadowName(currentAmbit) : '';

  return (
    <section className="dk-shadow-result" aria-label="Resultado">
      {overall && overallReading ? (
        <div className="dk-shadow-overall">
          <p className="dk-shadow-overall__kicker">Diagnóstico sombra</p>
          <h3>{overallReading.status}</h3>
          {overallReading.note ? <p>{overallReading.note}</p> : null}
        </div>
      ) : null}
      <p className="dk-shadow-result__title">Resultado</p>
      <div className="dk-shadow-board">
        {family && familyShape && familyReading ? (
          <div className="dk-shadow-row dk-shadow-row--lead">
            <p className="dk-shadow-name">{familyShape.quote || `${familyShape.mark}. ${familyShape.title}`}</p>
            <p className={familyReading.empty ? 'dk-shadow-status dk-shadow-status--empty' : 'dk-shadow-status'}>{familyReading.status}</p>
            {showNotes && familyReading.note ? <p className="dk-shadow-note">{familyReading.note}</p> : null}
          </div>
        ) : null}
        {ambits.map((row) => {
          const reading = shadowReading(row.detail);
          const open = showNotes || (current !== '' && shadowName(row.label) === current);
          return (
            <div key={row.label} className="dk-shadow-row">
              <p className="dk-shadow-name">{row.label}</p>
              <p className={reading.empty ? 'dk-shadow-status dk-shadow-status--empty' : 'dk-shadow-status'}>{reading.status}</p>
              {open && reading.note ? <p className="dk-shadow-note">{reading.note}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function FactorResult({ lines }: { lines: { label: string; detail: string }[] }) {
  return (
    <section className="dk-shadow-result" aria-label="Resultado general">
      <p className="dk-shadow-result__title">Resultado general</p>
      <div className="dk-shadow-board">
        {lines.map((row) => (
          <div key={row.label} className="dk-shadow-row dk-shadow-row--stack">
            <p className="dk-shadow-name">{row.label}</p>
            <p className={row.detail === 'Sin desarrollo' ? 'dk-shadow-note dk-shadow-status--empty' : 'dk-shadow-note'}>{row.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function QuestionCard({
  question,
  selection,
  onChange,
  locked = false,
  moduleTitle,
  questionIndex,
  questionTotal,
  ikigaiMap,
}: Props) {
  const reduced = useReducedMotion();
  useEffect(() => {
    document.getElementById('dk-question-title')?.focus();
  }, [question.id]);
  function emit(next: SelectionState) {
    if (locked) return;
    onChange(next);
  }
  const scalePrompt = question.type === 'SCALE_1_5' ? scalePromptFor(question.sourceRef) : null;
  const guide = question.capture?.kind === 'activity' ? activityGuide(question.textEs) : null;
  const slot = question.capture?.kind === 'activity' ? activitySlot(question.sourceRef) : null;
  const questionTitle = question.capture?.kind === 'birthdate'
    ? 'Fecha de nacimiento'
    : guide?.prompt ?? (slot && /^Actividad \d+ de /i.test(question.textEs) ? slot.prompt : null) ?? scalePrompt?.stem ?? question.textEs;
  const sectionHeading = questionSectionHeading(question.sourceRef) ?? question.heading;
  const shadow = shadowHeading(sectionHeading);
  const memberHint = memberHintFor(question);
  const stem = questionTitle.replace(/^(?:PR|ER|PY|IN|D)\d+\.\s+/, '');

  const showReasonBox =
    question.type === 'SCALE_1_5' &&
    question.reasonThreshold != null &&
    question.reasonPromptEs != null &&
    selection.type === 'scale' &&
    selection.selectedOrder != null &&
    selection.selectedOrder <= question.reasonThreshold;

  const showLocalCount = questionIndex != null && questionTotal != null && questionTotal > 0;
  const scaleChoice = selection.type === 'scale' && selection.selectedOrder != null ? selection.selectedOrder : null;

  return (
    <div className={`dk-question${question.sourceRef && MEASURE_PICKERS[question.sourceRef] ? ' dk-question--measure' : ''}${question.capture?.kind === 'archetype' ? ' dk-question--archetype' : ''}${ikigaiMap ? ' ik-explore' : ''}`}>
      {ikigaiMap ? (
        <DiagnosticIkigaiMap focus={ikigaiMap.focus} counts={ikigaiMap.counts} reached={ikigaiMap.reached} />
      ) : null}
      <div className={ikigaiMap ? 'ik-create' : 'dk-read'}>
      {(moduleTitle || showLocalCount) && (
        <div className="dk-read__meta">
          {moduleTitle ? <p className="dk-read__module">{moduleTitle}</p> : <span />}
          {showLocalCount ? (
            <p className="dk-read__count" aria-label={`Pregunta ${questionIndex} de ${questionTotal}`}>
              {questionIndex} / {questionTotal}
            </p>
          ) : null}
        </div>
      )}
      <div className="dk-question__lead">
        {ikigaiMap ? (
          <p className="ik-create__lens">
            {COVERAGE_LABELS[ikigaiMap.focus]}
            <span>{slot ? `${slot.index} de ${slot.total}` : ''}</span>
          </p>
        ) : null}
        {shadow ? (
          <>
            <p className="dk-question-context">{shadow.family}</p>
            <p className="dk-question-ambit">{shadow.ambit}</p>
          </>
        ) : sectionHeading ? <p className="dk-question-context">{sectionHeading}</p> : null}
        <h2 id="dk-question-title" tabIndex={-1} className={ikigaiMap ? 'ik-question font-body' : 'dk-question-text'}>{stem}</h2>
        {memberHint ? <p className="dk-question-context">{memberHint}</p> : null}
        {slot ? (
          <p className="dk-question-context">
            {slot.index === 1
              ? 'Al menos una, hasta 5.'
              : 'Otra, si tienes, hasta 5. Si no, elige No puedo responder ahora.'}
          </p>
        ) : null}
        {guide && guide.help.length > 0 ? (
          <details className={ikigaiMap ? 'ik-help' : 'dk-ik-help'}>
            <summary>Ver ayuda</summary>
            {guide.helpLead ? <p>{guide.helpLead}</p> : null}
            <ul>
              {guide.help.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </details>
        ) : null}
        {guide && guide.examples.length > 0 ? (
          <details className={ikigaiMap ? 'ik-help' : 'dk-ik-help'}>
            <summary>Ver ejemplos</summary>
            <ul className="dk-ik-examples">
              {guide.examples.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </details>
        ) : null}
        {question.type === 'MULTI_CHOICE' &&
          question.maxSelections != null &&
          selection.type === 'multi' && (
            <p
              className="dk-multi-counter"
              aria-label={`${selection.selected.length} de ${question.maxSelections} seleccionadas`}
            >
              {selection.selected.length} de {question.maxSelections}
            </p>
          )}
      </div>

      <fieldset className="dk-question__answers" disabled={locked}>
        {question.type === 'SINGLE_CHOICE' && selection.type === 'single' && isArchetypeChoice(question.options) && (
          <ArchetypeChoices
            options={question.options}
            selected={selection.selected}
            onSelect={(id) => emit({ type: 'single', selected: id })}
          />
        )}

        {question.type === 'SINGLE_CHOICE' && selection.type === 'single' && !isArchetypeChoice(question.options) && (
          <SingleChoiceOptions
            options={question.options}
            selected={selection.selected}
            figures={question.sourceRef === 'formulario-v1:F-RAD-001!R7'}
            onSelect={(id) => emit({ type: 'single', selected: id })}
          />
        )}

        {question.type === 'MULTI_CHOICE' && selection.type === 'multi' && (
          <MultiChoiceOptions
            options={question.options}
            selected={selection.selected}
            maxSelections={question.maxSelections}
            onToggle={(id) => {
              const current = selection.selected;
              const next = current.includes(id)
                ? current.filter((s) => s !== id)
                : [...current, id];
              emit({ type: 'multi', selected: next });
            }}
          />
        )}

        {question.type === 'SCALE_1_5' && selection.type === 'scale' && (
          <>
            <ScaleOptions
              options={question.options}
              selected={selection.selected}
              scaleType={question.scaleType}
              prompt={scalePrompt}
              onSelect={(id) => {
                const opt = question.options.find((o) => o.id === id);
                emit({
                  type: 'scale',
                  selected: id,
                  selectedOrder: opt?.order ?? null,
                  reason: selection.reason,
                });
              }}
            />
            <AnimatePresence initial={false}>
              {showReasonBox && (
                <motion.div
                  key="reason"
                  className="dk-reason-box"
                  variants={reduced ? undefined : reasonBoxVariants}
                  initial={reduced ? false : 'hidden'}
                  animate={reduced ? undefined : 'visible'}
                  exit={reduced ? undefined : 'hidden'}
                  style={{ overflow: 'hidden' }}
                >
                  <label className="dk-reason-label" htmlFor="dk-reason-input">
                    {question.reasonPromptEs}
                  </label>
                  <textarea
                    id="dk-reason-input"
                    className="dk-reason-textarea"
                    value={selection.reason}
                    onChange={(e) =>
                      emit({
                        ...selection,
                        reason: e.target.value,
                      })
                    }
                    maxLength={500}
                    rows={3}
                    placeholder="Escribe tu respuesta, si quieres."
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && question.capture?.kind === 'measures' && (
          <MeasuresFields
            fields={question.capture.fields}
            value={selection.value}
            onChange={(value) => emit({ type: 'text', value })}
          />
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && question.capture?.kind === 'lines' && (
          <LinesFields
            fields={question.capture.fields}
            value={selection.value}
            onChange={(value) => emit({ type: 'text', value })}
          />
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && question.capture?.kind === 'hours' && (
          question.sourceRef && MEASURE_PICKERS[question.sourceRef] ? (
            <MeasurePicker
              spec={MEASURE_PICKERS[question.sourceRef]}
              floor={question.capture.min}
              ceiling={question.capture.max}
              value={selection.value}
              onChange={(value) => emit({ type: 'text', value })}
            />
          ) : (
            <HoursField
              min={question.capture.min}
              max={question.capture.max}
              value={selection.value}
              onChange={(value) => emit({ type: 'text', value })}
            />
          )
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && question.capture?.kind === 'birthdate' && (
          <BirthdateField
            minAge={question.capture.minAge}
            maxAge={question.capture.maxAge}
            value={selection.value}
            onChange={(value) => emit({ type: 'text', value })}
          />
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && question.capture?.kind === 'number' && (
          question.sourceRef && MEASURE_PICKERS[question.sourceRef] ? (
            <MeasurePicker
              spec={MEASURE_PICKERS[question.sourceRef]}
              floor={question.capture.min}
              ceiling={question.capture.max}
              value={selection.value}
              onChange={(value) => emit({ type: 'text', value })}
            />
          ) : (
            <NumberField
              unit={question.capture.unit}
              min={question.capture.min}
              max={question.capture.max}
              value={selection.value}
              onChange={(value) => emit({ type: 'text', value })}
            />
          )
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && question.capture?.kind === 'activity' && (
          <>
            <ActivityField
              ambits={question.capture.ambits ?? []}
              answerLabel={guide?.close || 'La actividad es'}
              value={selection.value}
              onChange={(value) => emit({ type: 'text', value })}
            />
            {ikigaiMap && ikigaiMap.ideas.length > 0 ? (
              <div className="ik-create__own">
                {ikigaiMap.ideas.map((idea) => <p key={idea} className="ik-text">{idea}</p>)}
              </div>
            ) : null}
          </>
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && question.capture?.kind === 'ikigai' && (
          <IkigaiField
            others={question.capture.others}
            value={selection.value}
            onChange={(value) => emit({ type: 'text', value })}
          />
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && question.capture?.kind === 'archetype' && (
          <ArchetypeOriginPicker
            value={selection.value}
            onChange={(slug) => emit({ type: 'text', value: slug })}
          />
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && !question.capture && (
          <motion.div
            className="dk-free-text"
            variants={reduced ? undefined : optionListItem}
            initial={reduced ? false : 'hidden'}
            animate={reduced ? undefined : 'show'}
          >
            <FreeTextOption
              value={selection.value}
              onChange={(v) => emit({ type: 'text', value: v })}
            />
          </motion.div>
        )}

        {scaleChoice != null ? <p className="dk-read__choice">Tu respuesta: {scaleChoice}</p> : null}
        {!isSelectionValid(question, selection) ? (
          <p id="dk-continue-hint" className="dk-continue-hint">{continueHint(question)}</p>
        ) : null}
      </fieldset>
      </div>
      {!mustAnswer(question) && selection.type !== 'exception' && (question.allowedExceptions?.length ?? 0) > 0 && (
        <details className="dk-exceptions">
          <summary
            onClick={(event) => {
              if (locked) event.preventDefault();
            }}
          >
            No puedo responder ahora
          </summary>
          <div className="dk-exceptions__row">
            {question.allowedExceptions?.filter((kind) => kind !== 'PENDING').map((kind) => (
              <button
                key={kind}
                type="button"
                className="dk-exception"
                disabled={locked}
                onClick={() => emit({ type: 'exception', kind: kind as 'UNKNOWN' | 'NOT_APPLICABLE' | 'DECLINED' })}
              >
                {EXCEPTION_LABELS[kind] ?? kind}
              </button>
            ))}
          </div>
        </details>
      )}
      {!mustAnswer(question) && selection.type === 'exception' && (
        <div className="dk-exception-chosen" role="status">
          <p>Elegiste: {EXCEPTION_LABELS[selection.kind]}.</p>
          <button type="button" className="dk-exception" disabled={locked} onClick={() => emit(buildInitialSelection(question))}>
            Responder con un dato
          </button>
        </div>
      )}
      {question.type === 'RANKING' && (
        <motion.p
          className="font-body-sm"
          style={{ color: 'var(--color-text-muted)' }}
          variants={reduced ? undefined : optionListItem}
          initial={reduced ? false : 'hidden'}
          animate={reduced ? undefined : 'show'}
        >
          (Ranking: disponible en M1)
        </motion.p>
      )}
    </div>
  );
}

/** Build initial selection state from question type */
export function buildInitialSelection(question: QuestionDto): SelectionState {
  switch (question.type) {
    case 'SINGLE_CHOICE':
      return { type: 'single', selected: null };
    case 'MULTI_CHOICE':
      return { type: 'multi', selected: [] };
    case 'SCALE_1_5':
      return { type: 'scale', selected: null, selectedOrder: null, reason: '' };
    case 'FREE_TEXT':
      return { type: 'text', value: '' };
    case 'RANKING':
      return { type: 'ranking', order: question.options.map((o) => o.id) };
  }
}

function readMeasures(value: string): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
  } catch {
    return {};
  }
  return {};
}

function textAnswerReady(question: QuestionDto, value: string): boolean {
  if (question.capture?.kind === 'birthdate') {
    const age = ageInYears(value);
    return age != null && age >= question.capture.minAge && age <= question.capture.maxAge;
  }
  if (question.capture?.kind === 'number') {
    if (value === '') return false;
    const amount = Number(value);
    return Number.isFinite(amount) && amount >= question.capture.min && amount <= question.capture.max;
  }
  if (question.capture?.kind === 'activity') {
    try {
      const parsed = JSON.parse(value) as { ambit?: string; option?: string; answer?: string };
      const match = question.capture.ambits?.find((item) => item.label === parsed.ambit);
      return Boolean(parsed.answer?.trim() && match?.options.includes(parsed.option ?? ''));
    } catch {
      return false;
    }
  }
  if (question.capture?.kind === 'ikigai') {
    try {
      const parsed = JSON.parse(value) as { activity?: string; also?: string[] };
      return Boolean(parsed.activity?.trim()) && Array.isArray(parsed.also);
    } catch {
      return false;
    }
  }
  if (question.capture?.kind === 'hours') {
    if (value === '') return false;
    const hours = Number(value);
    return Number.isInteger(hours) && hours >= question.capture.min && hours <= question.capture.max;
  }
  if (question.capture?.kind === 'lines') {
    const data = readMeasures(value);
    return question.capture.fields.every((field) => (data[field.key] ?? '').trim().length > 0);
  }
  if (question.capture?.kind === 'measures') {
    const data = readMeasures(value);
    return question.capture.fields.every((field) => {
      if (!data[field.key]) return false;
      const amount = Number(data[field.key]);
      return Number.isFinite(amount) && amount >= field.min && amount <= field.max;
    });
  }
  if (question.capture?.kind === 'archetype') {
    return archetypeSlugFromStored(value) != null;
  }
  return value.trim().length > 0;
}

function MeasuresFields({
  fields,
  value,
  onChange,
}: {
  fields: MeasureField[];
  value: string;
  onChange: (next: string) => void;
}) {
  const data = readMeasures(value);
  return (
    <div className="dk-measures">
      {fields.map((field) => (
        <label key={field.key} className="dk-measure">
          <span className="dk-measure__label">{field.label}</span>
          <input
            className="dk-measure__input"
            inputMode="numeric"
            type="number"
            min={field.min}
            max={field.max}
            value={data[field.key] ?? ''}
            aria-label={field.label}
            onChange={(event) =>
              onChange(JSON.stringify({ ...data, [field.key]: event.target.value }))
            }
          />
          <span className="dk-measure__unit">{field.unit}</span>
        </label>
      ))}
    </div>
  );
}

function LinesFields({
  fields,
  value,
  onChange,
}: {
  fields: LineField[];
  value: string;
  onChange: (next: string) => void;
}) {
  const data = readMeasures(value);
  return (
    <div className="dk-lines">
      {fields.map((field) => (
        <label key={field.key} className="dk-line">
          <span className="dk-line__label">{field.label}</span>
          <textarea
            className="dk-line__input"
            rows={2}
            value={data[field.key] ?? ''}
            aria-label={field.label}
            onChange={(event) =>
              onChange(JSON.stringify({ ...data, [field.key]: event.target.value }))
            }
          />
        </label>
      ))}
    </div>
  );
}

function HoursField({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: string;
  onChange: (next: string) => void;
}) {
  const chosen = value === '' ? null : Number(value);
  const label = chosen == null ? 'Desliza hasta las horas' : chosen === 1 ? '1 hora' : `${chosen} horas`;
  return (
    <div className="dk-hours">
      <p className="dk-hours__value">{label}</p>
      <input
        className="dk-hours__range"
        type="range"
        min={min}
        max={max}
        step={1}
        value={chosen ?? min}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={chosen ?? undefined}
        aria-valuetext={label}
        onPointerDown={(event) => {
          if (value === '') onChange(event.currentTarget.value);
        }}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="dk-hours__ends" aria-hidden>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

/** Check if selection is valid to submit */
const EXCEPTION_LABELS: Record<string, string> = {
  UNKNOWN: 'No lo sé',
  NOT_APPLICABLE: 'No aplica',
  DECLINED: 'Prefiero no responder',
};

function mustAnswer(q: QuestionDto): boolean {
  return q.capture?.kind === 'birthdate'
    || q.sourceRef === 'formulario-v1:F-RAD-001!R7'
    || q.sourceRef === 'formulario-v1:F-RAD-001!R8'
    || q.sourceRef === 'mk:f-rad-002-pareja-puerta'
    || activitySlot(q.sourceRef)?.index === 1;
}

export function isSelectionValid(q: QuestionDto, sel: SelectionState): boolean {
  if (mustAnswer(q) && sel.type === 'exception') return false;
  if (q.capture?.kind === 'birthdate') {
    return sel.type === 'text' && textAnswerReady(q, sel.value);
  }
  if (mustAnswer(q) && q.type === 'SINGLE_CHOICE') {
    return sel.type === 'single' && sel.selected !== null;
  }
  if (sel.type === 'exception') return true;
  if (sel.type === 'single') return sel.selected !== null;
  if (sel.type === 'scale') return sel.selected !== null;
  if (sel.type === 'multi') {
    if (q.sourceRef === 'formulario-v1:E-PER-000!R40') return sel.selected.length >= 4;
    if (q.sourceRef === 'formulario-v1:E-PER-000!R51') {
      const needed = Math.min(q.maxSelections ?? 3, q.options.length);
      return needed > 0 && sel.selected.length === needed;
    }
    return sel.selected.length > 0;
  }
  if (sel.type === 'text') return textAnswerReady(q, sel.value);
  if (sel.type === 'ranking') return sel.order.length > 0;
  return false;
}

/** Text shown next to a disabled Continuar: what is still missing. */
export function continueHint(q: QuestionDto): string {
  switch (q.type) {
    case 'MULTI_CHOICE':
      if (q.sourceRef === 'formulario-v1:E-PER-000!R40') return 'Elige al menos 4 para continuar.';
      if (q.sourceRef === 'formulario-v1:E-PER-000!R51') {
        const needed = Math.min(q.maxSelections ?? 3, q.options.length || 3);
        return `Elige ${needed} para continuar.`;
      }
      return 'Elige al menos una opción para continuar.';
    case 'FREE_TEXT':
      if (q.capture?.kind === 'measures') return 'Completa edad, altura y peso para continuar.';
      if (q.capture?.kind === 'lines') return 'Completa cada casilla para continuar.';
      if (q.sourceRef && MEASURE_PICKERS[q.sourceRef]) return MEASURE_PICKERS[q.sourceRef].hint;
      if (q.capture?.kind === 'hours') return 'Indica las horas para continuar.';
      if (q.capture?.kind === 'birthdate') return 'Indica tu fecha de nacimiento para continuar.';
      if (q.capture?.kind === 'number') return `Indica el número en ${q.capture.unit} para continuar.`;
      if (q.capture?.kind === 'activity') return 'Elige ámbito, desarrollo de idea y escribe tu respuesta. Si no tienes esta actividad, usa No puedo responder ahora.';
      if (q.capture?.kind === 'ikigai') return 'Escribe la actividad. El cruce con otros campos es opcional.';
      if (q.capture?.kind === 'archetype') return 'Elige un arquetipo para continuar.';
      return 'Escribe tu respuesta para continuar.';
    case 'RANKING':
      return 'Ordena las opciones para continuar.';
    default:
      return 'Elige una opción para continuar.';
  }
}

/** Extract payload for API from selection */
export function selectionToPayload(sel: SelectionState): {
  selectedOptionIds?: string[];
  freeText?: string;
  rankingOrder?: string[];
  exceptionKind?: 'UNKNOWN' | 'NOT_APPLICABLE' | 'DECLINED';
} {
  if (sel.type === 'single' && sel.selected) {
    return { selectedOptionIds: [sel.selected] };
  }
  if (sel.type === 'scale' && sel.selected) {
    const payload: { selectedOptionIds: string[]; freeText?: string } = {
      selectedOptionIds: [sel.selected],
    };
    if (sel.reason.trim()) {
      payload.freeText = sel.reason.trim();
    }
    return payload;
  }
  if (sel.type === 'multi') {
    return { selectedOptionIds: sel.selected };
  }
  if (sel.type === 'text') {
    return { freeText: sel.value.trim() };
  }
  if (sel.type === 'ranking') {
    return { rankingOrder: sel.order };
  }
  if (sel.type === 'exception') {
    return { exceptionKind: sel.kind, selectedOptionIds: [], freeText: undefined };
  }
  return {};
}

function BirthdateField({
  minAge,
  maxAge,
  value,
  onChange,
}: {
  minAge: number;
  maxAge: number;
  value: string;
  onChange: (next: string) => void;
}) {
  const bounds = birthdateBounds(minAge, maxAge);
  const stored = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
  return (
    <div className="dk-age">
      <input
        className="dk-age__select"
        type="date"
        min={bounds.min}
        max={bounds.max}
        value={stored}
        aria-label="Fecha de nacimiento"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function measureOption(amount: number, unit: string): string {
  if (!unit) return String(amount);
  if (unit === 'horas') return amount === 1 ? '1 hora' : `${amount} horas`;
  return `${amount} ${unit}`;
}

function MeasurePicker({
  spec,
  floor,
  ceiling,
  value,
  onChange,
}: {
  spec: (typeof MEASURE_PICKERS)[string];
  floor: number;
  ceiling: number;
  value: string;
  onChange: (next: string) => void;
}) {
  const min = Math.max(floor, spec.low);
  const max = Math.min(ceiling, spec.high);
  const step = spec.step ?? 1;
  const amounts: number[] = [];
  for (let amount = min; amount <= max; amount += step) amounts.push(amount);
  const chosen = Number(value);
  const stored = amounts.includes(chosen) ? String(chosen) : '';
  return (
    <label className="dk-age">
      <select
        className="dk-age__select dk-age__select--list"
        value={stored}
        aria-label={spec.label}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{spec.empty}</option>
        {amounts.map((amount) => (
          <option key={amount} value={String(amount)}>{measureOption(amount, spec.unit)}</option>
        ))}
      </select>
      <span className="dk-age__chevron" aria-hidden />
    </label>
  );
}

function NumberField({
  unit,
  min,
  max,
  value,
  onChange,
}: {
  unit: string;
  min: number;
  max: number;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="dk-measure">
      <span className="dk-measure__label">{unit}</span>
      <input
        className="dk-measure__input"
        inputMode="decimal"
        type="number"
        min={min}
        max={max}
        value={value}
        aria-label={unit}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ActivityPick({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (next: string) => void;
}) {
  return (
    <div className="dk-line">
      <span className="dk-line__label">{label}</span>
      <ul role="listbox" aria-label={label} className="dk-choice-list">
        {options.map((item) => {
          const selected = value === item;
          return (
            <li key={item}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                className={`dk-choice-option${selected ? ' dk-choice-option--selected' : ''}`}
                onClick={() => onSelect(item)}
              >
                <span className="dk-choice-radio" aria-hidden />
                <span className="font-body-md">{item}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ActivityField({
  ambits,
  answerLabel,
  value,
  onChange,
}: {
  ambits: { label: string; options: string[] }[];
  answerLabel: string;
  value: string;
  onChange: (next: string) => void;
}) {
  let ambit = '';
  let option = '';
  let answer = '';
  try {
    const parsed = JSON.parse(value) as { ambit?: string; option?: string; answer?: string };
    ambit = parsed.ambit ?? '';
    option = parsed.option ?? '';
    answer = parsed.answer ?? '';
  } catch {
    ambit = '';
  }
  const choices = ambits.find((item) => item.label === ambit)?.options ?? [];
  const review = Boolean(ambit && answer.trim() && !option);
  function write(next: { ambit: string; option: string; answer: string }) {
    onChange(JSON.stringify(next));
  }
  return (
    <div className="dk-lines">
      <ActivityPick
        label="Ámbito"
        value={ambit}
        options={ambits.map((item) => item.label)}
        onSelect={(next) => write({ ambit: next, option: '', answer })}
      />
      {ambit ? (
        <ActivityPick
          label="Desarrollo de idea"
          value={option}
          options={choices}
          onSelect={(next) => write({ ambit, option: next, answer })}
        />
      ) : (
        <p className="dk-question-context">Elige un ámbito para ver las ideas.</p>
      )}
      {review ? <p role="status">Revisa el desarrollo de idea. Tu respuesta específica sigue escrita.</p> : null}
      <label className="dk-line">
        <span className="dk-line__label">{answerLabel}</span>
        <textarea
          className="dk-line__input"
          rows={3}
          value={answer}
          aria-label={answerLabel}
          onChange={(event) => write({ ambit, option, answer: event.target.value })}
        />
      </label>
    </div>
  );
}

function IkigaiField({
  others,
  value,
  onChange,
}: {
  others: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  let activity = '';
  let also: string[] = [];
  try {
    const parsed = JSON.parse(value) as { activity?: string; also?: string[] };
    activity = parsed.activity ?? '';
    also = parsed.also ?? [];
  } catch {
    activity = '';
  }
  function write(nextActivity: string, nextAlso: string[]) {
    onChange(JSON.stringify({ activity: nextActivity, also: nextAlso }));
  }
  return (
    <div className="dk-lines">
      <label className="dk-line">
        <span className="dk-line__label">Actividad</span>
        <textarea className="dk-line__input" rows={2} value={activity} aria-label="Actividad" onChange={(event) => write(event.target.value, also)} />
      </label>
      <p>También la reconozco en</p>
      {others.map((lens) => (
        <label key={lens} className="dk-measure">
          <input
            type="checkbox"
            checked={also.includes(lens)}
            onChange={(event) => write(activity, event.target.checked ? [...also, lens] : also.filter((item) => item !== lens))}
          />
          {lens}
        </label>
      ))}
    </div>
  );
}
