'use client';

import { useMemo, useState } from 'react';
import { addAction, createPlan, type SynthesisActivity, type SynthesisPayload } from '@/lib/journey-api';
import { ExperimentObservations } from './ExperimentObservations';
import { getAccessToken } from '@/lib/auth-storage';

const FIELDS = ['pasion', 'vocacion', 'mision', 'profesion'] as const;
type Field = (typeof FIELDS)[number];

const VALUATION = [
  ['RECOGNIZED', 'Lo reconozco'],
  ['PARTIAL', 'Lo reconozco parcialmente'],
  ['NOT_RECOGNIZED', 'No lo reconozco'],
  ['INSUFFICIENT', 'Todavía no tengo información'],
] as const;

const COLORS = ['#1d4e89', '#8a5a00', '#1f6b4a', '#7a2f4b', '#3d4a2a', '#4a3f72'];

function newId(): string {
  return crypto.randomUUID();
}

function compose(activities: SynthesisActivity[], parts: SynthesisPayload['purpose']['parts']): { generated: string; open: string[] } {
  const text = (field: Field) => activities.find((item) => item.sourceRef === parts[field])?.answer.trim() ?? '';
  const pasion = text('pasion');
  const vocacion = text('vocacion');
  const mision = text('mision');
  const profesion = text('profesion');
  const open = [
    pasion ? '' : 'Qué actividad alimenta la pasión',
    vocacion ? '' : 'Qué actividad alimenta la vocación',
    mision ? '' : 'Qué actividad alimenta la misión',
    profesion ? '' : 'Qué actividad alimenta la profesión',
  ].filter(Boolean);
  if (pasion && vocacion && mision && profesion) {
    return {
      generated: `Mi propósito es poner mi ${pasion} y mi talento en ${vocacion} al servicio de ${mision}, generando valor a través de ${profesion}.`,
      open: [],
    };
  }
  const known = [
    pasion ? `pasión: ${pasion}` : '',
    vocacion ? `vocación: ${vocacion}` : '',
    mision ? `misión: ${mision}` : '',
    profesion ? `profesión: ${profesion}` : '',
  ].filter(Boolean);
  return { generated: known.length ? `Por ahora: ${known.join('. ')}.` : '', open };
}

