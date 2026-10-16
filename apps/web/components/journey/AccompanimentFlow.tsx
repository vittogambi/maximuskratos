'use client';

import { FormEvent, useEffect, useState } from 'react';
import { confirmAccompaniment, JourneyApiError, previewAccompaniment, type AccompanimentPreview } from '@/lib/journey-api';
import { getAccessToken } from '@/lib/auth-storage';
import { HelpDraftView } from './HelpDraftView';

const KINDS = [
  ['ENTREGAR', 'Entregar'],
  ['ENSENAR_O_CONTRIBUIR', 'Enseñar o contribuir'],
  ['CONSTRUIR_O_PROBAR', 'Construir o probar'],
  ['CUIDAR', 'Cuidar'],
  ['ORDENAR', 'Ordenar'],
  ['VINCULAR', 'Un vínculo'],
  ['SOSTENER', 'Sostener'],
  ['EXPLORAR_IKIGAI', 'Explorar IKIGAI'],
  ['PROPIA', 'Otra meta'],
] as const;

const BARRIER_CHOICES = [
  ['RECOGNIZE', 'La reconozco'],
  ['REJECT', 'No la reconozco'],
  ['OTHER', 'Es otra'],
  ['UNKNOWN', 'Todavía no sé'],
] as const;

/** Preview, edit and confirm. Accepting this form does not confirm a barrier by itself. */
export function AccompanimentFlow({
  initialPreference = '',
  path = '',
}: {
  initialPreference?: string;
  path?: string;
}) {
  const [goalText, setGoalText] = useState('');
  const [goalKind, setGoalKind] = useState('ENTREGAR');
  const [territory, setTerritory] = useState('MENTALIDAD');
  const [occasions, setOccasions] = useState('1');
  const [minutes, setMinutes] = useState('45');
  const [reviewMinutes, setReviewMinutes] = useState('0');
  const [situation, setSituation] = useState('');
  const [preference, setPreference] = useState('');
  const [barrierKind, setBarrierKind] = useState('');
  const [barrierChoice, setBarrierChoice] = useState('');
  const [edit, setEdit] = useState('');
  const [planChoice, setPlanChoice] = useState<'KEEP' | 'MODIFY' | 'REPLACE' | ''>('');
  const [preview, setPreview] = useState<AccompanimentPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (initialPreference) setPreference(initialPreference);
  }, [initialPreference]);

  async function onPreview(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError('');
    setSaved('');
    try {
      const row = await previewAccompaniment(token, body());
      setPreview(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo preparar la ayuda.');
    } finally {
      setLoading(false);
    }
  }

  function body() {
    return {
      goalText,
      goalKind,
      territory,
      situation: situation || null,
      helpPreference: preference || null,
      path: path || null,
      occasions: Number(occasions),
      weeklyMinutes: Number(minutes),
      reviewMinutes: Number(reviewMinutes),
      barrier: barrierKind && barrierChoice ? { kind: barrierKind, choice: barrierChoice } : null,
      edits: edit.trim() ? { entregable: edit.trim() } : null,
    };
  }

  async function confirm(choice: 'ACCEPT' | 'REJECT', adoptFamilyId?: string) {
    const token = getAccessToken();
    if (!token || !preview) return;
    setLoading(true);
    setError('');
    try {
      const row = await confirmAccompaniment(token, {
        ...body(),
        choice,
        digest: preview.digest,
        headVersion: preview.headVersion,
        planChoice: preview.plan && planChoice ? planChoice : null,
        expectedPlanUpdatedAt: preview.plan?.updatedAt ?? null,
        adoptFamilyId: adoptFamilyId ?? null,
        commandKey: `web:${preview.digest}:${choice}:${adoptFamilyId ?? ''}`,
      });
      setSaved(choice === 'REJECT' ? 'Quedó el rechazo. Puedes elegir otra meta compatible.' : 'Quedó confirmado el futuro. El índice no se reescribió.');
      setPreview({ ...preview, help: row.help ?? preview.help });
    } catch (err) {
      setError(err instanceof JourneyApiError ? err.message : err instanceof Error ? err.message : 'No se pudo confirmar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onPreview} className="mk-form" aria-busy={loading}>
      <h2>Ayuda para esta meta</h2>
      <label>Meta<input value={goalText} onChange={(event) => setGoalText(event.target.value)} required /></label>
      <label>
        Tipo
        <select value={goalKind} onChange={(event) => setGoalKind(event.target.value)}>
          {KINDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>
        Ámbito
        <select value={territory} onChange={(event) => setTerritory(event.target.value)}>
          <option value="MENTALIDAD">Mentalidad</option>
          <option value="RELACIONES">Relaciones</option>
          <option value="FINANZAS">Finanzas</option>
          <option value="SALUD_FISICA">Salud física</option>
        </select>
      </label>
      <label>Ocasiones<input value={occasions} onChange={(event) => setOccasions(event.target.value)} inputMode="numeric" /></label>
      <label>Minutos de la semana<input value={minutes} onChange={(event) => setMinutes(event.target.value)} inputMode="numeric" /></label>
      <label>Minutos de revisión<input value={reviewMinutes} onChange={(event) => setReviewMinutes(event.target.value)} inputMode="numeric" /></label>
      <label>
        Preferencia de ayuda
        <select aria-label="Preferencia de ayuda" value={preference} onChange={(event) => setPreference(event.target.value)}>
          <option value="">Guiada</option>
          <option value="PUNTUAL">Puntual, cuando la pida</option>
          <option value="PROPIO">Seguir mi plan</option>
        </select>
      </label>
      <label>
        Situación
        <select value={situation} onChange={(event) => setSituation(event.target.value)}>
          <option value="">Ninguna</option>
          <option value="PAUSE">Pausa</option>
          <option value="RETURN">Retorno</option>
        </select>
      </label>
      <label>
        Barrera, si quieres nombrarla
        <select value={barrierKind} onChange={(event) => setBarrierKind(event.target.value)}>
          <option value="">Sin barrera</option>
          <option value="PULIR_ANTES_DE_MOSTRAR">Pulir antes de mostrar</option>
          <option value="PLANIFICACION_POR_ACLARAR">Preparación por aclarar</option>
          <option value="SIN_OCASION">Sin ocasión</option>
          <option value="OTRA">Otra</option>
        </select>
      </label>
      {barrierKind ? (
        <fieldset>
          <legend>Sobre esa barrera</legend>
          {BARRIER_CHOICES.map(([value, label]) => (
            <label key={value}>
              <input type="radio" name="barrier-choice" value={value} checked={barrierChoice === value} onChange={() => setBarrierChoice(value)} />
              {label}
            </label>
          ))}
        </fieldset>
      ) : null}
      <label>Corrección del entregable<textarea value={edit} onChange={(event) => setEdit(event.target.value)} rows={2} /></label>
      <button type="submit" className="mk-member-btn" disabled={loading}>{loading ? 'Preparando' : 'Ver ayuda'}</button>
      {error ? <p role="alert">{error}</p> : null}
      {preview ? (
        <div>
          <HelpDraftView help={preview.help} />
          {preview.plan ? (
            <fieldset>
              <legend>Ya hay un plan</legend>
              {(['KEEP', 'MODIFY', 'REPLACE'] as const).map((value) => (
                <label key={value}>
                  <input type="radio" name="plan-choice" value={value} checked={planChoice === value} onChange={() => setPlanChoice(value)} />
                  {value === 'KEEP' ? 'Mantenerlo' : value === 'MODIFY' ? 'Modificar el futuro' : 'Sustituirlo'}
                </label>
              ))}
            </fieldset>
          ) : null}
          <button type="button" className="mk-member-btn" disabled={loading} onClick={() => void confirm('ACCEPT')}>Confirmar</button>
          <button type="button" disabled={loading} onClick={() => void confirm('REJECT')}>No ahora</button>
          {preview.proposal.alternative?.requiresApproval ? (
            <button type="button" disabled={loading} onClick={() => void confirm('ACCEPT', preview.proposal.alternative?.familyId)}>
              Usar la alternativa
            </button>
          ) : null}
        </div>
      ) : null}
      {saved ? <p>{saved}</p> : null}
    </form>
  );
}
