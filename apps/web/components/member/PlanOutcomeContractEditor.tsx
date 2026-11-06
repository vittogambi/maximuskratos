'use client';

import { useEffect, useId, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { newCommandKey, patchOutcomeContract } from '@/lib/intervention-api';
import type { OutcomeContractMeta, PlanOutcomeContractView } from '@/lib/intervention-api';

const PENDING_LABEL: Record<string, string> = {
  CRITERION: 'criterio de reconocimiento',
  CRITERION_CONFIRM: 'confirmar el criterio',
  EVIDENCE: 'evidencia que usarás',
  CHECK_AT: 'fecha de comprobación',
};

type Props = {
  territory: string;
  planId: string;
  contract: PlanOutcomeContractView | null;
  meta: OutcomeContractMeta;
  fallbackOutcome?: string;
  open: boolean;
  initialFocus?: 'evidence' | null;
  onClose: () => void;
  onSaved: () => void;
};

export function PlanOutcomeContractEditor({
  territory,
  planId,
  contract,
  meta,
  fallbackOutcome,
  open,
  initialFocus,
  onClose,
  onSaved,
}: Props) {
  const evidenceFieldId = useId();
  const [sought, setSought] = useState(contract?.soughtOutcome ?? fallbackOutcome ?? '');
  const [criterion, setCriterion] = useState(contract?.criterion ?? '');
  const [evidenceHint, setEvidenceHint] = useState(contract?.evidenceHint ?? '');
  const [checkAt, setCheckAt] = useState(contract?.checkAt ?? '');
  const [provisional, setProvisional] = useState(contract?.criterionStatus === 'PROVISIONAL');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || initialFocus !== 'evidence') return;
    const el = document.getElementById(evidenceFieldId);
    if (el instanceof HTMLElement) {
      el.focus();
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [open, initialFocus, evidenceFieldId]);

  if (!open) return null;

  return (
    <section className="mk-mx-surface mk-plans-editor" aria-labelledby="outcome-contract-edit">
      <h2 id="outcome-contract-edit" className="mk-plans-section-title">
        Editar resultado
      </h2>
      {meta.pendingFields.length ? (
        <p className="mk-mx-next__meta">
          Falta: {meta.pendingFields.map((field) => PENDING_LABEL[field] ?? 'completar un dato pendiente').join(', ')}.
        </p>
      ) : null}
      <label className="mk-week-field">
        Resultado que buscas
        <textarea rows={2} value={sought} onChange={(e) => setSought(e.target.value)} />
      </label>
      <label className="mk-week-field">
        Cómo lo reconocerás
        <textarea rows={2} value={criterion} onChange={(e) => setCriterion(e.target.value)} />
      </label>
      <label className="mk-week-field mk-week-field--row">
        <input type="checkbox" checked={provisional} onChange={(e) => setProvisional(e.target.checked)} />
        Todavía estoy concretando el criterio
      </label>
      <label className="mk-week-field">
        Evidencia que te permitiría juzgarlo
        <textarea
          id={evidenceFieldId}
          rows={2}
          value={evidenceHint}
          onChange={(e) => setEvidenceHint(e.target.value)}
        />
      </label>
      <label className="mk-week-field">
        Fecha de comprobación
        <input type="date" value={checkAt} onChange={(e) => setCheckAt(e.target.value)} />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <div className="mk-week-task__actions">
        <button type="button" className="mk-mx__action" disabled={busy} onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="mk-mx__action mk-mx__action--primary"
          disabled={busy || !sought.trim() || !criterion.trim()}
          onClick={async () => {
            const token = getAccessToken();
            if (!token) return;
            setBusy(true);
            setError(null);
            try {
              await patchOutcomeContract(token, territory, planId, {
                soughtOutcome: sought.trim(),
                criterion: criterion.trim(),
                criterionStatus: provisional ? 'PROVISIONAL' : 'CONFIRMED',
                evidenceHint: evidenceHint.trim() || null,
                checkAt: checkAt.trim() || null,
                commandKey: newCommandKey(`oc-edit-${planId}`),
              });
              onSaved();
              onClose();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'No se pudo guardar.');
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Guardando' : 'Guardar'}
        </button>
      </div>
    </section>
  );
}
