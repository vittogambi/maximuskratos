'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppIcon } from '@/components/app-icon';
import { useAuthSession } from '@/components/auth-session-provider';
import { apiDiagnosticProgress, type DiagnosticProgressDto } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';

const DIAGNOSTIC_IN_PROGRESS_STEPS = new Set([
  'TERMS_PENDING',
  'DIAGNOSTICO_BIENVENIDA',
  'FASE1_EN_CURSO',
]);

// Future auditorias — locked, pending client approval
const FUTURE_AUDITORIAS = [
  { id: 'E-AUD-002', name: 'Auditoría II', sub: 'Propósito e identidad avanzada' },
  { id: 'E-AUD-003', name: 'Auditoría III', sub: 'Entorno y relaciones' },
  { id: 'E-AUD-004', name: 'Auditoría IV', sub: 'Soberanía financiera' },
];

export function RutaContent() {
  const { status, user } = useAuthSession();
  const [progress, setProgress] = useState<DiagnosticProgressDto>(null);
  const [loaded,   setLoaded]   = useState(false);

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
  const isInProgress = DIAGNOSTIC_IN_PROGRESS_STEPS.has(step);
  const isComplete = step === 'PROFILE_COMPLETE' || step === 'BLUEPRINT_READY';
  const auditoria1Pct = progress?.completionPct ?? 0;

  return (
    <div className="mk-dashboard">
      <div>
        <p className="mk-section-eyebrow">SISTEMA DE AUDITORÍAS</p>
        <h2 style={{ fontFamily: 'var(--font-display,sans-serif)', fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0 0.5rem', lineHeight: 1.1 }}>
          Tu Ruta MK
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-hanken,system-ui)', lineHeight: 1.6, margin: 0 }}>
          Cada auditoría revela una capa más del sistema. Completa en orden.
        </p>
      </div>

      {/* Auditoria 1 */}
      <div className={`mk-ruta-card${isComplete ? ' mk-ruta-card--done' : ''}`}>
        <div className="mk-ruta-card__header">
          <div>
            <p className="mk-ruta-card__eyebrow">E-AUD-001</p>
            <h3 className="mk-ruta-card__name">Auditoría Inicial</h3>
            <p className="mk-ruta-card__sub">Mentalidad · Hábitos · Entorno · Finanzas · Relaciones</p>
          </div>
          <div className={`mk-ruta-card__status-badge${isComplete ? ' mk-ruta-card__status-badge--done' : ''}`}>
            {isComplete ? 'Completada' : isInProgress ? 'En progreso' : 'Disponible'}
          </div>
        </div>

        {/* Module breakdown */}
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

        {/* Progress bar */}
        <div className="mk-ruta-card__track">
          <div className="mk-ruta-card__fill" style={{ width: `${Math.min(100, auditoria1Pct)}%` }} />
        </div>

        {isInProgress && (
          <Link href="/diagnostico" className="mk-btn-primary" style={{ marginTop: '0.75rem', display: 'block', textAlign: 'center' }}>
            Continuar auditoría →
          </Link>
        )}
      </div>

      {/* Future auditorias */}
      <div>
        <p className="mk-section-eyebrow" style={{ marginBottom: '0.75rem' }}>PRÓXIMAS AUDITORÍAS</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {FUTURE_AUDITORIAS.map((a) => (
            <div key={a.id} className="mk-ruta-card mk-ruta-card--locked">
              <div className="mk-ruta-card__header">
                <div>
                  <p className="mk-ruta-card__eyebrow">{a.id}</p>
                  <h3 className="mk-ruta-card__name">{a.name}</h3>
                  <p className="mk-ruta-card__sub">{a.sub}</p>
                </div>
                <div className="mk-ruta-card__status-badge mk-ruta-card__status-badge--locked">
                  Bloqueada
                </div>
              </div>
              <div className="mk-ruta-card__lock-note">
                Pendiente 
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blueprint teaser */}
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
    </div>
  );
}
