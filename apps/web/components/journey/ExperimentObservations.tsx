'use client';

import { FormEvent, useState } from 'react';

const ASPECTS = [
  ['INTEREST', 'Interés o aprendizaje'],
  ['CAPACITY_LEARNING', 'Capacidad'],
  ['USEFULNESS', 'Utilidad para alguien'],
  ['SUSTAINABILITY', 'Sostenibilidad'],
] as const;

export type ObservationDraft = {
  aspect: string;
  status: string;
  recipient: string;
  observed: string;
};

/** Declared by the person. A missing reply is not a rejection and does not prove demand. */
export function ExperimentObservations({
  saving,
  onObserve,
  onReview,
}: {
  saving?: boolean;
  onObserve: (draft: ObservationDraft) => Promise<void> | void;
  onReview: (decision: 'KEEP' | 'MODIFY' | 'DISCARD' | 'INCONCLUSIVE', evidence: string) => Promise<void> | void;
}) {
  const [aspect, setAspect] = useState<string>('INTEREST');
  const [status, setStatus] = useState('NO_INFORMATION');
  const [recipient, setRecipient] = useState('NO_RECIPIENT');
  const [observed, setObserved] = useState('');
  const [evidence, setEvidence] = useState('');
  const [error, setError] = useState('');

  async function send(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await onObserve({ aspect, status, recipient, observed });
      setObserved('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se guardó la observación.');
    }
  }

  return (
    <form onSubmit={send} aria-busy={saving}>
      <h3>Observaciones del experimento</h3>
      <label>
        Aspecto
        <select aria-label="Aspecto" value={aspect} onChange={(event) => setAspect(event.target.value)}>
          {ASPECTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>
        Qué pasó
        <select aria-label="Estado de la observación" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="FAVORABLE">Favorable</option>
          <option value="CONTRARY">Contrario</option>
          <option value="NOT_OBSERVED">Todavía no observado</option>
          <option value="NO_INFORMATION">Sin información</option>
        </select>
      </label>
      <label>
        Destinatario
        <select aria-label="Respuesta del destinatario" value={recipient} onChange={(event) => setRecipient(event.target.value)}>
          <option value="NO_RECIPIENT">No hay destinatario</option>
          <option value="NO_RESPONSE">No hubo respuesta</option>
          <option value="RESPONDED">Respondió</option>
        </select>
      </label>
      <label>
        Qué observaste
        <textarea aria-label="Texto de la observación" value={observed} onChange={(event) => setObserved(event.target.value)} rows={3} />
      </label>
      <button type="submit" disabled={saving}>Guardar observación</button>
      <fieldset>
        <legend>Revisión de la hipótesis</legend>
        <label>
          Evidencia
          <textarea aria-label="Evidencia de la revisión" value={evidence} onChange={(event) => setEvidence(event.target.value)} rows={2} />
        </label>
        {(['KEEP', 'MODIFY', 'DISCARD', 'INCONCLUSIVE'] as const).map((decision) => (
          <button key={decision} type="button" disabled={saving} onClick={() => void onReview(decision, evidence)}>
            {decision === 'KEEP' ? 'Mantener' : decision === 'MODIFY' ? 'Modificar' : decision === 'DISCARD' ? 'Descartar' : 'Sin conclusión'}
          </button>
        ))}
      </fieldset>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
