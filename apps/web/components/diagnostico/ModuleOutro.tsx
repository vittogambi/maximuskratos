'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { apiDiagnosticState, type DiagnosticState } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { continuePastModule } from '@/lib/diagnostic-continue';
import { questionnaireStageLabel, ProgressRail } from './ProgressRail';
import { PlayerStage } from './PlayerStage';

export function ModuleOutro() {
  const router = useRouter();
  const params = useParams<{ moduleSlug: string }>();
  const { status, refresh } = useAuthSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pct, setPct] = useState(0);
  const started = useRef(false);

  async function goNext(state: DiagnosticState) {
    if (state.nextStep.type === 'question' && state.sessionState.currentModuleSlug) {
      router.replace(`/diagnostico/modulo/${state.sessionState.currentModuleSlug}/pregunta`);
      return;
    }
    if (state.nextStep.type === 'diagnostic_complete') {
      await refresh({ force: true });
      router.replace('/diagnostico/resultado');
      return;
    }
    throw new Error('unexpected_step');
  }

  async function handleContinue() {
    const token = getAccessToken();
    const slug = params.moduleSlug;
    if (!token || !slug) return;
    setLoading(true);
    setError(null);
    try {
      const next = await continuePastModule(token, slug);
      setPct(next.sessionState.completionPct);
      await goNext(next);
    } catch {
      setError('No pudimos continuar. Revisa tu conexión e intenta de nuevo.');
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (started.current) return;
    started.current = true;
    const token = getAccessToken();
    if (token) {
      apiDiagnosticState(token)
        .then((s) => setPct(s.sessionState.completionPct))
        .catch(() => {});
    }
    void handleContinue();
  // The resume route only exists to mark the module seen and leave.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, params.moduleSlug]);

  return (
    <PlayerStage
      header={(
        <ProgressRail
          pct={pct}
          contextLabel={questionnaireStageLabel(params.moduleSlug)}
          variant="outro"
        />
      )}
      primary={{
        label: loading ? 'Cargando…' : 'Continuar',
        onClick: handleContinue,
        disabled: loading,
      }}
    >
      {error ? (
        <p className="dk-player-error" role="alert">{error}</p>
      ) : (
        <div className="auth-loading">
          <span className="auth-spinner" aria-hidden />
        </div>
      )}
    </PlayerStage>
  );
}