export function IkigaiCross({
  data,
  saving,
  onSave,
}: {
  data: SynthesisPayload;
  saving: boolean;
  onSave: (next: SynthesisPayload) => void;
}) {
  const [activities, setActivities] = useState(data.activities);
  const [links, setLinks] = useState(data.links);
  const [combinations, setCombinations] = useState(data.combinations);
  const [purpose, setPurpose] = useState(data.purpose);
  const [origin, setOrigin] = useState<string | null>(null);
  const [activeId, setActiveId] = useState(data.combinations[0]?.id ?? '');
  const [notice, setNotice] = useState('');

  const columns = useMemo(() => FIELDS.map((field) => ({
    field,
    label: data.catalog[field]?.question ?? field,
    source: data.catalog[field]?.sourceName ?? field,
    items: activities.filter((item) => item.field === field),
  })), [activities, data.catalog]);

  function colorOf(combinationId: string): string {
    const index = combinations.findIndex((item) => item.id === combinationId);
    return COLORS[(index < 0 ? 0 : index) % COLORS.length];
  }

  function labelOf(combinationId: string): string {
    const index = combinations.findIndex((item) => item.id === combinationId);
    return `Combinación ${index + 1}`;
  }

  async function useExperiment(combination: SynthesisPayload['combinations'][number]) {
    const token = getAccessToken();
    const experiment = combination.experiment.trim();
    if (!token || !experiment) return;
    setNotice('');
    try {
      const plan = await createPlan(token, {
        title: combination.learningQuestion?.trim() || 'Experimento',
        outcome: combination.unknownNote?.trim() || experiment,
        priorityNote: experiment,
        linkKind: 'EXPLORATORY',
        purposeRevisionId: data.purposeRevisionId,
        sourceCombinationId: combination.id,
      });
      await addAction(token, plan.id, {
        title: experiment,
        doneWhen: combination.learningQuestion?.trim() || 'Anoté lo que observé.',
        weekday: 1,
      });
      setNotice('El experimento quedó en el plan y en el calendario. No cambia el índice de alineación.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'No se pudo crear el plan.');
    }
  }

  function pick(sourceRef: string, field: Field) {
    setNotice('');
    if (!origin) {
      setOrigin(sourceRef);
      return;
    }
    if (origin === sourceRef) {
      setOrigin(null);
      return;
    }
    const from = activities.find((item) => item.sourceRef === origin);
    if (!from || from.field === field) {
      setOrigin(sourceRef);
      setNotice('Elige un elemento de otra columna.');
      return;
    }
    const combinationId = activeId || newId();
    if (!combinations.some((item) => item.id === combinationId)) {
      setCombinations((current) => [...current, { id: combinationId, reason: '', valuation: null, valuationReason: '', experiment: '' }]);
      setActiveId(combinationId);
    }
    setLinks((current) => [...current, {
      id: newId(),
      fromRef: from.sourceRef,
      toRef: sourceRef,
      combinationId,
      reason: '',
      status: 'ACTIVE',
    }]);
    setOrigin(null);
  }

  function updateActivity(sourceRef: string, patch: Partial<SynthesisActivity>) {
    setActivities((current) => current.map((item) => (item.sourceRef === sourceRef ? { ...item, ...patch } : item)));
  }

  function save() {
    const draft = compose(activities, purpose.parts);
    onSave({
      ...data,
      activities,
      links,
      combinations,
      purpose: { ...purpose, generated: draft.generated, open: draft.open },
    });
  }

  const draft = compose(activities, purpose.parts);
  const active = combinations.find((item) => item.id === activeId) ?? null;

  return (
    <section className="mk-cross" aria-label="Cruce de actividades">
      <h2>Cruce</h2>
      <p>
        Cuatro columnas con lo que escribiste. Conectar no calcula un propósito y no exige que los textos sean iguales.
        La valoración solo ordena la reflexión.
      </p>
      {activities.length === 0 ? <p>Todavía no hay actividades guardadas en el cuestionario.</p> : null}
      <div className="mk-cross__board">
        {columns.map((column) => (
          <div key={column.field} className="mk-cross__column">
            <h3>{column.label}</h3>
            <p className="mk-cross__source">Campo de origen: {column.source}</p>
            {column.items.length === 0 ? <p>Sin actividades en esta columna.</p> : null}
            {column.items.map((item) => {
              const related = links.filter((link) => link.status !== 'RETIRED' && (link.fromRef === item.sourceRef || link.toRef === item.sourceRef));
              const combo = related[0]?.combinationId;
              return (
                <button
                  key={item.sourceRef}
                  type="button"
                  className={origin === item.sourceRef ? 'mk-cross__card is-origin' : 'mk-cross__card'}
                  style={combo ? { borderColor: colorOf(combo) } : undefined}
                  aria-pressed={origin === item.sourceRef}
                  onClick={() => pick(item.sourceRef, column.field)}
                >
                  <strong>{item.answer}</strong>
                  {item.ambit ? <span>{item.ambit}</span> : <span>Sin ámbito</span>}
                  {item.fieldReview ? <span>{item.fieldReview}</span> : null}
                  {combo ? <span>{labelOf(combo)}{related.some((link) => link.status === 'NEEDS_REVIEW') ? '. Por revisar' : ''}</span> : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mk-cross__tools">
        <p>{origin ? 'Origen elegido. Elige el destino en otra columna.' : 'Elige un origen y después un destino.'}</p>
        <button type="button" className="mk-btn-ghost" onClick={() => {
          const id = newId();
          setCombinations((current) => [...current, { id, reason: '', valuation: null, valuationReason: '', experiment: '' }]);
          setActiveId(id);
        }}>Nueva combinación</button>
      </div>
      {notice ? <p role="status">{notice}</p> : null}
      <div className="mk-cross__combos">
        {combinations.map((combo, index) => (
          <article key={combo.id} className={combo.id === activeId ? 'is-active' : undefined}>
            <h3>
              <button type="button" onClick={() => setActiveId(combo.id)}>
                <span className="mk-cross__swatch" style={{ background: COLORS[index % COLORS.length] }} aria-hidden />
                Combinación {index + 1}
              </button>
            </h3>
            <ul>
              {links.filter((link) => link.combinationId === combo.id).map((link) => {
                const from = activities.find((item) => item.sourceRef === link.fromRef);
                const to = activities.find((item) => item.sourceRef === link.toRef);
                return (
                  <li key={link.id}>
                    <p>{from?.answer} con {to?.answer}. {link.status === 'NEEDS_REVIEW' ? 'Por revisar.' : link.status === 'RETIRED' ? 'Retirada.' : 'Vigente.'}</p>
                    <label>
                      Razón
                      <input value={link.reason} onChange={(event) => setLinks((current) => current.map((item) => item.id === link.id ? { ...item, reason: event.target.value } : item))} />
                    </label>
                    <button type="button" onClick={() => setLinks((current) => current.map((item) => item.id === link.id ? { ...item, status: 'RETIRED' } : item))}>Retirar vínculo</button>
                    {link.status === 'NEEDS_REVIEW' ? (
                      <button type="button" onClick={() => setLinks((current) => current.map((item) => item.id === link.id ? { ...item, status: 'ACTIVE' } : item))}>Ya la revisé</button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>
      {active ? (
        <div className="mk-form">
          <label>
            Valoración de la combinación seleccionada
            <select
              value={active.valuation ?? ''}
              onChange={(event) => setCombinations((current) => current.map((item) => item.id === active.id ? { ...item, valuation: (event.target.value || null) as typeof active.valuation } : item))}
            >
              <option value="">Sin valoración</option>
              {VALUATION.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
          <label>
            Razón de la valoración
            <textarea rows={2} value={active.valuationReason} onChange={(event) => setCombinations((current) => current.map((item) => item.id === active.id ? { ...item, valuationReason: event.target.value } : item))} />
          </label>
          <p>Pasión es interés, vocación es facilidad, misión es contribución y profesión es sostenibilidad. No son la misma pregunta.</p>
          {(['pasion', 'vocacion', 'mision', 'profesion'] as const).map((field) => (
            <label key={field}>
              {data.catalog[field]?.sourceName ?? field}
              <select
                value={active.fieldStance?.[field] ?? ''}
                onChange={(event) => setCombinations((current) => current.map((item) => item.id === active.id ? {
                  ...item,
                  fieldStance: { ...item.fieldStance, [field]: event.target.value || undefined },
                } : item))}
              >
                <option value="">Sin decir</option>
                <option value="RECOGNIZE">Lo reconozco</option>
                <option value="DOUBT">Lo dudo</option>
                <option value="UNKNOWN">Todavía no lo sé</option>
              </select>
            </label>
          ))}
          <label>
            Qué todavía no sabes
            <textarea rows={2} value={active.unknownNote ?? ''} onChange={(event) => setCombinations((current) => current.map((item) => item.id === active.id ? { ...item, unknownNote: event.target.value } : item))} />
          </label>
          <label>
            Pregunta de aprendizaje
            <textarea rows={2} value={active.learningQuestion ?? ''} onChange={(event) => setCombinations((current) => current.map((item) => item.id === active.id ? { ...item, learningQuestion: event.target.value } : item))} />
          </label>
          <label>
            Siguiente experimento, si quieres probarlo
            <textarea rows={2} value={active.experiment} onChange={(event) => setCombinations((current) => current.map((item) => item.id === active.id ? { ...item, experiment: event.target.value } : item))} />
          </label>
          <button type="button" className="mk-btn-ghost" disabled={!active.experiment.trim()} onClick={() => void useExperiment(active)}>Usar este experimento como plan</button>
        </div>
      ) : null}
      <ExperimentObservations
        onObserve={async () => { setNotice('Las observaciones se guardan en el experimento del plan. Preparar no prueba utilidad.'); }}
        onReview={async () => { setNotice('La revisión queda en la hipótesis. No confirma el propósito ni cambia la alineación.'); }}
      />
      <h2>Borrador de propósito</h2>
      <p>La plantilla es una ayuda. Si falta una parte, no queda publicado como propósito cerrado.</p>
      {FIELDS.map((field) => (
        <label key={field} className="mk-cross__part">
          {data.catalog[field]?.sourceName ?? field}
          <select
            value={purpose.parts[field] ?? ''}
            onChange={(event) => setPurpose((current) => ({ ...current, parts: { ...current.parts, [field]: event.target.value || undefined } }))}
          >
            <option value="">Sin elegir</option>
            {activities.map((item) => (
              <option key={item.sourceRef} value={item.sourceRef}>{item.answer}</option>
            ))}
          </select>
        </label>
      ))}
      {draft.open.length ? (
        <div>
          <p>Preguntas abiertas</p>
          <ul>{draft.open.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ) : null}
      {draft.generated ? <p>{draft.open.length ? 'Texto parcial' : 'Borrador'}: {draft.generated}</p> : null}
      <label className="mk-cross__part">
        Edición libre. Guardar de nuevo no la pisa.
        <textarea rows={3} value={purpose.edited ?? ''} onChange={(event) => setPurpose((current) => ({ ...current, edited: event.target.value }))} />
      </label>
      <label className="mk-cross__part">
        Estado
        <select value={purpose.status} onChange={(event) => setPurpose((current) => ({ ...current, status: event.target.value as SynthesisPayload['purpose']['status'] }))}>
          <option value="UNWORKED">Sin trabajar</option>
          <option value="EXPLORANDO">Explorando</option>
          <option value="PROVISIONAL">Provisional</option>
          <option value="CONFIRMADO_POR_USUARIO">Lo elijo como referencia</option>
        </select>
      </label>
      <div className="mk-cross__board">
        {activities.filter((item) => !item.ambit || !item.option).map((item) => {
          const ambits = data.catalog[item.field]?.ambits ?? [];
          const options = ambits.find((ambit) => ambit.label === item.ambit)?.options ?? [];
          return (
            <div key={item.sourceRef} className="mk-form">
              <p>Completa el ámbito de: {item.answer}</p>
              <select value={item.ambit} aria-label={`Ámbito de ${item.answer}`} onChange={(event) => updateActivity(item.sourceRef, { ambit: event.target.value, option: '' })}>
                <option value="">Ámbito</option>
                {ambits.map((ambit) => <option key={ambit.label} value={ambit.label}>{ambit.label}</option>)}
              </select>
              <select value={item.option} aria-label={`Opción de ${item.answer}`} onChange={(event) => updateActivity(item.sourceRef, { option: event.target.value })}>
                <option value="">Desarrollo de idea</option>
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          );
        })}
      </div>
      <button type="button" className="mk-btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando' : 'Guardar cruce'}</button>
    </section>
  );
}
