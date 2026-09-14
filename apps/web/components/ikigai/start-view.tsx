'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IkigaiShell } from '@/components/ikigai/shell';
import { IkigaiApiError, ikigaiApi } from '@/lib/ikigai-api';
import { LANDING_IMAGES } from '@/lib/assets';
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from '@/lib/ikigai-ui/storage';

export function StartView() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState<{ sessionId: string; incomplete: boolean } | null>(null);

  useEffect(() => {
    const stored = readStoredSession();
    if (!stored) return;
    void ikigaiApi
      .getSession(stored.sessionId, stored.token)
      .then((res) => {
        const incomplete = res.session.status === 'NEW' || res.session.status === 'IN_PROGRESS';
        setResume({ sessionId: stored.sessionId, incomplete });
      })
      .catch(() => {
        clearStoredSession();
      });
  }, []);

  async function startNew() {
    setBusy(true);
    setError(null);
    try {
      const created = await ikigaiApi.createSession({
        path: '/ikigai/empezar',
        device: window.innerWidth < 768 ? 'mobile' : 'desktop',
      });
      writeStoredSession({ sessionId: created.session.id, token: created.token });
      router.push(`/ikigai/s/${created.session.id}`);
    } catch (err) {
      setError(err instanceof IkigaiApiError ? err.message : 'No pudimos empezar. Reintenta.');
      setBusy(false);
    }
  }

  function continueSession() {
    const stored = readStoredSession();
    if (!stored) return;
    if (resume && !resume.incomplete) {
      router.push(`/ikigai/s/${stored.sessionId}/resultado`);
      return;
    }
    router.push(`/ikigai/s/${stored.sessionId}`);
  }

  return (
    <IkigaiShell
      moment="IKIGAI"
      onExit={() => router.push('/ikigai')}
      stackActions
      actions={
        resume ? (
          <>
            <button
              type="button"
              className="ag-btn-primary font-label-lg"
              disabled={busy}
              onClick={continueSession}
            >
              {resume.incomplete ? 'Continuar donde quedé' : 'Ver mi mapa'}
            </button>
            <button
              type="button"
              className="ik-btn-quiet"
              disabled={busy}
              onClick={() => void startNew()}
            >
              Empezar de nuevo
            </button>
          </>
        ) : (
          <button
            type="button"
            className="ag-btn-primary font-label-lg"
            disabled={busy}
            onClick={() => void startNew()}
          >
            Empezar
          </button>
        )
      }
    >
      <div className="ik-start">
        <div className="ik-start__figure" aria-hidden>
          <img
            src={LANDING_IMAGES.ikigaiHero}
            alt=""
            width={1536}
            height={1024}
            fetchPriority="high"
          />
        </div>
        <div className="ik-start__copy">
          <h1 className="ik-question font-body">Empieza por ordenar las piezas.</h1>
          <p className="font-body-md ik-support">
            Explora lo que te mueve, lo que puedes aportar, lo que te importa y lo que puede
            sostenerte. Conecta lo que tenga sentido para ti y dale forma a una dirección que puedas
            seguir explorando.
          </p>
          {resume ? (
            <p className="ik-note">
              {resume.incomplete ? 'Ya tienes un mapa empezado' : 'Ya tienes un mapa'}
            </p>
          ) : null}
          {error ? (
            <p className="ik-warn" role="alert">
              {error}
            </p>
          ) : null}
          <p className="ik-note">Tu avance queda guardado y tus respuestas no se publican.</p>
        </div>
      </div>
    </IkigaiShell>
  );
}
