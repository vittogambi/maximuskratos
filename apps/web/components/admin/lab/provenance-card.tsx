'use client';

import { useState } from 'react';
import type { LabProvenanceItem } from '@/lib/lab-api';
import {
  METHOD_TRANSFORM_OPTIONS,
  REFINEMENT_VERDICT_OPTIONS,
  REMOVED_CONTENT_OPTIONS,
  labUiLabels,
} from '@/lib/lab-ui/labels';
import { OriginChip } from './origin-chip';
import { LabCard, RadioCards } from './primitives';

function sourceLine(item: LabProvenanceItem) {
  return item.source_refs
    .map((ref) => [ref.file, ref.sheet, ref.id, ref.version].filter(Boolean).join(' · '))
    .filter(Boolean)
    .join('. ');
}

function optionsFor(item: LabProvenanceItem) {
  if (item.card_kind === 'method_transform') return METHOD_TRANSFORM_OPTIONS;
  if (item.card_kind === 'refinement') return REFINEMENT_VERDICT_OPTIONS;
  return REMOVED_CONTENT_OPTIONS;
}

function statusLabel(item: LabProvenanceItem) {
  if (item.card_kind === 'later' && !item.rafa_verdict) return 'No requiere decisión en esta fase';
  if (item.card_kind === 'correction' && !item.rafa_verdict) return 'No pide criterio';
  if (item.card_kind === 'removed_content' && !item.rafa_verdict) return 'Pendiente de revisión';
  return labUiLabels.decisionStatus(item.decision_status);
}

export function ProvenanceCard({
  item,
  onSave,
  defaultOpen,
}: {
  item: LabProvenanceItem;
  onSave?: (next: { rafa_verdict: string; rafa_note: string | null }) => Promise<void>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(
    Boolean(defaultOpen || (onSave && item.verdict_set !== 'none' && !item.rafa_verdict)),
  );
  const [verdict, setVerdict] = useState(item.rafa_verdict ?? '');
  const [note, setNote] = useState(item.rafa_note ?? '');
  const [busy, setBusy] = useState(false);
  const canDecide = Boolean(onSave && item.verdict_set !== 'none');
  const options = optionsFor(item);
  const development =
    item.origin_type === 'V2_UNDOCUMENTED_RESULT'
      ? 'Excel original → sin equivalente claro en v2'
      : item.origin_type === 'V2_TRANSFORMATION'
        ? 'Excel original → transformación en Matriz v2'
        : item.origin_type === 'POST_V2_REFINEMENT'
          ? 'Refinamiento posterior a Matriz v2'
          : null;

  return (
    <LabCard title={item.title}>
      <div className="lab-stack lab-stack--tight" id={item.id}>
        <p>
          <OriginChip origin={item.origin_type} />{' '}
          <span className="lab-muted">{statusLabel(item)}</span>
        </p>
        {development ? <p className="lab-lead">{development}</p> : null}

        <dl className="lab-prov">
          <dt>Fuente original</dt>
          <dd>
            {sourceLine(item) || 'Sin referencia'}
            {item.previous_state ? <p className="lab-muted">{item.previous_state}</p> : null}
          </dd>
          <dt>Situación en Matriz v2</dt>
          <dd>{item.current_state || item.change_summary}</dd>
        </dl>

        {(item.documented_facts?.length || item.undocumented?.length) ? (
          <div className="lab-stack lab-stack--tight">
            {item.documented_facts?.length ? (
              <>
                <h3 className="lab-h4">Qué está documentado</h3>
                <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
                  {item.documented_facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {item.undocumented?.length ? (
              <>
                <h3 className="lab-h4">Qué no está documentado</h3>
                <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
                  {item.undocumented.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        ) : (
          <p>{item.change_summary}</p>
        )}

        {item.composition ? (
          <div className="lab-stack lab-stack--tight">
            <h3 className="lab-h4">Composición metodológica</h3>
            <p className="lab-muted">De Matriz v2</p>
            <ul style={{ paddingLeft: '1.1rem' }}>
              {item.composition.from_v2.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="lab-muted">Del formulario original / NO BORRAR</p>
            <ul style={{ paddingLeft: '1.1rem' }}>
              {item.composition.from_legacy.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="lab-muted">Refinamiento posterior de producto</p>
            <ul style={{ paddingLeft: '1.1rem' }}>
              {item.composition.from_product.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="lab-lead">{item.composition.note}</p>
          </div>
        ) : null}

        {item.rafa_verdict ? (
          <p className="lab-muted">{labUiLabels.migrationVerdict(item.rafa_verdict)}</p>
        ) : null}

        {canDecide ? (
          open ? (
            <div className="lab-stack">
              {item.decision_question ? <p className="lab-lead">{item.decision_question}</p> : null}
              <RadioCards name={`prov-${item.id}`} value={verdict} options={options} onChange={setVerdict} />
              <textarea className="lab-textarea" value={note} onChange={(event) => setNote(event.target.value)} />
              <button
                type="button"
                className="lab-btn"
                disabled={busy || !verdict}
                onClick={() => {
                  setBusy(true);
                  onSave!({ rafa_verdict: verdict, rafa_note: note.trim() || null })
                    .catch(() => undefined)
                    .finally(() => setBusy(false));
                }}
              >
                Guardar
              </button>
            </div>
          ) : (
            <button type="button" className="lab-btn lab-btn--ghost" onClick={() => setOpen(true)}>
              {item.rafa_verdict ? 'Cambiar decisión' : 'Registrar criterio'}
            </button>
          )
        ) : null}
      </div>
    </LabCard>
  );
}
