'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AppIcon } from '@/components/app-icon';
import { useAuthSession } from '@/components/auth-session-provider';
import { AppReveal, useAppEntranceOnce } from '@/components/motion/app-reveal';
import { ProgressReveal } from '@/components/motion/progress-reveal';
import {
  APP_MOTION,
  MOTION_EASE,
  MOTION_SESSION,
} from '@/components/motion/tokens';
import { apiDiagnosticProgress, apiDiagnosticRestart, type DiagnosticProgressDto } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { canUseMemberProduct } from '@/lib/member-access';

const DIAGNOSTIC_IN_PROGRESS_STEPS = new Set([
  'TERMS_PENDING',
  'DIAGNOSTICO_BIENVENIDA',
  'FASE1_EN_CURSO',
]);

const UNLOCK_KEY = 'mk_ruta_unlock_seen';

function fichaStatus(status: string): string {
  if (status === 'COMPLETE') return 'Terminada';
  if (status === 'IN_PROGRESS') return 'En progreso';
  if (status === 'AVAILABLE') return 'Disponible';
  if (status === 'LOCKED') return 'Bloqueada';
  return 'Pendiente';
}

export function RutaContent() {
  const { status, user } = useAuthSession();
  const [progress, setProgress] = useState<DiagnosticProgressDto>(null);
  const [loaded,   setLoaded]   = useState(false);
  const { shouldAnimate: entrance } = useAppEntranceOnce(`${MOTION_SESSION.dashboardEntrance}:ruta`);
  const reduced = useReducedMotion();
  const [unlockPulse, setUnlockPulse] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !user) return;
    const token = getAccessToken();
    if (!token) { setLoaded(true); return; }

    const step = user.onboardingStep ?? 'TERMS_PENDING';
    if (DIAGNOSTIC_IN_PROGRESS_STEPS.has(step) || step === 'PROFILE_COMPLETE' || step === 'BLUEPRINT_READY') {
      apiDiagnosticProgress(token)
        .then((p) => setProgress(p))
        .catch(() => {})
        .finally(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, [status, user]);

  const step = user?.onboardingStep ?? 'TERMS_PENDING';
  const canUseProduct = canUseMemberProduct(user);
  const isInProgress = canUseProduct && DIAGNOSTIC_IN_PROGRESS_STEPS.has(step);
  const isComplete = step === 'PROFILE_COMPLETE' || step === 'BLUEPRINT_READY';
  const auditoria1Pct = progress?.completionPct ?? 0;
  const hasStarted =
    auditoria1Pct > 0 || (progress?.modules.some((m) => m.answeredQuestions > 0) ?? false);

  useEffect(() => {
    if (!isComplete || reduced) return;
    try {
      if (sessionStorage.getItem(UNLOCK_KEY)) return;
      sessionStorage.setItem(UNLOCK_KEY, '1');
      setUnlockPulse(true);
      const t = window.setTimeout(() => setUnlockPulse(false), APP_MOTION.duration.unlock * 1000);
      return () => window.clearTimeout(t);
    } catch {
      /* ignore */
    }
  }, [isComplete, reduced]);

  if (!canUseProduct) {
    return (
      <div className="mk-dashboard">
        <AppReveal active={entrance}>
          <div className="mk-progress-hero">
            <p className="mk-section-eyebrow">RUTA MK</p>
            <h2 className="mk-progress-hero__title">Disponible en el lanzamiento.</h2>
            <p className="mk-progress-hero__sub">
              Las auditorías y el progreso por etapas se activan cuando abramos la plataforma. Tu
              cuenta de fundador ya está lista.
            </p>
            <Link href="/sistema" className="mk-btn-primary">
              Explorar el sistema →
            </Link>
          </div>
        </AppReveal>
      </div>
    );
  }

  async function restart() {
    const token = getAccessToken();
    if (!token) return;
    await apiDiagnosticRestart(token);
    const next = await apiDiagnosticProgress(token);
    setProgress(next);
  }

  return (
    <div className="mk-dashboard">
      <AppReveal active={entrance}>
        <div>
          <p className="mk-section-eyebrow">RUTA MK</p>
          <h2 className="mk-page-title">Fichas de esta cuenta</h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-hanken,system-ui)', lineHeight: 1.6, margin: 0 }}>
            El orden lo marca el servidor. Una ficha bloqueada espera a la anterior.
          </p>
        </div>
      </AppReveal>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {(progress?.modules ?? []).map((mod, index) => (
          <div key={mod.slug} className={`mk-ruta-card${mod.status === 'COMPLETE' ? ' mk-ruta-card--done' : ''}${mod.status === 'LOCKED' ? ' mk-ruta-card--locked' : ''}`}>
            <div className="mk-ruta-card__header">
              <div>
                <p className="mk-ruta-card__eyebrow">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mk-ruta-card__name">{mod.titleEs}</h3>
              </div>
              <div className={`mk-ruta-card__status-badge${mod.status === 'COMPLETE' ? ' mk-ruta-card__status-badge--done' : ''}${mod.status === 'LOCKED' ? ' mk-ruta-card__status-badge--locked' : ''}`}>
                {fichaStatus(mod.status)}
              </div>
            </div>
            {mod.status === 'LOCKED' ? (
              <div className="mk-ruta-card__lock-note">La ficha anterior no está terminada.</div>
            ) : null}
            <p className="mk-ruta-card__sub">{mod.answeredQuestions} de {mod.totalQuestions}</p>
          </div>
        ))}
      </div>

      <div className="mk-form__actions">
        <Link href="/diagnostico" className="mk-btn-primary">
          {hasStarted ? 'Continuar' : 'Comenzar'}
        </Link>
        {isComplete ? <Link href="/proposito" className="mk-btn-ghost">Hoja de ruta</Link> : null}
        {isComplete ? <Link href="/planes" className="mk-btn-ghost">Plan vigente</Link> : null}
        <button type="button" className="mk-btn-ghost" onClick={() => { void restart(); }}>
          Empezar otra sesión
        </button>
      </div>
    </div>
  );
}
