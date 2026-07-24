'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useState } from 'react';
import Image from 'next/image';
import { ArchetypePortrait } from '@/components/archetype/ArchetypePortrait';
import { AppIcon } from '@/components/app-icon';
import { useAuthSession } from '@/components/auth-session-provider';
import { PublicNav } from '@/components/public-nav';
import { apiDiagnosticProfile, apiDiagnosticProgress, type DiagnosticProgressDto, type MasterProfileDto } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { getArchetype, getArchetypeLabel } from '@/lib/archetypes';

const DIAGNOSTIC_IN_PROGRESS_STEPS = new Set([
  'TERMS_PENDING',
  'DIAGNOSTICO_BIENVENIDA',
  'FASE1_EN_CURSO',
]);

function getModuleStatusLabel(status: string): string {
  if (status === 'COMPLETE') return 'Completado';
  if (status === 'IN_PROGRESS') return 'En progreso';
  if (status === 'AVAILABLE') return 'Disponible';
  return 'Bloqueado';
}

function ModuleProgressBar({ pct, status }: { pct: number; status: string }) {
  const isLocked = status === 'LOCKED';
  return (
    <div
      style={{
        height: '3px',
        background: 'var(--color-border, #2d2d2d)',
        width: '100%',
        marginTop: '0.5rem',
      }}
    >
      {!isLocked && (
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, pct)}%`,
            background: 'linear-gradient(90deg, #8b0000, #ff0000)',
            transition: 'width 0.4s ease',
          }}
        />
      )}
    </div>
  );
}

// ── State A: Diagnostic in progress ──────────────────────────────────────────

function PanelStateA({ progress }: { progress: DiagnosticProgressDto }) {
  const pct = progress?.selfKnowledgePct ?? 0;

  return (
    <div className="ag-panel-page__inner">
      <div
        style={{
          maxWidth: '640px',
          width: '100%',
          margin: '0 auto',
          padding: 'clamp(2rem, 5vw, 4rem) 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        {/* Header */}
        <div>
          <p className="hud-text text-action-red" style={{ letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
            PERFIL MAESTRO MK
          </p>
          <h1 className="font-headline-lg" style={{ lineHeight: 1.2 }}>
            En construcción.
          </h1>
          <p
            className="font-body-md"
            style={{ marginTop: '0.75rem', color: 'var(--color-text-muted, #a0a0a0)' }}
          >
            Cada pregunta que respondes revela una capa más de tu perfil real.
          </p>
        </div>

        {/* Self-knowledge metric */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <span className="hud-text" style={{ letterSpacing: '0.1em', fontSize: '11px', color: 'var(--color-text-muted, #a0a0a0)' }}>
              AUTOCONOCIMIENTO
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display, "Barlow Condensed", sans-serif)',
                fontSize: '2.5rem',
                fontWeight: 900,
                color: '#ff0000',
                lineHeight: 1,
              }}
            >
              {pct}%
            </span>
          </div>
          <div style={{ height: '4px', background: '#2d2d2d' }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #8b0000, #ff0000)',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>

        {/* CTA — primary */}
        <Link href="/diagnostico" className="ag-btn-cta font-label-lg" style={{ textAlign: 'center' }}>
          Continuar diagnóstico →
        </Link>

        {/* Module breakdown */}
        {progress?.modules && progress.modules.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <p className="hud-text" style={{ letterSpacing: '0.1em', fontSize: '11px', color: 'var(--color-text-muted, #a0a0a0)' }}>
              DIMENSIONES
            </p>
            {progress.modules.map((mod) => {
              const modPct = mod.totalQuestions > 0
                ? (mod.answeredQuestions / mod.totalQuestions) * 100
                : 0;
              const isLocked = mod.status === 'LOCKED';
              return (
                <div
                  key={mod.slug}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '20px 1fr auto',
                    alignItems: 'center',
                    gap: '0.75rem',
                    opacity: isLocked ? 0.35 : 1,
                  }}
                >
                  {mod.iconKey ? (
                    <AppIcon name={mod.iconKey as import('@/components/icons/registry').AppIconName} size={14} />
                  ) : (
                    <span />
                  )}
                  <div>
                    <p className="font-label-md" style={{ margin: 0 }}>{mod.titleEs}</p>
                    <ModuleProgressBar pct={modPct} status={mod.status} />
                  </div>
                  <span
                    className="font-label-sm"
                    style={{
                      color: mod.status === 'COMPLETE'
                        ? '#ff0000'
                        : 'var(--color-text-muted, #a0a0a0)',
                      whiteSpace: 'nowrap',
                      fontSize: '11px',
                    }}
                  >
                    {getModuleStatusLabel(mod.status)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Locked profile teaser */}
        <div
          style={{
            border: '1px solid #2d2d2d',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            opacity: 0.5,
          }}
        >
          <p className="hud-text" style={{ letterSpacing: '0.1em', fontSize: '11px', color: '#ff0000' }}>
            PERFIL MAESTRO BLOQUEADO
          </p>
          <p className="font-body-md" style={{ color: 'var(--color-text-muted, #a0a0a0)', margin: 0 }}>
            Tu arquetipo, fortalezas, cuello de botella y prioridades a 90 días
            se revelan cuando completas el diagnóstico.
          </p>
        </div>

        <p
          className="font-body-sm"
          style={{ color: 'var(--color-text-muted, #a0a0a0)', textAlign: 'center', fontStyle: 'italic' }}
        >
          "El autoconocimiento es el prerrequisito de todo lo demás."
        </p>
      </div>
    </div>
  );
}

// ── State B: Profile ready ────────────────────────────────────────────────────

function PanelStateB({ email, profile }: { email: string; profile: MasterProfileDto }) {
  const archetypeLabel = profile ? getArchetypeLabel(profile.archetypePrimary) : null;

  return (
    <div className="ag-panel-page__inner">
      <div
        style={{
          maxWidth: '640px',
          width: '100%',
          margin: '0 auto',
          padding: 'clamp(2rem, 5vw, 4rem) 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        <div>
          <p className="hud-text text-action-red" style={{ letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
            PERFIL MAESTRO MK
          </p>
          <h1 className="font-headline-lg" style={{ lineHeight: 1.2 }}>
            Tu perfil está listo.
          </h1>
          <p className="font-body-md" style={{ marginTop: '0.75rem', color: 'var(--color-text-muted, #a0a0a0)' }}>
            {email}
          </p>
        </div>

        {archetypeLabel && profile && (() => {
          const meta = getArchetype(profile.archetypePrimary);
          return (
            <div className="panel-archetype-card">
              {meta?.image && (
                <div className="panel-archetype-card__bg" aria-hidden>
                  <Image src={meta.image} alt="" fill className="panel-archetype-card__img" />
                  <div className="panel-archetype-card__scrim" />
                </div>
              )}
              <div className="panel-archetype-card__content">
                <p className="hud-text" style={{ letterSpacing: '0.15em', fontSize: '10px', color: 'rgba(255,60,60,0.8)', marginBottom: '0.375rem' }}>
                  TU ARQUETIPO
                </p>
                <p className="font-headline-sm" style={{ margin: 0 }}>{archetypeLabel}</p>
                {meta?.tagline && (
                  <p className="font-body-sm" style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>{meta.tagline}</p>
                )}
                {meta?.shadow?.label && (
                  <p className="font-body-sm" style={{ margin: '0.5rem 0 0', color: 'rgba(255,120,120,0.55)' }}>
                    Sombra: {meta.shadow.label}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        <p className="font-body-md" style={{ color: 'var(--color-text-muted, #a0a0a0)' }}>
          Tu arquetipo y puntuaciones por dimensión ya están listos. Fortalezas, cuello de botella
          y prioridades a 90 días llegarán en la siguiente versión.
        </p>

        <Link href="/diagnostico/resultado" className="ag-btn-cta font-label-lg" style={{ textAlign: 'center' }}>
          Ver mi perfil
        </Link>
      </div>
    </div>
  );
}

// ── Recovery: onboarding says complete but profile missing ────────────────────

function PanelStateRecovery() {
  return (
    <div className="ag-panel-page__inner">
      <div
        style={{
          maxWidth: '640px',
          width: '100%',
          margin: '0 auto',
          padding: 'clamp(2rem, 5vw, 4rem) 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        <div>
          <p className="hud-text text-action-red" style={{ letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
            PERFIL MAESTRO MK
          </p>
          <h1 className="font-headline-lg" style={{ lineHeight: 1.2 }}>
            Tu perfil no está disponible.
          </h1>
          <p className="font-body-md" style={{ marginTop: '0.75rem', color: 'var(--color-text-muted, #a0a0a0)' }}>
            No encontramos tu diagnóstico guardado. Completa el diagnóstico de nuevo para generar tu perfil.
          </p>
        </div>
        <Link href="/diagnostico" className="ag-btn-cta font-label-lg" style={{ textAlign: 'center' }}>
          Comenzar diagnóstico →
        </Link>
      </div>
    </div>
  );
}

// ── State C: Waitlist / early access ─────────────────────────────────────────

function PanelStateC({ email }: { email: string }) {
  return (
    <div className="ag-panel-page__inner">
      <div className="ag-panel-page__shell">
        <header className="ag-panel-page__welcome">
          <p className="hud-text text-action-red">Programa Fundador</p>
          <h1 className="font-display-xl text-white ag-panel-page__title">Bienvenido</h1>
          <p className="ag-panel-page__email">{email}</p>
          <p className="font-body-md ag-panel-page__lead">
            Tu lugar está reservado. El sistema se activa por etapas y serás de los primeros en acceder.
          </p>
        </header>

        <div className="ag-panel-page__footer">
          <Link href="/sistema" className="ag-btn-cta font-label-lg">
            Explorar el método
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function PanelContent() {
  const router = useRouter();
  const { status, user } = useAuthSession();
  const [progress, setProgress] = useState<DiagnosticProgressDto>(null);
  const [profile, setProfile] = useState<MasterProfileDto>(null);
  const [progressLoaded, setProgressLoaded] = useState(false);

  useLayoutEffect(() => {
    if (status === 'guest') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'guest') return;
    if (user?.role === 'ADMIN') {
      router.replace('/admin');
      return;
    }

    const step = user?.onboardingStep ?? 'TERMS_PENDING';
    const token = getAccessToken();
    if (!token) {
      setProgressLoaded(true);
      return;
    }

    if (DIAGNOSTIC_IN_PROGRESS_STEPS.has(step)) {
      apiDiagnosticProgress(token)
        .then((p) => setProgress(p))
        .catch(() => {})
        .finally(() => setProgressLoaded(true));
    } else if (step === 'PROFILE_COMPLETE' || step === 'BLUEPRINT_READY') {
      apiDiagnosticProfile(token)
        .then((p) => setProfile(p))
        .catch(() => {})
        .finally(() => setProgressLoaded(true));
    } else {
      setProgressLoaded(true);
    }
  }, [status, user, router]);

  if (status === 'guest') return null;

  const ready = status === 'authenticated' && user?.role !== 'ADMIN';

  const step = user?.onboardingStep ?? 'TERMS_PENDING';
  const expectsProfile = step === 'PROFILE_COMPLETE' || step === 'BLUEPRINT_READY';
  const needsDataLoad = DIAGNOSTIC_IN_PROGRESS_STEPS.has(step) || expectsProfile;

  if (!ready || (!progressLoaded && needsDataLoad)) {
    return (
      <div className="ag-landing flex min-h-screen flex-col antialiased" style={{ background: '#0e0e0e', color: '#e5e2e1' }}>
        <PublicNav />
        <main className="flex grow items-center justify-center">
          <div className="auth-loading">
            <span className="auth-spinner" aria-hidden />
          </div>
        </main>
      </div>
    );
  }

  const isDiagnosticInProgress = DIAGNOSTIC_IN_PROGRESS_STEPS.has(step);
  const isProfileReady = expectsProfile && profile !== null;
  const needsProfileRecovery = expectsProfile && profile === null;

  return (
    <div className="ag-landing flex min-h-screen flex-col antialiased" style={{ background: '#0e0e0e', color: '#e5e2e1' }}>
      <PublicNav />
      <main className="ag-panel-page relative flex grow flex-col">
        {/* Background statue — shown in non-StateA modes */}
        {!isDiagnosticInProgress && !needsProfileRecovery && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/landing/statue-sovereign.jpg"
              alt=""
              aria-hidden
              className="ag-panel-page__bg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="ag-panel-page__scrim" aria-hidden />
          </>
        )}

        {isDiagnosticInProgress && (
          <PanelStateA progress={progress} />
        )}

        {needsProfileRecovery && (
          <PanelStateRecovery />
        )}

        {!isDiagnosticInProgress && isProfileReady && (
          <PanelStateB email={user?.email ?? ''} profile={profile!} />
        )}

        {!isDiagnosticInProgress && !isProfileReady && !needsProfileRecovery && (
          <PanelStateC email={user?.email ?? ''} />
        )}
      </main>
    </div>
  );
}
