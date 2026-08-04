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
import { apiDiagnosticProgress, type DiagnosticProgressDto } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { isFounderAccessPhase } from '@/lib/product-phase';

const DIAGNOSTIC_IN_PROGRESS_STEPS = new Set([
  'TERMS_PENDING',
  'DIAGNOSTICO_BIENVENIDA',
  'FASE1_EN_CURSO',
]);

// Future auditorias — locked, pending client approval
const FUTURE_AUDITORIAS = [
  { id: 'aud-2', num: '02', name: 'Auditoría II', sub: 'Propósito e identidad avanzada' },
  { id: 'aud-3', num: '03', name: 'Auditoría III', sub: 'Entorno y relaciones' },
  { id: 'aud-4', num: '04', name: 'Auditoría IV', sub: 'Soberanía financiera' },
];

const UNLOCK_KEY = 'mk_ruta_unlock_seen';

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
  const isInProgress = !isFounderAccessPhase() && DIAGNOSTIC_IN_PROGRESS_STEPS.has(step);
  const isComplete = step === 'PROFILE_COMPLETE' || step === 'BLUEPRINT_READY';
  const auditoria1Pct = progress?.completionPct ?? 0;

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

  if (isFounderAccessPhase() && !isComplete) {
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

  return (
    <div className="mk-dashboard">
      <AppReveal active={entrance}>
        <div>
          <p className="mk-section-eyebrow">SISTEMA DE AUDITORÍAS</p>
          <h2 style={{ fontFamily: 'var(--font-display,sans-serif)', fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0 0.5rem', lineHeight: 1.1 }}>
            Tu Ruta MK
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-hanken,system-ui)', lineHeight: 1.6, margin: 0 }}>
            Cada auditoría revela una capa más del sistema. Completa en orden.
          </p>
        </div>
      </AppReveal>

      <div className="mk-ruta-ladder">
        <motion.span
          className="mk-ruta-ladder__line"
          aria-hidden
          initial={reduced || !entrance ? false : { scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{
            type: 'tween',
            duration: APP_MOTION.duration.reveal,
            ease: MOTION_EASE.enter,
            delay: entrance ? 0.08 : 0,
          }}
          style={{ transformOrigin: 'top center' }}
        />

        <AppReveal active={entrance} delay={APP_MOTION.stagger.base}>
          <div
            className={`mk-ruta-card${isComplete ? ' mk-ruta-card--done' : ''}${
              unlockPulse ? ' mk-ruta-card--unlock' : ''
            }`}
          >
            <div className="mk-ruta-card__header">
              <div>
                <p className="mk-ruta-card__eyebrow">01</p>
                <h3 className="mk-ruta-card__name">Auditoría Inicial</h3>
                <p className="mk-ruta-card__sub">Mentalidad · Hábitos · Entorno · Finanzas · Relaciones</p>
              </div>
              <div className={`mk-ruta-card__status-badge${isComplete ? ' mk-ruta-card__status-badge--done' : ''}`}>
                {isComplete ? 'Completada' : isInProgress ? 'En progreso' : 'Disponible'}
              </div>
            </div>

            {loaded && progress?.modules && progress.modules.length > 0 && (
              <div className="mk-ruta-card__modules">
                {progress.modules.map((mod) => {
                  const modPct = mod.totalQuestions > 0
                    ? Math.round((mod.answeredQuestions / mod.totalQuestions) * 100)
                    : 0;
                  return (
                    <div key={mod.slug} className="mk-ruta-module-row">
                      {mod.iconKey && (
                        <AppIcon name={mod.iconKey as import('@/components/icons/registry').AppIconName} size={14} />
                      )}
                      <span className="mk-ruta-module-row__name">{mod.titleEs}</span>
                      <span className={`mk-ruta-module-row__pct${mod.status === 'COMPLETE' ? ' mk-ruta-module-row__pct--done' : ''}`}>
                        {mod.status === 'COMPLETE'
                          ? '✓'
                          : mod.status === 'LOCKED' || mod.status === 'AVAILABLE'
                            ? '—'
                            : `${modPct}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <ProgressReveal
              value={Math.min(100, auditoria1Pct)}
              className="mk-ruta-card__track"
              fillClassName="mk-ruta-card__fill"
              startWhen="mount"
            />

            {isInProgress && (
              <Link href="/diagnostico" className="mk-btn-primary" style={{ marginTop: '0.75rem', display: 'block', textAlign: 'center' }}>
                Continuar auditoría →
              </Link>
            )}
          </div>
        </AppReveal>

        <AppReveal active={entrance} delay={APP_MOTION.stagger.base * 2}>
          <div>
            <p className="mk-section-eyebrow" style={{ marginBottom: '0.75rem' }}>PRÓXIMAS AUDITORÍAS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {FUTURE_AUDITORIAS.map((a) => (
                <div key={a.id} className="mk-ruta-card mk-ruta-card--locked">
                  <div className="mk-ruta-card__header">
                    <div>
                      <p className="mk-ruta-card__eyebrow">{a.num}</p>
                      <h3 className="mk-ruta-card__name">{a.name}</h3>
                      <p className="mk-ruta-card__sub">{a.sub}</p>
                    </div>
                    <div className="mk-ruta-card__status-badge mk-ruta-card__status-badge--locked">
                      Bloqueada
                    </div>
                  </div>
                  <div className="mk-ruta-card__lock-note">
                    Pendiente aprobación
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AppReveal>

        <AppReveal active={entrance} delay={APP_MOTION.stagger.base * 3}>
          <div className="mk-ruta-card mk-ruta-card--locked" style={{ borderColor: 'rgba(201,162,74,0.2)' }}>
            <div className="mk-ruta-card__header">
              <div>
                <p className="mk-ruta-card__eyebrow" style={{ color: 'rgba(201,162,74,0.5)' }}>BLUEPRINT</p>
                <h3 className="mk-ruta-card__name">Plan de 90 Días</h3>
                <p className="mk-ruta-card__sub">Fortalezas · Cuello de botella · Prioridades</p>
              </div>
              <div className="mk-ruta-card__status-badge mk-ruta-card__status-badge--locked">
                Próximamente
              </div>
            </div>
          </div>
        </AppReveal>
      </div>
    </div>
  );
}
