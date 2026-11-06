'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { fetchDirectionOverview, type DirectionOverview } from '@/lib/journey-api';
import { PurposeEvidence } from './PurposeEvidence';
import { PurposeIkigaiCross } from './PurposeIkigaiCross';

/** Visión, Valores and IKIGAI as answered in the questionnaire, and the IKIGAI cross the person can work on. */
export function PurposeAnswersScreen() {
  const [overview, setOverview] = useState<DirectionOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setError('Inicia sesión para ver tus respuestas.');
      return;
    }
    fetchDirectionOverview(token)
      .then(setOverview)
      .catch(() => setError('No pudimos cargar tus respuestas. Inténtalo nuevamente.'));
  }, []);

  const ikigai = overview?.evidence.find((row) => row.id === 'ikigai');

  return (
    <div className="mk-m-page mk-dir-page">
      <Link href="/proposito" className="mk-dir-page__back mk-mx__textlink">← Volver a tu dirección</Link>
      <header className="mk-dir-page__header">
        <h1 className="mk-m-title">Lo que ya respondiste</h1>
        <p className="mk-dir-page__intro">
          Tus respuestas de Visión, Valores e IKIGAI, tal como las diste en el cuestionario. Aquí no hay puntajes ni interpretaciones.
        </p>
      </header>
      {error ? <p className="mk-m-error" role="alert">{error}</p> : null}
      {!overview && !error ? <div className="mk-mx-skeleton" aria-busy="true"><span /><span /></div> : null}
      {overview ? <PurposeEvidence sections={overview.evidence} /> : null}
      {ikigai && ikigai.answered > 0 ? <PurposeIkigaiCross /> : null}
    </div>
  );
}
