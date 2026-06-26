'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { apiDiagnosticProfile, apiDiagnosticProgress, type DiagnosticProgressDto, type MasterProfileDto } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { getArchetype } from '@/lib/archetypes';

const RadarProfile = dynamic(
  () => import('@/components/charts/RadarProfile').then((m) => ({ default: m.RadarProfile })),
  { ssr: false, loading: () => <div className="mk-radar-placeholder" aria-hidden /> }
);

const DIAGNOSTIC_IN_PROGRESS_STEPS = new Set([
  'TERMS_PENDING',
  'DIAGNOSTICO_BIENVENIDA',
  'FASE1_EN_CURSO',
]);

function isDiagnosticStarted(
  step: string | undefined,
  progress: DiagnosticProgressDto | null,
): boolean {
  if (step && DIAGNOSTIC_IN_PROGRESS_STEPS.has(step)) return true;
  if (!progress) return false;
  if (progress.completionPct > 0) return true;
  return progress.modules.some(
    (m) =>
      m.status === 'IN_PROGRESS' ||
      m.status === 'COMPLETE' ||
      m.answeredQuestions > 0,
  );
}

type Classification = { label: string; title: string; color: string };

function classify(val: number): Classification {
  if (val < 40) return { label: 'CRÍTICO',   title: 'Desalineación Total',      color: '#ff3333' };
  if (val < 60) return { label: 'INESTABLE', title: 'Intención sin Sistema',    color: '#ff8800' };
  if (val < 80) return { label: 'SÓLIDO',    title: 'Identidad en Construcción', color: '#c9a24a' };
  return          { label: 'DOMINANTE',      title: 'Alineación y Control',      color: '#22c060' };
}

const DIMENSION_LABELS: Record<string, string> = {
  mentality: 'Mentalidad', identity: 'Identidad', habits: 'Hábitos',
  environment: 'Entorno', finances: 'Finanzas', relationships: 'Relaciones',
  purpose: 'Propósito', ikigai: 'Ikigai',
};
const DIMENSION_ORDER = ['mentality','identity','habits','environment','finances','relationships','purpose','ikigai'];
const INDEX_LABELS: Record<string, string> = { clarity: 'Claridad', execution: 'Ejecución', stability: 'Estabilidad' };

function ScoreBar({ label, score }: { label: string; score: number }) {
  const capped = Math.min(100, Math.max(0, score));
  const color = capped >= 70 ? '#cc0000' : capped >= 40 ? '#888' : '#333';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 28px', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', fontFamily: 'var(--font-hanken,system-ui)' }}>{label}</span>
      <div style={{ height: '2px', background: '#1a1a1a' }}>
        <div style={{ height: '100%', width: `${capped}%`, background: color, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ textAlign: 'right', fontSize: '0.75rem', color: '#555', fontFamily: 'var(--font-hanken,system-ui)' }}>{capped}</span>
    </div>
  );
}

