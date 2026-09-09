'use client';

import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { clearLabFlash, subscribeLabFlash } from '@/lib/lab-ui/flash';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import type { Option } from '@/lib/lab-ui/labels';
import type { LabRunHumanStatus, LabStep, LabStepId } from '@/lib/lab-ui/status';

export function LabCard({
  eyebrow,
  title,
  lead,
  tone,
  compact,
  children,
}: {
  eyebrow?: string;
  title?: string;
  lead?: ReactNode;
  tone?: 'accent' | 'quiet';
  compact?: boolean;
  children?: ReactNode;
}) {
  const cls = [
    'lab-card',
    tone === 'accent' ? 'lab-card--accent' : '',
    tone === 'quiet' ? 'lab-card--quiet' : '',
    compact ? 'lab-card--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <section className={cls}>
      {eyebrow || title || lead ? (
        <div className="lab-card__head">
          {eyebrow ? <p className="lab-eyebrow">{eyebrow}</p> : null}
          {title ? <h2 className="lab-h2">{title}</h2> : null}
          {lead ? <p className="lab-lead">{lead}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Field({
  label,
  help,
  children,
  error,
}: {
  label: string;
  help?: string;
  children: ReactNode;
  error?: string | null;
}) {
  return (
    <label className="lab-field">
      <span className="lab-label">{label}</span>
      {help ? <span className="lab-hint">{help}</span> : null}
      {children}
      {error ? <span className="lab-error">{error}</span> : null}
    </label>
  );
}

export function RadioCards({
  name,
  value,
  options,
  onChange,
  inline,
  compact,
  columns,
}: {
  name: string;
  value: string | null;
  options: Option[];
  onChange: (value: string) => void;
  inline?: boolean;
  compact?: boolean;
  columns?: 1 | 2;
}) {
  const cls = [
    'lab-radios',
    inline ? 'lab-radios--inline' : '',
    compact ? 'lab-radios--compact' : '',
    columns === 2 ? 'lab-radios--2' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} role="radiogroup" aria-label={name}>
      {options.map((option) => (
        <label
          key={option.value}
          className={option.value === value ? 'lab-radio is-selected' : 'lab-radio'}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          <span>
            <span className="lab-radio__label">{option.label}</span>
            {option.help ? <span className="lab-radio__help">{option.help}</span> : null}
          </span>
        </label>
      ))}
    </div>
  );
}

export function ChipChoices({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string | null;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="lab-seg lab-seg--block" role="radiogroup" aria-label={name}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={option.value === value ? 'lab-chip is-active' : 'lab-chip'}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'danger' | 'warn' | 'info' | 'ok';
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`lab-alert lab-alert--${tone}`} role={tone === 'danger' ? 'alert' : undefined}>
      {title ? <p className="lab-alert__title">{title}</p> : null}
      {children ? <p>{children}</p> : null}
    </div>
  );
}

/** Kept in source. Not rendered: the operator must not see technical details. */
export function Tech(_props: { label?: string; children: ReactNode }) {
  return null;
}

export const TechnicalDisclosure = Tech;

export function KeyValues({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="lab-kv">
      {rows.map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd className="lab-mono">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Modal({
  title,
  children,
  onClose,
  actions,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  actions: ReactNode;
}) {
  return (
    <div
      className="lab-modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div className="lab-modal__panel">
        <h2 className="lab-modal__title">{title}</h2>
        {children}
        <div className="lab-modal__actions">{actions}</div>
      </div>
    </div>
  );
}

export function StatusLine({ status }: { status: LabRunHumanStatus }) {
  return (
    <span className={`lab-status lab-status--${status.tone}`}>
      <span className="lab-status__dot" aria-hidden="true" />
      {status.label}
    </span>
  );
}

export function Stepper({
  steps,
  active,
  onSelect,
  label = 'Progreso de la sesión',
}: {
  steps: LabStep[];
  active: LabStepId;
  onSelect: (id: LabStepId) => void;
  label?: string;
}) {
  return (
    <nav className="lab-stepper" aria-label={label}>
      {steps.map((step) => {
        const locked = step.state === 'LOCKED';
        const marker: AppIconName =
          step.state === 'DONE' ? 'check' : locked ? 'lock' : step.state === 'CURRENT' ? 'circle-dot' : 'circle';
        return (
          <button
            key={step.id}
            type="button"
            className={[
              'lab-step',
              step.id === active ? 'is-current' : '',
              step.state === 'DONE' ? 'is-done' : '',
              locked ? 'is-locked' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={step.id === active ? 'step' : undefined}
            aria-disabled={locked || undefined}
            disabled={locked}
            title={locked ? step.lockedReason : undefined}
            onClick={() => {
              if (locked) return;
              onSelect(step.id);
            }}
          >
            {step.state === 'DONE' || locked ? (
              <span className="lab-step__marker" aria-hidden="true">
                <AppIcon name={marker} size={13} />
              </span>
            ) : null}
            {step.label}
          </button>
        );
      })}
    </nav>
  );
}

/** Explains a locked step instead of showing an empty or broken looking panel. */
export function LockedPanel({ step }: { step: LabStep | undefined }) {
  return (
    <div className="lab-empty">
      <p style={{ margin: 0 }}>
        {step?.lockedReason ?? 'Este paso todavía no está disponible.'}
      </p>
    </div>
  );
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="lab-stack lab-stack--tight" aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="lab-skeleton" style={{ width: `${100 - index * 12}%` }} />
      ))}
    </div>
  );
}

export interface PickableQuestion {
  id: string;
  text: string;
  domain: string | null;
  answer?: string;
}

/**
 * Evidence and target picker. Rafa searches with words, never with ids, and the ids
 * are what we store.
 */
export function QuestionPicker({
  questions,
  picked,
  onChange,
  max,
  label,
  help,
  single,
  requireSearch,
}: {
  questions: PickableQuestion[];
  picked: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label: string;
  help?: string;
  single?: boolean;
  requireSearch?: boolean;
}) {
  const [query, setQuery] = useState('');
  const inputId = useId();
  const limit = single ? 1 : (max ?? 3);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return requireSearch ? [] : questions.slice(0, 12);
    return questions
      .filter(
        (question) =>
          question.text.toLowerCase().includes(term) || question.id.toLowerCase().includes(term),
      )
      .slice(0, 24);
  }, [query, questions, requireSearch]);

  const pickedItems = picked
    .map((id) => questions.find((question) => question.id === id))
    .filter((item): item is PickableQuestion => Boolean(item));

  function toggle(id: string) {
    if (picked.includes(id)) {
      onChange(picked.filter((item) => item !== id));
      return;
    }
    if (single) {
      onChange([id]);
      return;
    }
    if (picked.length >= limit) return;
    onChange([...picked, id]);
  }

  return (
    <div className="lab-combo">
      <label className="lab-label" htmlFor={inputId}>
        {label}
      </label>
      {help ? <p className="lab-hint">{help}</p> : null}
      {pickedItems.length ? (
        <div className="lab-picked">
          {pickedItems.map((item) => (
            <div key={item.id} className="lab-picked__item">
              <span>
                {item.text}
                {item.answer ? <span className="lab-hint">Respuesta: {item.answer}</span> : null}
              </span>
              <button type="button" className="lab-btn lab-btn--quiet" onClick={() => toggle(item.id)}>
                Quitar
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {single && pickedItems.length ? null : (
        <>
          <input
            id={inputId}
            className="lab-input"
            type="search"
            value={query}
            placeholder={requireSearch ? 'Buscar pregunta del caso' : 'Buscar por palabras de la pregunta'}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="lab-combo__list" role="listbox" aria-label={label}>
            {matches.length === 0 ? (
              <p className="lab-hint" style={{ padding: '0.5rem' }}>
                {requireSearch && !query.trim()
                  ? 'Escribe para buscar. No se listan todas las preguntas de entrada.'
                  : 'Ninguna pregunta coincide con esa búsqueda.'}
              </p>
            ) : null}
            {matches.map((question) => (
              <button
                key={question.id}
                type="button"
                role="option"
                aria-selected={picked.includes(question.id)}
                className={
                  picked.includes(question.id) ? 'lab-combo__option is-selected' : 'lab-combo__option'
                }
                onClick={() => toggle(question.id)}
              >
                <span className="lab-combo__option-main">{question.text}</span>
                <span className="lab-combo__option-meta">
                  {question.id}
                  {question.answer ? ` · ${question.answer}` : ''}
                </span>
              </button>
            ))}
          </div>
          {!single ? (
            <p className="lab-hint">
              Puedes elegir hasta {limit}. Seleccionadas {picked.length}.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

export function ErrorNote({
  error,
  onRetry,
}: {
  error: { message: string; hint: string | null; technical: string | null } | null;
  onRetry?: () => void;
}) {
  if (!error) return null;
  return (
    <div className="lab-alert lab-alert--danger" role="alert">
      <p className="lab-alert__title">{error.message}</p>
      {error.hint ? <p>{error.hint}</p> : null}
      <div className="lab-actions">
        {onRetry ? (
          <button type="button" className="lab-btn lab-btn--ghost" onClick={onRetry}>
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SavedNote({ children }: { children: ReactNode }) {
  return (
    <p className="lab-saved" role="status">
      {children}
    </p>
  );
}

export function LabFlash() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => subscribeLabFlash(setMessage), []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => clearLabFlash(), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!message) return null;
  return (
    <p className="lab-toast" role="status">
      {message}
    </p>
  );
}
