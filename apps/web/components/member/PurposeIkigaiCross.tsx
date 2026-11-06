'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { journeySynthesis, saveSynthesis, type SynthesisActivity, type SynthesisPayload } from '@/lib/journey-api';
import { CROSS_VALUATION, crossValuationLabel } from '@/lib/direction-ui';

type Valuation = SynthesisPayload['combinations'][number]['valuation'];
type Link = SynthesisPayload['links'][number];

const FIELDS: SynthesisActivity['field'][] = ['pasion', 'vocacion', 'mision', 'profesion'];

function newId(): string {
  return crypto.randomUUID();
}

/**
 * The cross of the questionnaire IKIGAI (cruce-cualitativo). The person links two activities from different
 * fields and says whether the link makes sense. MK does not create links and does not compute a purpose here.
 */
export function PurposeIkigaiCross() {
  const [data, setData] = useState<SynthesisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fromRef, setFromRef] = useState('');
  const [toRef, setToRef] = useState('');
  const [reason, setReason] = useState('');
  const [valuation, setValuation] = useState<Valuation>(null);

  const load = useCallback(() => {
    const token = getAccessToken();
    if (!token) return;
    journeySynthesis(token)
      .then(setData)
      .catch(() => setError('No pudimos cargar tu IKIGAI. Inténtalo nuevamente.'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fieldName = useCallback(
    (field: SynthesisActivity['field']) => data?.catalog[field]?.sourceName ?? field,
    [data],
  );
  const byRef = useMemo(() => new Map((data?.activities ?? []).map((row) => [row.sourceRef, row])), [data]);
  const from = byRef.get(fromRef) ?? null;
  const targets = (data?.activities ?? []).filter((row) => from && row.field !== from.field);
  const crosses = (data?.combinations ?? []).flatMap((combination) => {
    const links = (data?.links ?? []).filter((link) => link.combinationId === combination.id && link.status !== 'RETIRED');
    return links.length ? [{ combination, links }] : [];
  });
  const fieldsWithActivities = new Set((data?.activities ?? []).map((row) => row.field)).size;

  async function persist(next: Pick<SynthesisPayload, 'links' | 'combinations'>, message: string) {
    const token = getAccessToken();
    if (!token || !data) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await saveSynthesis(token, {
        activities: data.activities,
        links: next.links,
        combinations: next.combinations,
        purpose: data.purpose,
      });
      setData(await journeySynthesis(token));
      setNotice(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar. Inténtalo nuevamente.');
    } finally {
      setBusy(false);
    }
  }

  async function addCross() {
    if (!data || !from || !toRef || !valuation) return;
    const combinationId = newId();
    const link: Link = { id: newId(), fromRef: from.sourceRef, toRef, combinationId, reason: '', status: 'ACTIVE' };
    await persist({
      links: [...data.links, link],
      combinations: [...data.combinations, { id: combinationId, reason: reason.trim(), valuation, valuationReason: '', experiment: '' }],
    }, 'Guardamos la conexión con tu respuesta sobre ella.');
    setFromRef('');
    setToRef('');
    setReason('');
    setValuation(null);
  }

  async function revalue(combinationId: string, next: Valuation) {
    if (!data) return;
    await persist({
      links: data.links,
      combinations: data.combinations.map((row) => (row.id === combinationId ? { ...row, valuation: next } : row)),
    }, 'Actualizamos tu respuesta sobre esa conexión.');
  }

  async function retire(combinationId: string) {
    if (!data) return;
    await persist({
      links: data.links.map((link) => (link.combinationId === combinationId ? { ...link, status: 'RETIRED' as const } : link)),
      combinations: data.combinations,
    }, 'Quitamos la conexión.');
  }

  if (error && !data) return <p className="mk-m-error" role="alert">{error}</p>;
  if (!data) return <div className="mk-mx-skeleton" aria-busy="true"><span /><span /></div>;

  const template = data.purpose.edited?.trim() || data.purpose.generated.trim();

  return (
    <section className="mk-dir-ik" aria-labelledby="dir-ik-title" id="ikigai">
      <h2 id="dir-ik-title" className="mk-dir-mode__section-title">Conexiones entre tus actividades</h2>
      <p className="mk-m-field-help">
        Si ves que dos actividades de campos distintos tienen que ver, puedes conectarlas y decir si esa conexión tiene sentido para ti. MK no crea conexiones ni calcula un propósito con ellas.
      </p>

      {data.activities.length === 0 ? (
        <p className="mk-plans-body">Todavía no hay actividades de IKIGAI en tu cuestionario.</p>
      ) : null}

      {crosses.length ? (
        <ul className="mk-dir-ik__list">
          {crosses.map(({ combination, links }) => (
            <li key={combination.id} className="mk-dir-ik__cross">
              {links.map((link) => {
                const a = byRef.get(link.fromRef);
                const b = byRef.get(link.toRef);
                return (
                  <p key={link.id} className="mk-plans-body">
                    «{a?.answer}» <span className="mk-m-muted">({a ? fieldName(a.field) : ''})</span> con «{b?.answer}» <span className="mk-m-muted">({b ? fieldName(b.field) : ''})</span>
                  </p>
                );
              })}
              {combination.reason ? <p className="mk-m-muted">Por qué: {combination.reason}</p> : null}
              {links.some((link) => link.status === 'NEEDS_REVIEW') ? (
                <p className="mk-m-callout">Cambiaste una de estas respuestas en el cuestionario. Mira si la conexión sigue.</p>
              ) : null}
              <p className="mk-dir-ik__state">Tu respuesta: {crossValuationLabel(combination.valuation)}</p>
              <div className="mk-dir-ik__options" role="group" aria-label="¿Esta conexión tiene sentido para ti?">
                {CROSS_VALUATION.map((row) => (
                  <button
                    key={row.value}
                    type="button"
                    className="mk-mx__action"
                    aria-pressed={combination.valuation === row.value}
                    disabled={busy}
                    onClick={() => void revalue(combination.id, row.value)}
                  >
                    {row.label}
                  </button>
                ))}
              </div>
              <button type="button" className="mk-mx__textlink" disabled={busy} onClick={() => void retire(combination.id)}>
                Quitar esta conexión
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {fieldsWithActivities >= 2 ? (
        <div className="mk-dir-ik__new">
          <h3 className="mk-dir-ik__subtitle">Conectar dos actividades</h3>
          <label className="mk-m-label" htmlFor="dir-ik-from">Una actividad</label>
          <select id="dir-ik-from" className="mk-m-input" value={fromRef} onChange={(e) => { setFromRef(e.target.value); setToRef(''); }}>
            <option value="">Elige una</option>
            {FIELDS.map((field) => {
              const rows = data.activities.filter((row) => row.field === field);
              return rows.length ? (
                <optgroup key={field} label={fieldName(field)}>
                  {rows.map((row) => <option key={row.sourceRef} value={row.sourceRef}>{row.answer}</option>)}
                </optgroup>
              ) : null;
            })}
          </select>
          <label className="mk-m-label" htmlFor="dir-ik-to">Con otra de un campo distinto</label>
          <select id="dir-ik-to" className="mk-m-input" value={toRef} disabled={!from} onChange={(e) => setToRef(e.target.value)}>
            <option value="">{from ? 'Elige una' : 'Primero elige la primera actividad'}</option>
            {targets.map((row) => <option key={row.sourceRef} value={row.sourceRef}>{fieldName(row.field)}: {row.answer}</option>)}
          </select>
          <label className="mk-m-label" htmlFor="dir-ik-reason">¿Por qué crees que tienen que ver? (opcional)</label>
          <textarea id="dir-ik-reason" className="mk-m-textarea" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          <fieldset className="mk-dir-ik__fieldset">
            <legend className="mk-m-label">¿Esta conexión tiene sentido para ti?</legend>
            <div className="mk-dir-ik__options">
              {CROSS_VALUATION.map((row) => (
                <button
                  key={row.value}
                  type="button"
                  className="mk-mx__action"
                  aria-pressed={valuation === row.value}
                  onClick={() => setValuation(row.value)}
                >
                  {row.label}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            className="mk-mx__action mk-mx__action--primary"
            disabled={busy || !from || !toRef || !valuation}
            onClick={() => void addCross()}
          >
            {busy ? 'Guardando…' : 'Guardar esta conexión'}
          </button>
          {!from || !toRef || !valuation ? (
            <p className="mk-m-field-help">Para guardar, elige dos actividades y di si la conexión tiene sentido para ti.</p>
          ) : null}
        </div>
      ) : data.activities.length ? (
        <p className="mk-m-field-help">Para conectar hacen falta actividades en al menos dos campos.</p>
      ) : null}

      {template ? (
        <div className="mk-dir-ik__template">
          <h3 className="mk-dir-ik__subtitle">Frase de la plantilla del cruce</h3>
          <p className="mk-plans-body">{template}</p>
          <p className="mk-m-field-help">
            La armó la plantilla con las actividades que elegiste para cada campo. No es un propósito confirmado. Si te sirve, puedes partir de ella en «Tengo una idea para explorar».
          </p>
        </div>
      ) : null}

      {error ? <p className="mk-m-error" role="alert">{error}</p> : null}
      {notice ? <p className="mk-m-success" role="status">{notice}</p> : null}
    </section>
  );
}
