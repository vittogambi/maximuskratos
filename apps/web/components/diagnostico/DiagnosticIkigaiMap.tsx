'use client';

import { useState } from 'react';
import { IkigaiCircles } from '@/components/ikigai/ikigai-circles';
import type { IkigaiDefinition, IkigaiFieldKey } from '@/lib/ikigai-api';

const ZOOM = [1, 1.4, 1.8, 2.2];

const MAP_DEFINITION = {
  fields: [
    { key: 'PASION', title: 'Lo que amas' },
    { key: 'CAPACIDAD', title: 'En lo que eres bueno' },
    { key: 'NECESIDAD', title: 'Lo que el mundo necesita' },
    { key: 'VALOR', title: 'Por lo que te pueden pagar' },
  ],
} as IkigaiDefinition;

const EMPTY_UNCLEAR: Record<IkigaiFieldKey, boolean> = {
  PASION: false,
  CAPACIDAD: false,
  NECESIDAD: false,
  VALOR: false,
};

export function DiagnosticIkigaiMap({
  focus,
  counts,
  reached,
}: {
  focus: IkigaiFieldKey;
  counts: Record<IkigaiFieldKey, number>;
  reached: IkigaiFieldKey[];
}) {
  const [step, setStep] = useState(0);
  const scale = ZOOM[step] ?? 1;
  return (
    <div className={step === 0 ? 'dk-ik-map' : 'dk-ik-map is-zoomed'}>
      <div className="dk-ik-zoom">
        <button type="button" aria-label="Alejar" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
          Alejar
        </button>
        <button type="button" aria-label="Acercar" disabled={step === ZOOM.length - 1} onClick={() => setStep((current) => Math.min(ZOOM.length - 1, current + 1))}>
          Acercar
        </button>
      </div>
      <div className="dk-ik-map__view">
        <div className="dk-ik-map__stage" style={{ width: `${scale * 100}%` }}>
          <IkigaiCircles
            definition={MAP_DEFINITION}
            counts={counts}
            unclear={EMPTY_UNCLEAR}
            markers={[]}
            focus={focus}
            reached={reached}
          />
        </div>
      </div>
    </div>
  );
}
