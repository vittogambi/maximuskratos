'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppIcon } from '@/components/app-icon';
import { useAuthSession } from '@/components/auth-session-provider';
import { apiDiagnosticProfile, apiDiagnosticProgress, type DiagnosticProgressDto, type MasterProfileDto } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { getArchetype } from '@/lib/archetypes';
import { KpiCard } from '@/components/charts/KpiCard';

// Lazy-load recharts to keep first paint fast
const RadarProfile = dynamic(
  () => import('@/components/charts/RadarProfile').then((m) => ({ default: m.RadarProfile })),
  { ssr: false, loading: () => <div className="mk-radar-placeholder" aria-hidden /> }
);

const DIAGNOSTIC_IN_PROGRESS_STEPS = new Set([
  'TERMS_PENDING',
  'DIAGNOSTICO_BIENVENIDA',
  'FASE1_EN_CURSO',
]);

// ── Skeleton loader ──────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="mk-dashboard">
      <div className="mk-skeleton mk-skeleton--kpi-row" aria-hidden />
      <div className="mk-skeleton mk-skeleton--radar" aria-hidden />
      <div className="mk-skeleton mk-skeleton--card" aria-hidden />
    </div>
  );
}

// ── In-progress state ────────────────────────────────────────────────────────

function InProgressDashboard({ progress }: { progress: DiagnosticProgressDto }) {
  const pct = progress?.selfKnowledgePct ?? 0;
  const completionPct = progress?.completionPct ?? 0;

  return (
    <div className="mk-dashboard">
      {/* Hero progress card */}
      <div className="mk-progress-hero">
        <div className="mk-progress-hero__top">
          <p className="mk-section-eyebrow">AUDITORÍA INICIAL · E-AUD-001</p>
          <span className="mk-progress-hero__pct">{Math.round(completionPct)}%</span>
        </div>
        <h2 className="mk-progress-hero__title">En construcción.</h2>
        <p className="mk-progress-hero__sub">
          Cada respuesta revela una capa más de tu perfil real. Continúa donde lo dejaste.
        </p>

        {/* Self-knowledge bar */}
        <div className="mk-self-knowledge">
          <div className="mk-self-knowledge__header">
            <span className="mk-section-eyebrow">AUTOCONOCIMIENTO</span>
            <span className="mk-self-knowledge__val">{pct}%</span>
          </div>
          <div className="mk-self-knowledge__track">
            <div className="mk-self-knowledge__fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <Link href="/diagnostico" className="mk-btn-primary">
          Continuar diagnóstico →
        </Link>
      </div>

      {/* Module breakdown */}
      {progress?.modules && progress.modules.length > 0 && (
        <section className="mk-section">
          <p className="mk-section-eyebrow">MÓDULOS</p>
          <div className="mk-module-list">
            {progress.modules.map((mod) => {
              const modPct = mod.totalQuestions > 0
                ? (mod.answeredQuestions / mod.totalQuestions) * 100
                : 0;
              const isLocked = mod.status === 'LOCKED';
              const isComplete = mod.status === 'COMPLETE';
              return (
                <div key={mod.slug} className={`mk-module-row${isLocked ? ' mk-module-row--locked' : ''}`}>
                  <div className="mk-module-row__icon">
                    {mod.iconKey
                      ? <AppIcon name={mod.iconKey as import('@/components/icons/registry').AppIconName} size={16} />
                      : <span className="mk-module-row__dot" />}
                  </div>
                  <div className="mk-module-row__body">
                    <div className="mk-module-row__header">
                      <span className="mk-module-row__name">{mod.titleEs}</span>
                      <span className={`mk-module-row__status${isComplete ? ' mk-module-row__status--done' : ''}`}>
                        {isComplete ? 'Completado' : isLocked ? 'Bloqueado' : mod.status === 'IN_PROGRESS' ? 'En progreso' : 'Disponible'}
                      </span>
                    </div>
                    <div className="mk-module-row__track">
                      {!isLocked && (
                        <div className="mk-module-row__fill" style={{ width: `${Math.min(100, modPct)}%` }} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Locked profile teaser */}
      <div className="mk-locked-teaser">
        <p className="mk-section-eyebrow" style={{ color: 'rgba(200,0,0,0.6)' }}>PERFIL MAESTRO · BLOQUEADO</p>
        <p className="mk-locked-teaser__body">
          Tu arquetipo, fortalezas y prioridades a 90 días se revelan al completar la auditoría.
        </p>
      </div>
    </div>
  );
}

// ── Profile-ready dashboard ──────────────────────────────────────────────────

function ProfileDashboard({ profile }: { profile: NonNullable<MasterProfileDto> }) {
  const scores  = (profile.scores  ?? {}) as Record<string, number>;
  const indices = (profile.indices ?? {}) as Record<string, number>;
  const mkGlobal    = Math.round(indices.mk_global  ?? 0);
  const clarity     = Math.round(indices.clarity    ?? 0);
  const execution   = Math.round(indices.execution  ?? 0);
  const stability   = Math.round(indices.stability  ?? 0);
  const shadowScore = Math.round(scores.shadow      ?? 0);
  const archetype   = getArchetype(profile.archetypePrimary);

  return (
    <div className="mk-dashboard">
      {/* Archetype greeting */}
      {archetype && (
        <div className="mk-archetype-greeting">
          <p className="mk-section-eyebrow">TU ARQUETIPO</p>
          <p className="mk-archetype-greeting__name">{archetype.label}</p>
          <p className="mk-archetype-greeting__tagline">{archetype.tagline}</p>
        </div>
      )}

      {/* KPI strip */}
      <section className="mk-section">
        <p className="mk-section-eyebrow">ÍNDICES</p>
        <div className="mk-kpi-strip">
          <KpiCard label="Global MK"  value={mkGlobal}   isGlobal />
          <KpiCard label="Claridad"   value={clarity} />
          <KpiCard label="Ejecución"  value={execution} />
          <KpiCard label="Estabilidad" value={stability} />
        </div>
      </section>

      {/* Radar */}
      <section className="mk-section">
        <p className="mk-section-eyebrow">PERFIL DE DIMENSIONES</p>
        <div className="mk-radar-card">
          <RadarProfile scores={scores} />
        </div>
      </section>

      {/* Sombra */}
      <section className="mk-sombra-card">
        <div className="mk-sombra-card__header">
          <p className="mk-section-eyebrow" style={{ color: 'rgba(255,80,80,0.7)' }}>LA SOMBRA</p>
          <span className="mk-sombra-card__score">{shadowScore}</span>
        </div>
        <p className="mk-sombra-card__text">
          {shadowScore < 30
            ? 'Sombra contenida: buena conciencia de tus patrones.'
            : shadowScore < 60
            ? 'Sombra activa: algunos patrones están limitando tu potencial.'
            : 'Sombra dominante: tu cuello de botella más crítico.'}
        </p>
        <div className="mk-sombra-card__track">
          <div className="mk-sombra-card__fill" style={{ width: `${Math.min(100, shadowScore)}%` }} />
        </div>
      </section>

      {/* Ruta teaser */}
      <section className="mk-section">
        <p className="mk-section-eyebrow">RUTA MK</p>
        <div className="mk-ruta-teaser">
          <div className="mk-ruta-teaser__item mk-ruta-teaser__item--done">
            <div className="mk-ruta-teaser__dot" />
            <div>
              <p className="mk-ruta-teaser__label">Auditoría I · E-AUD-001</p>
              <p className="mk-ruta-teaser__sub">Completada</p>
            </div>
          </div>
          {['Auditoría II', 'Auditoría III', 'Blueprint 90 días'].map((name) => (
            <div key={name} className="mk-ruta-teaser__item mk-ruta-teaser__item--locked">
              <div className="mk-ruta-teaser__dot mk-ruta-teaser__dot--locked" />
              <div>
                <p className="mk-ruta-teaser__label">{name}</p>
                <p className="mk-ruta-teaser__sub">Pendiente aprobación</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/ruta" className="mk-btn-ghost">Ver ruta completa →</Link>
      </section>

      {/* Deep-dive CTA */}
      <Link href="/perfil" className="mk-btn-primary" style={{ textAlign: 'center' }}>
        Ver mi perfil completo →
      </Link>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export function InicioDashboard() {
  const { status, user } = useAuthSession();
  const [progress, setProgress] = useState<DiagnosticProgressDto>(null);
  const [profile,  setProfile]  = useState<MasterProfileDto>(null);
  const [loaded,   setLoaded]   = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !user) return;
    if (user.role === 'ADMIN') return;

    const token = getAccessToken();
    if (!token) { setLoaded(true); return; }

    const step = user.onboardingStep ?? 'TERMS_PENDING';

    if (DIAGNOSTIC_IN_PROGRESS_STEPS.has(step)) {
      apiDiagnosticProgress(token)
        .then((p) => setProgress(p))
        .catch(() => {})
        .finally(() => setLoaded(true));
    } else if (step === 'PROFILE_COMPLETE' || step === 'BLUEPRINT_READY') {
      apiDiagnosticProfile(token)
        .then((p) => setProfile(p))
        .catch(() => {})
        .finally(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, [status, user]);

  if (!loaded || status !== 'authenticated') return <DashboardSkeleton />;

  const step = user?.onboardingStep ?? 'TERMS_PENDING';

  if (DIAGNOSTIC_IN_PROGRESS_STEPS.has(step)) {
    return <InProgressDashboard progress={progress} />;
  }

  if (profile) {
    return <ProfileDashboard profile={profile} />;
  }

  // Recovery or unknown state
  return (
    <div className="mk-dashboard">
      <div className="mk-progress-hero">
        <p className="mk-section-eyebrow">PERFIL MAESTRO MK</p>
        <h2 className="mk-progress-hero__title">Tu perfil no está disponible.</h2>
        <p className="mk-progress-hero__sub">
          Completa la auditoría inicial para generar tu perfil.
        </p>
        <Link href="/diagnostico" className="mk-btn-primary">
          Comenzar auditoría →
        </Link>
      </div>
    </div>
  );
}
