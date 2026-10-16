'use client';

const LABELS = {
  DONE: 'Hecho',
  SKIPPED: 'Omitido',
  NOT_APPLICABLE: 'No aplica',
  PENDING: 'Pendiente',
} as const;

type Status = keyof typeof LABELS;

export function statusLabel(status: string | null | undefined): string {
  if (status && status in LABELS) return LABELS[status as Status];
  return 'Sin registro';
}

export function TaskRow({
  title,
  detail,
  pillar,
  status,
  resultNote,
  resultStatus,
  disabled,
  disabledReason,
  onStatus,
  onResult,
  onResultStatus,
}: {
  title: string;
  detail?: string;
  pillar?: string | null;
  status: string | null;
  resultNote?: string | null;
  resultStatus?: string | null;
  onResultStatus?: (status: 'OBSERVED' | 'NOT_YET_OBSERVED' | 'NOT_OBSERVED' | 'NO_INFORMATION') => void;
  disabled?: boolean;
  disabledReason?: string;
  onStatus: (status: Status) => void;
  onResult?: (text: string) => void;
}) {
  const done = status === 'DONE';
  return (
    <article className="mk-task">
      <div className="mk-task__main">
        <h2 className="mk-task__title">{title}</h2>
        {pillar ? <p className="mk-task__pillar">{pillar}</p> : null}
        {detail ? <p className="mk-task__detail">{detail}</p> : null}
        <p className="mk-task__state">Actividad: {statusLabel(status)}. Hecho no acredita el resultado.</p>
        {onResultStatus && !disabled ? (
          <label>
            Estado del resultado
            <select aria-label={`Estado del resultado de ${title}`} value={resultStatus ?? ''} onChange={(event) => onResultStatus(event.target.value as 'OBSERVED' | 'NOT_YET_OBSERVED' | 'NOT_OBSERVED' | 'NO_INFORMATION')}>
              <option value="">Sin información</option>
              <option value="NOT_YET_OBSERVED">Todavía no observado</option>
              <option value="NOT_OBSERVED">No observado</option>
              <option value="OBSERVED">Observado</option>
              <option value="NO_INFORMATION">Sin dato</option>
            </select>
          </label>
        ) : null}
        {onResult && !disabled ? (
          <label>
            Resultado observado
            <input aria-label={`Resultado de ${title}`} defaultValue={resultNote ?? ''} onBlur={(event) => onResult(event.target.value)} />
          </label>
        ) : <p>{resultNote ? `Resultado: ${resultNote}` : 'Resultado: sin información.'}</p>}
      </div>
      {disabled ? (
        <p className="mk-task__note">{disabledReason}</p>
      ) : (
        <div className="mk-task__actions">
          <button
            type="button"
            className={done ? 'mk-member-btn is-selected' : 'mk-member-btn'}
            aria-pressed={done}
            onClick={() => onStatus('DONE')}
          >
            Hecho
          </button>
          <details className="mk-task__more">
            <summary>Otros estados</summary>
            <div>
              {(['PENDING', 'SKIPPED', 'NOT_APPLICABLE'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={status === item}
                  className={status === item ? 'is-selected' : undefined}
                  onClick={() => onStatus(item)}
                >
                  {LABELS[item]}
                </button>
              ))}
            </div>
          </details>
        </div>
      )}
    </article>
  );
}
