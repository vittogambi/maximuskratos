'use client';

import { useState } from 'react';
import type { LabProvenanceItem } from '@/lib/lab-api';
import {
  METHOD_TRANSFORM_OPTIONS,
  REFINEMENT_VERDICT_OPTIONS,
  REMOVED_CONTENT_OPTIONS,
} from '@/lib/lab-ui/labels';
import { Field, LabCard, RadioCards } from './primitives';

const IKIGAI_OPTIONS = [
  { value: 'KEEP_V2', label: 'Sí' },
  { value: 'KEEP_V2_PARTIAL', label: 'Falta recuperar una parte' },
  { value: 'REJECT', label: 'No, hay que revisarla' },
  { value: 'NOT_APPLICABLE', label: 'No estoy seguro' },
];

function sourceLine(item: LabProvenanceItem) {
  return item.source_refs
    .map((ref) => [ref.file, ref.sheet, ref.id].filter(Boolean).join(', '))
    .filter(Boolean)
    .join('. ');
}

function optionsFor(item: LabProvenanceItem) {
  if (item.id === 'FID-IKIGAI') return IKIGAI_OPTIONS;
  if (item.card_kind === 'method_transform') return METHOD_TRANSFORM_OPTIONS;
  if (item.card_kind === 'refinement') return REFINEMENT_VERDICT_OPTIONS;
  return REMOVED_CONTENT_OPTIONS;
}

const RADIO_TO_PHRASE: Record<string, string> = {
  Dirección: 'Conservar en Dirección',
  Matriz: 'Conservar en Matriz',
  'Más adelante': 'Dejar para una etapa posterior',
  'Queda fuera': 'Dejar fuera',
  'Sí, pero falta recuperar una parte': 'Conservar, pero falta recuperar una parte',
  'Falta recuperar una parte': 'Falta recuperar una parte',
  'Sí, conservar v2': 'Conservar',
  Sí: 'Conservar',
  No: 'Hay que revisarla',
  'No, hay que revisarla': 'Hay que revisarla',
  'No estoy seguro': 'Todavía no está decidido',
  'Ajustaría algo': 'Conservar, con un ajuste',
};

export function fidelityVerdictLabel(item: LabProvenanceItem) {
  if (!item.rafa_verdict) return 'Sin decidir';
  return optionsFor(item).find((option) => option.value === item.rafa_verdict)?.label ?? item.rafa_verdict;
}

export function excelRecapPhrase(item: LabProvenanceItem) {
  if (!item.rafa_verdict) return 'Sin decidir';
  if (item.id === 'REF-DIRECTION-V01' || item.card_kind === 'refinement') {
    if (item.rafa_verdict === 'CONFIRM') {
      return 'Sí. Por ahora, Dirección registra y organiza lo que la persona expresa sin intentar definir automáticamente su propósito.';
    }
    if (item.rafa_verdict === 'CONFIRM_WITH_ADJUSTMENT') {
      return 'Sí, con un ajuste. Por ahora, Dirección registra y organiza lo que la persona expresa sin intentar definir automáticamente su propósito.';
    }
    if (item.rafa_verdict === 'REJECT') return 'No. Hay que revisar cómo usar Dirección en esta etapa.';
    if (item.rafa_verdict === 'NOT_APPLICABLE') return 'Todavía no está decidido.';
  }
  const radio = fidelityVerdictLabel(item);
  return RADIO_TO_PHRASE[radio] ?? radio;
}

export function ExcelDecisionList({ items }: { items: LabProvenanceItem[] }) {
  return (
    <LabCard title="Resultado de la revisión">
      <div className="lab-stack lab-stack--tight">
        {items.map((item) => (
          <div key={item.id}>
            <p className="lab-h4">{item.title}</p>
            <p>→ {excelRecapPhrase(item)}</p>
          </div>
        ))}
      </div>
    </LabCard>
  );
}

export function FidelityStep({
  item,
  index,
  total,
  related,
  onSave,
}: {
  item: LabProvenanceItem;
  index: number;
  total: number;
  related?: Array<{ element: string; catalog: string }>;
  onSave: (next: { rafa_verdict: string; rafa_note: string | null }) => Promise<void>;
}) {
  const [verdict, setVerdict] = useState(item.rafa_verdict ?? '');
  const [note, setNote] = useState(item.rafa_note ?? '');
  const [busy, setBusy] = useState(false);
  const options = optionsFor(item);
  const source = sourceLine(item);
  const gap = item.undocumented ?? [];
  const twoCol = options.length >= 4;

  return (
    <LabCard eyebrow={`Cambio ${index} de ${total}`} title={item.title}>
      <div className="lab-stack lab-stack--tight" id={item.id}>
        {source ? <p className="lab-muted">Origen: {source}</p> : null}
        {item.previous_state ? <p>{item.previous_state}</p> : null}
        {item.current_state ? <p>{item.current_state}</p> : null}
        {gap.map((fact) => (
          <p key={fact}>{fact}</p>
        ))}
        {related?.length ? (
          <ul style={{ paddingLeft: '1.1rem' }}>
            {related.map((row) => (
              <li key={`${row.catalog}:${row.element}`}>{row.element}</li>
            ))}
          </ul>
        ) : null}
        <div className="lab-stack lab-stack--tight">
          <div>
            <p className="lab-h4">Lo que necesitamos revisar</p>
            <p className="lab-h3">{item.decision_question}</p>
            {item.composition?.note ? (
              <p className="lab-muted">Nota: {item.composition.note}</p>
            ) : null}
          </div>
          <RadioCards
            name={`fid-${item.id}`}
            value={verdict}
            options={options}
            columns={twoCol ? 2 : 1}
            onChange={setVerdict}
          />
          <Field label="Comentario" help="Opcional">
            <textarea
              className="lab-textarea lab-textarea--short"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
          <button
            type="button"
            className="lab-btn"
            disabled={busy || !verdict}
            onClick={() => {
              setBusy(true);
              onSave({ rafa_verdict: verdict, rafa_note: note.trim() || null }).finally(() => setBusy(false));
            }}
          >
            Guardar y continuar
          </button>
        </div>
      </div>
    </LabCard>
  );
}
