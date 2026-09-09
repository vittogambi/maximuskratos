import { LabCard } from './primitives';
import type { LabChangeSetRow } from '@/lib/lab-api';

export function ComposeAcceptedChanges({
  accepted,
  selected,
  reason,
  busy,
  onToggle,
  onReason,
  onCompose,
}: {
  accepted: LabChangeSetRow[];
  selected: string[];
  reason: string;
  busy: boolean;
  onToggle: (id: string) => void;
  onReason: (value: string) => void;
  onCompose: () => void;
}) {
  return (
    <LabCard title="Combinar cambios aceptados">
      {accepted.length === 0 ? (
        <p className="lab-muted">Todavía no hay cambios conservados como candidato.</p>
      ) : (
        accepted.map((row) => (
          <label key={row.id} className="lab-check">
            <input
              type="checkbox"
              checked={selected.includes(row.id)}
              onChange={() => onToggle(row.id)}
            />
            Cambio {row.number}. {row.reason}
          </label>
        ))
      )}
      <label className="lab-field">
        <span className="lab-label">Motivo</span>
        <textarea
          className="lab-textarea"
          value={reason}
          onChange={(event) => onReason(event.target.value)}
        />
      </label>
      <button
        type="button"
        className="lab-btn"
        disabled={busy || selected.length === 0 || !reason.trim()}
        onClick={onCompose}
      >
        Crear versión candidata combinada
      </button>
    </LabCard>
  );
}
