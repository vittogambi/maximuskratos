'use client';

import { useState } from 'react';

const LABELS = {
  DONE: 'Hecha',
  SKIPPED: 'No hecha',
  NOT_APPLICABLE: 'No aplica',
  PENDING: 'Sin registrar',
} as const;

type Status = keyof typeof LABELS;

export function statusLabel(status: string | null | undefined): string {
  if (status === 'DONE') return 'Hecha';
  if (status === 'SKIPPED') return 'No hecha';
  if (status === 'NOT_APPLICABLE') return 'No aplica';
  if (status === 'PENDING') return 'Sin registrar';
  return 'Sin registrar';
}

export function TaskRow({
  title,
  detail,
  cue,
  minimum,
  context,
  pillar,
  status,
  disabled,
  disabledReason,
  onStatus,
}: {
  title: string;
  detail?: string;
  cue?: string;
  minimum?: string;
  context?: string;
  pillar?: string | null;
  status: string | null;
  disabled?: boolean;
  disabledReason?: string;
  onStatus: (status: Status) => void;
}) {
  const eyebrow = context ?? pillar ?? undefined;
  const [menuOpen, setMenuOpen] = useState(false);
  const done = status === 'DONE';

  return (
    <article className="mk-week-task">
      {eyebrow ? <p className="mk-week-task__context">{eyebrow}</p> : null}
      <h2 className="mk-week-task__title">{title}</h2>
      {detail ? (
        <p className="mk-week-task__criterion">
          <span className="mk-week-task__criterion-label">Se considera hecha cuando </span>
          {detail}
        </p>
      ) : null}
      {cue ? <p className="mk-week-task__criterion"><span className="mk-week-task__criterion-label">Cuándo: </span>{cue}</p> : null}
      {minimum ? <p className="mk-week-task__criterion"><span className="mk-week-task__criterion-label">Si el día se complica: </span>{minimum}</p> : null}
      <p className="mk-week-task__state">{statusLabel(status)}</p>
      {disabled ? (
        <p className="mk-week-task__note">{disabledReason}</p>
      ) : (
        <div className="mk-week-task__actions">
          <button
            type="button"
            className={done ? 'mk-mx__action is-selected' : 'mk-mx__action mk-mx__action--primary'}
            aria-pressed={done}
            onClick={() => onStatus('DONE')}
          >
            {done ? 'Hecha' : 'Marcar como hecha'}
          </button>
          <div className="mk-week-task__more">
            <button type="button" className="mk-mx__action" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
              Cambiar estado
            </button>
            {menuOpen ? (
              <div className="mk-week-task__menu" role="group" aria-label="Otros estados">
                {(['PENDING', 'SKIPPED', 'NOT_APPLICABLE'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="mk-mx__action"
                    aria-pressed={status === item}
                    onClick={() => {
                      onStatus(item);
                      setMenuOpen(false);
                    }}
                  >
                    {LABELS[item]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </article>
  );
}