export function PerfilContent() {
  const { status, user } = useAuthSession();
  const [profile, setProfile] = useState<MasterProfileDto>(null);
  const [diagnosticStarted, setDiagnosticStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }

    async function load() {
      try {
        const [p, progress] = await Promise.all([
          apiDiagnosticProfile(token!),
          apiDiagnosticProgress(token!).catch(() => null),
        ]);
        setProfile(p);
        setDiagnosticStarted(isDiagnosticStarted(user?.onboardingStep, progress));
      } catch {
        setError('No pudimos cargar tu perfil.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [status, user?.onboardingStep]);

  if (loading) {
    return (
      <div className="mk-dashboard">
        <div className="mk-skeleton mk-skeleton--radar" aria-hidden />
        <div className="mk-skeleton mk-skeleton--card" aria-hidden />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mk-dashboard">
        <div className="mk-progress-hero">
          <p className="mk-section-eyebrow">PERFIL MAESTRO MK</p>
          <h2 className="mk-progress-hero__title">Perfil no disponible.</h2>
          <p className="mk-progress-hero__sub">
            {error ?? 'Completa el diagnóstico para generar tu perfil.'}
          </p>
          <Link href="/diagnostico" className="mk-btn-primary">
            {diagnosticStarted ? 'Continuar diagnóstico →' : 'Comenzar diagnóstico →'}
          </Link>
        </div>
      </div>
    );
  }

  const archetype = getArchetype(profile.archetypePrimary) ?? {
    slug: profile.archetypePrimary, label: profile.archetypePrimary,
    tagline: '', description: '', roman: '', symbol: '?', image: '',
  };
  const secondaryMeta = profile.archetypeSecondary ? getArchetype(profile.archetypeSecondary) : null;
  const scores  = (profile.scores  ?? {}) as Record<string, number>;
  const indices = (profile.indices ?? {}) as Record<string, number>;
  const mkGlobal    = Math.round(indices.mk_global ?? 0);
  const shadowScore = Math.round(scores.shadow ?? 0);
  const cls = classify(mkGlobal);

  return (
    <div>
      {/* Cinematic archetype hero — full width, inside the app shell scroll area */}
      <section className="dk-archetype-hero" aria-label={archetype.label} style={{ margin: '0 -1rem' }}>
        {archetype.image && (
          <div className="dk-archetype-hero__bg" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={archetype.image} alt="" className="dk-archetype-hero__img" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%' }} />
            <div className="dk-archetype-hero__scrim" />
            <div className="dk-archetype-hero__glow" />
          </div>
        )}
        <div className="dk-archetype-hero__content">
          <div className="dk-archetype-hero__top">
            <span className="dk-result-eyebrow">PERFIL MAESTRO MK</span>
            <span className="dk-classification-badge" style={{ '--cls-color': cls.color } as React.CSSProperties}>{cls.label}</span>
          </div>
          <div className="dk-archetype-hero__bottom">
            {archetype.roman && <p className="dk-archetype-hero__roman">{archetype.roman}</p>}
            <h2 className="dk-archetype-hero__name">{archetype.label}</h2>
            <p className="dk-archetype-hero__tagline">{archetype.tagline}</p>
          </div>
        </div>
      </section>

      <div className="mk-dashboard">
        {/* Classification */}
        <div className="dk-classification-banner" style={{ '--cls-color': cls.color } as React.CSSProperties}>
          <div className="dk-classification-banner__score">{mkGlobal}</div>
          <div>
            <p className="dk-classification-banner__label">{cls.label} — {cls.title}</p>
            <p className="dk-classification-banner__sub">Índice Global MK · 0–100</p>
          </div>
        </div>

        {/* Description */}
        <p className="dk-result-description">{archetype.description}</p>

        {/* Secondary archetype */}
        {secondaryMeta && (
          <div className="dk-secondary-archetype">
            {secondaryMeta.image && (
              <div className="dk-secondary-archetype__bg" aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={secondaryMeta.image} alt="" className="dk-secondary-archetype__img" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%', filter: 'saturate(0.4) brightness(0.35)' }} />
                <div className="dk-secondary-archetype__scrim" />
              </div>
            )}
            <div className="dk-secondary-archetype__content">
              <p className="dk-result-eyebrow" style={{ color: 'rgba(255,255,255,0.45)' }}>ARQUETIPO SECUNDARIO</p>
              <p className="dk-secondary-archetype__name">{secondaryMeta.label}</p>
              <p className="dk-secondary-archetype__tagline">{secondaryMeta.tagline}</p>
            </div>
          </div>
        )}

        {/* Radar */}
        <section className="mk-section">
          <p className="mk-section-eyebrow">DIMENSIONES — RADAR</p>
          <div className="mk-radar-card">
            <RadarProfile scores={scores} />
          </div>
        </section>

        {/* Sombra */}
        <div className="dk-shadow-section">
          <div className="dk-shadow-section__header">
            <span className="dk-result-eyebrow" style={{ color: 'rgba(255,80,80,0.7)' }}>LA SOMBRA</span>
            <span className="dk-shadow-score">{shadowScore}</span>
          </div>
          <p className="dk-shadow-section__text">
            La sombra es el conjunto de patrones inconscientes que operan contra tu avance.
          </p>
          <div className="dk-shadow-bar">
            <div className="dk-shadow-bar__fill" style={{ width: `${Math.min(100, shadowScore)}%` }} />
          </div>
        </div>

        {/* Indices */}
        <section className="dk-result-section">
          <p className="dk-result-section__label">ÍNDICES COMPUESTOS</p>
          <div className="dk-indices-row">
            {Object.entries(INDEX_LABELS).map(([key, label]) => {
              const val = Math.round(indices[key] ?? 0);
              return (
                <div key={key} className="dk-index-item">
                  <span className="dk-index-item__value" style={{ color: val >= 60 ? '#cc0000' : '#444' }}>{val}</span>
                  <span className="dk-index-item__label">{label.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dimension score bars */}
        <section className="dk-result-section">
          <p className="dk-result-section__label">DIMENSIONES</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {DIMENSION_ORDER.filter((d) => scores[d] !== undefined).map((dim) => (
              <ScoreBar key={dim} label={DIMENSION_LABELS[dim] ?? dim} score={scores[dim] ?? 0} />
            ))}
          </div>
        </section>

        {/* Coming soon */}
        <div className="dk-result-section" style={{ borderLeft: '2px solid #1a1a1a', paddingLeft: '1rem' }}>
          <p className="dk-result-section__label" style={{ color: '#333' }}>PRÓXIMAMENTE</p>
          <p style={{ fontSize: '0.8125rem', color: '#333', margin: 0, fontFamily: 'var(--font-hanken,system-ui)' }}>
            Fortalezas, cuello de botella y prioridades a 90 días.
          </p>
        </div>
      </div>
    </div>
  );
}
