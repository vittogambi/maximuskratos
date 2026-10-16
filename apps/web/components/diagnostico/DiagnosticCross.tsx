'use client';

import { useEffect, useState } from 'react';
import { activityRows, type ActivityFieldName } from '@/lib/activity-map';

const ORDER: ActivityFieldName[] = ['pasion', 'vocacion', 'mision', 'profesion'];

export type CrossActivity = {
  sourceRef: string;
  field: ActivityFieldName;
  ambit: string;
  option: string;
  answer: string;
};

export type CrossMix = {
  id: string;
  parts: Record<ActivityFieldName, string>;
};

export type CrossDraft = {
  mixes: CrossMix[];
  chosenId: string;
  ready: boolean;
  sentence: string;
};

function answerOf(activities: CrossActivity[], parts: Partial<Record<ActivityFieldName, string>>, field: ActivityFieldName): string {
  return activities.find((item) => item.sourceRef === parts[field])?.answer ?? '';
}

export function purposeSentence(activities: CrossActivity[], parts: Partial<Record<ActivityFieldName, string>>): string {
  const pasion = answerOf(activities, parts, 'pasion');
  const vocacion = answerOf(activities, parts, 'vocacion');
  const mision = answerOf(activities, parts, 'mision');
  const profesion = answerOf(activities, parts, 'profesion');
  if (!pasion || !vocacion || !mision || !profesion) return '';
  return `Mi propósito es poner mi ${pasion} y mi talento en ${vocacion} al servicio de ${mision}, generando valor a través de ${profesion}.`;
}

function complete(parts: Partial<Record<ActivityFieldName, string>>): parts is Record<ActivityFieldName, string> {
  return ORDER.every((field) => Boolean(parts[field]));
}

export function DiagnosticCross({
  activities,
  step,
  onDraft,
}: {
  activities: CrossActivity[];
  step: 0 | 1;
  onDraft: (draft: CrossDraft) => void;
}) {
  const [draft, setDraft] = useState<Partial<Record<ActivityFieldName, string>>>({});
  const [mixes, setMixes] = useState<CrossMix[]>([]);
  const [chosenId, setChosenId] = useState('');
  const rows = activityRows();
  const preview = purposeSentence(activities, draft);
  const chosen = mixes.find((mix) => mix.id === chosenId);
  const sentence = chosen ? purposeSentence(activities, chosen.parts) : '';
  const ready = step === 0 ? mixes.length > 0 : Boolean(sentence);

  useEffect(() => {
    onDraft({ mixes, chosenId, ready, sentence });
  }, [mixes, chosenId, ready, sentence, onDraft]);

  function choose(field: ActivityFieldName, sourceRef: string) {
    setDraft((current) => ({ ...current, [field]: sourceRef }));
  }

  function saveMix() {
    if (!complete(draft)) return;
    const parts = { ...draft };
    setMixes((current) => [...current, { id: crypto.randomUUID(), parts }]);
    setDraft({});
  }

  return (
    <section className="dk-cross" aria-label="Cruce">
      {step === 0 ? (
        <>
          <p className="dk-shadow-result__title">Cruce</p>
          <h2 className="ik-question font-body">Arma las combinaciones que quieras explorar.</h2>
          <p className="dk-question-context">Elige una actividad de cada fila y guárdala. Puedes repetir el armado las veces que quieras.</p>
          {rows.map((row) => {
            const items = activities.filter((item) => item.field === row.field);
            return (
              <div key={row.field} className="dk-cross__row">
                <p className="dk-cross__label">{row.row}</p>
                {items.length === 0 ? <p className="dk-question-context">Falta al menos una actividad.</p> : null}
                <div className="dk-cross__items">
                  {items.map((item) => {
                    const on = draft[row.field] === item.sourceRef;
                    return (
                      <button
                        key={item.sourceRef}
                        type="button"
                        className={on ? 'dk-cross__chip is-on' : 'dk-cross__chip'}
                        aria-pressed={on}
                        onClick={() => choose(row.field, item.sourceRef)}
                      >
                        {item.answer}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {preview ? <p className="dk-cross__preview">{preview}</p> : null}
          <button type="button" className="dk-exception" disabled={!complete(draft)} onClick={saveMix}>
            Guardar esta posibilidad
          </button>
          {mixes.length > 0 ? (
            <ol className="dk-cross__saved">
              {mixes.map((mix, index) => (
                <li key={mix.id}>
                  <p>Posibilidad {index + 1}. {purposeSentence(activities, mix.parts)}</p>
                  <button type="button" className="dk-exception" onClick={() => setMixes((current) => current.filter((item) => item.id !== mix.id))}>
                    Quitar
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
        </>
      ) : null}
      {step === 1 ? (
        <>
          <p className="dk-shadow-result__title">Mi propósito general</p>
          <h2 className="ik-question font-body">Elige una de las posibilidades que exploraste.</h2>
          <div className="dk-cross__values">
            {mixes.map((mix, index) => (
              <button
                key={mix.id}
                type="button"
                className={chosenId === mix.id ? 'dk-cross__chip is-on' : 'dk-cross__chip'}
                aria-pressed={chosenId === mix.id}
                onClick={() => setChosenId(mix.id)}
              >
                Posibilidad {index + 1}. {purposeSentence(activities, mix.parts)}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
