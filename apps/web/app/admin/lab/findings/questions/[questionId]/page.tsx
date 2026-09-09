'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { LabCard } from '@/components/admin/lab/primitives';
import { labApi, type LabObservationList } from '@/lib/lab-api';
import { humanError, labRunReturnPath } from '@/lib/lab-ui/format';
import { labUiLabels } from '@/lib/lab-ui/labels';

export default function QuestionObservationDetail({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = use(params);
  const reviewPath = labRunReturnPath(useSearchParams().get('from'));
  const [data, setData] = useState<LabObservationList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    labApi
      .observations()
      .then(setData)
      .catch((err) => setError(humanError(err, 'No pudimos cargar esta pregunta.').message));
  }, []);

  const item = data?.questions.find((row) => row.question_id === questionId);

  return (
    <div className="lab">
      <LabNav />
      <Link className="lab-back" href={reviewPath ?? '/admin/lab/findings/questions'}>
        {reviewPath ? 'Volver a la revisión' : 'Volver a preguntas marcadas'}
      </Link>
      {error ? <p className="lab-error">{error}</p> : null}
      {item ? (
        <div className="lab-stack">
          <header className="lab-hero">
            <p className="lab-q__id">{item.question_id}</p>
            <h1 className="admin-page-header__title">{item.text}</h1>
          </header>
          {item.observations.map((obs) => (
            <LabCard key={obs.id} title={obs.case_label ?? 'Sin caso'}>
              <p className="lab-muted">{obs.issue_types.map((code) => labUiLabels.issueType(code)).join(', ')}</p>
              <p>{obs.note}</p>
              {obs.proposal ? <p className="lab-muted">Propuesta: {obs.proposal}</p> : null}
              <p className="lab-muted">{labUiLabels.observationStatus(obs.status)}</p>
              <div className="lab-actions">
                <button
                  type="button"
                  className="lab-btn"
                  disabled={busy}
                  onClick={() => {
                    setBusy(true);
                    labApi
                      .observationFinding(obs.id, { title: title.trim() || `Pregunta ${item.question_id}` })
                      .then(() => labApi.observations().then(setData))
                      .finally(() => setBusy(false));
                  }}
                >
                  Crear hallazgo
                </button>
                <button
                  type="button"
                  className="lab-btn lab-btn--ghost"
                  disabled={busy}
                  onClick={() => {
                    setBusy(true);
                    labApi
                      .patchObservation(obs.id, { status: 'RESOLVED' })
                      .then(() => labApi.observations().then(setData))
                      .finally(() => setBusy(false));
                  }}
                >
                  Resolver
                </button>
              </div>
            </LabCard>
          ))}
          <LabCard title="Probar esta pregunta">
            <p className="lab-muted">
              Aquí puedes anotar un texto propuesto. Eso no cambia la definición publicada. Si el cambio no cabe
              en las operaciones actuales, queda como cambio de contenido pendiente.
            </p>
            <label className="lab-field">
              <span className="lab-label">Título del hallazgo si lo conviertes</span>
              <input className="lab-input" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
          </LabCard>
        </div>
      ) : null}
    </div>
  );
}
