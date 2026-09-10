'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IkigaiShell } from '@/components/ikigai/shell';
import { IkigaiApiError, ikigaiApi } from '@/lib/ikigai-api';
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
              className="ik-btn-quiet font-label-lg"
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
      <p className="ik-kicker">IKIGAI</p>
      <h1 className="ik-question font-body">Construye una hipótesis de dirección.</h1>
      <p className="font-body-md ik-support">
        Recorre lo que te mueve, lo que puedes aportar, lo que vale la pena atender y lo que puede
        sostenerte. Conecta las piezas que para ti van juntas y pon una dirección a prueba.
      </p>
      {resume ? (
        <p className="ik-note">
          {resume.incomplete ? 'Tienes un mapa empezado' : 'Ya tienes un mapa'}
        </p>
      ) : null}
      {error ? (
        <p className="ik-warn" role="alert">
          {error}
        </p>
      ) : null}
      <p className="ik-note">Tus respuestas quedan en este dispositivo y no se publican.</p>
    </IkigaiShell>
  );
}
