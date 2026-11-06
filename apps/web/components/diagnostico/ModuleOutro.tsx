'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { apiDiagnosticState, type AuditCloseDto, type DiagnosticState } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { continuePastModule } from '@/lib/diagnostic-continue';
import { questionnaireStageLabel, ProgressRail } from './ProgressRail';
import { PlayerStage } from './PlayerStage';
import { AuditCloseScreen } from './AuditCloseScreen';

export function ModuleOutro() {
  const router = useRouter();
  const params = useParams<{ moduleSlug: string }>();
  const { status, refresh } = useAuthSession();
  const slug = params.moduleSlug;
  const isAuditClose = slug === 'e-aud-s6';
  const [loading, setLoading] = useState(!isAuditClose);
  const [error, setError] = useState<string | null>(null);
  const [pct, setPct] = useState(0);
  const [auditClose, setAuditClose] = useState<AuditCloseDto | null>(null);
  const [revisitQuestionId, setRevisitQuestionId] = useState<string | null>(null);
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

  async function handleBack() {
    if (!revisitQuestionId) return;
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const state = await apiDiagnosticState(token, { at: revisitQuestionId });
      if (state.sessionState.currentModuleSlug) {
        router.replace(`/diagnostico/modulo/${state.sessionState.currentModuleSlug}/pregunta`);
      }
    } catch {
      setError('No pudimos volver. Revisa tu conexión e intenta de nuevo.');
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (started.current) return;
    started.current = true;
    const token = getAccessToken();
    if (!token) return;

    if (isAuditClose) {
      apiDiagnosticState(token)
        .then((s) => {
          setPct(s.sessionState.completionPct);
          if (s.nextStep.type === 'module_outro' && s.nextStep.data.auditClose) {
            setAuditClose(s.nextStep.data.auditClose);
            setRevisitQuestionId(s.nextStep.data.auditClose.revisitQuestionId);
          } else {
            setError('No pudimos mostrar el cierre del cuestionario.');
          }
          setLoading(false);
        })
        .catch(() => {
          setError('No pudimos cargar el cierre. Inténtalo nuevamente.');
          setLoading(false);
        });
      return;
    }

    if (token) {
      apiDiagnosticState(token)
        .then((s) => setPct(s.sessionState.completionPct))
        .catch(() => {});
    }
    void handleContinue();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, slug, isAuditClose]);

  return (
    <PlayerStage
      header={(
        <ProgressRail
          pct={pct}
          contextLabel={questionnaireStageLabel(slug)}
          variant="outro"
          back={isAuditClose && revisitQuestionId ? { onClick: handleBack, disabled: loading } : null}
        />
      )}
      primary={{
        label: loading ? 'Cargando…' : 'Continuar',
        onClick: handleContinue,
        disabled: loading || (isAuditClose && !auditClose),
      }}
    >
      {error ? (
        <p className="dk-player-error" role="alert">{error}</p>
      ) : isAuditClose && auditClose ? (
        <AuditCloseScreen close={auditClose} />
      ) : !isAuditClose ? (
        <div className="auth-loading">
          <span className="auth-spinner" aria-hidden />
        </div>
      ) : (
        <div className="auth-loading">
          <span className="auth-spinner" aria-hidden />
        </div>
      )}
    </PlayerStage>
  );
}
