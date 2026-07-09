'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { apiDiagnosticProfile, apiDiagnosticStart, type MasterProfileDto } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { getArchetype } from '@/lib/archetypes';

// ── Scoring classification (mirrors the Excel formula, mapped to 0-100 scale) ──
// Excel: raw /115 → <46→CRÍTICO, <69→INESTABLE, <92→SÓLIDO, ≤115→DOMINANTE
// mk_global is already 0-100 avg of all dimensions, same proportions.
type Classification = {
  key: 'critico' | 'inestable' | 'solido' | 'dominante';
  label: string;
  title: string;
  color: string;
};
const CLASSIFICATIONS: Classification[] = [
  { key: 'critico',   label: 'CRÍTICO',   title: 'Desalineación Total',       color: '#ff2222' },
  { key: 'inestable', label: 'INESTABLE', title: 'Intención sin Sistema',     color: '#ff8800' },
  { key: 'solido',    label: 'SÓLIDO',    title: 'Identidad en Construcción', color: '#c9a24a' },
  { key: 'dominante', label: 'DOMINANTE', title: 'Alineación y Control',      color: '#00c070' },
];

function classify(mkGlobal: number): Classification {
  if (mkGlobal < 40) return CLASSIFICATIONS[0];
  if (mkGlobal < 60) return CLASSIFICATIONS[1];
  if (mkGlobal < 80) return CLASSIFICATIONS[2];
  return CLASSIFICATIONS[3];
}

// ── Dimension tables ───────────────────────────────────────────────────────────
const DIMENSION_LABELS: Record<string, string> = {
  mentality:     'Mentalidad',
  identity:      'Identidad',
  habits:        'Hábitos',
  environment:   'Entorno',
  finances:      'Finanzas',
  relationships: 'Relaciones',
  purpose:       'Propósito',
  ikigai:        'Ikigai',
};

const INDEX_LABELS: Record<string, string> = {
  clarity:   'Claridad',
  execution: 'Ejecución',
  stability: 'Estabilidad',
};

const DIMENSION_ORDER = ['mentality', 'identity', 'habits', 'environment', 'finances', 'relationships', 'purpose', 'ikigai'];

function ScoreBar({ label, score }: { label: string; score: number }) {
  const capped = Math.min(100, Math.max(0, score));
  const color = capped >= 70 ? '#cc0000' : capped >= 40 ? '#888' : '#444';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 32px', alignItems: 'center', gap: '0.75rem' }}>
      <span className="font-label-sm" style={{ color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ height: '3px', background: '#1a1a1a' }}>
        <div style={{ height: '100%', width: `${capped}%`, background: color, transition: 'width 0.8s ease' }} />
      </div>
      <span className="font-label-sm" style={{ textAlign: 'right', color: '#666' }}>{capped}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DiagnosticResult() {
  const router = useRouter();
  const { status } = useAuthSession();
  const [profile, setProfile] = useState<MasterProfileDto>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'guest') { router.replace('/login'); return; }
    const token = getAccessToken();
    if (!token) { router.replace('/login'); return; }

    async function loadProfile() {
      try {
        let p = await apiDiagnosticProfile(token!);
        if (!p) {
          await apiDiagnosticStart(token!);
          p = await apiDiagnosticProfile(token!);
        }
        if (!p) {
          setError('Tu perfil no está disponible. Completa el diagnóstico para generarlo.');
          return;
        }
        setProfile(p);
      } catch {
        setError('No pudimos cargar tu perfil. Intenta de nuevo en unos segundos.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [status, router]);

  if (loading) {
    return (
      <main style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-loading"><span className="auth-spinner" aria-hidden /></div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem', textAlign: 'center' }}>
        <p className="font-body-md" style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '420px' }}>
          {error ?? 'Perfil no disponible.'}
        </p>
        <Link href="/diagnostico" className="ag-btn-cta font-label-lg">Comenzar diagnóstico →</Link>
        <Link href="/panel" className="font-label-md" style={{ color: 'rgba(255,255,255,0.4)' }}>Volver al panel</Link>
      </main>
    );
  }

  const archetype = getArchetype(profile.archetypePrimary) ?? {
    slug: profile.archetypePrimary,
    label: profile.archetypePrimary,
    tagline: '',
    description: '',
    roman: '',
    symbol: '?',
    image: '',
    shadow: { label: '', description: '' },
  };
  const secondaryMeta = profile.archetypeSecondary ? getArchetype(profile.archetypeSecondary) : null;

  const scores  = (profile.scores  ?? {}) as Record<string, number>;
  const indices = (profile.indices ?? {}) as Record<string, number>;
  const mkGlobal = Math.round(indices.mk_global ?? 0);
  const shadowScore = Math.round(scores.shadow ?? 0);
  const cls = classify(mkGlobal);

  return (
    <main className="dk-result-page">

      {/* ── PRIMARY ARCHETYPE HERO ──────────────────────────────────────── */}
      <section className="dk-archetype-hero" aria-label={archetype.label}>
        {/* Full-bleed atmospheric image */}
        <div className="dk-archetype-hero__bg" aria-hidden>
          {archetype.image && (
            <Image
              src={archetype.image}
              alt=""
              fill
              priority
              className="dk-archetype-hero__img"
            />
          )}
          <div className="dk-archetype-hero__scrim" />
          <div className="dk-archetype-hero__glow" />
          <div className="dk-archetype-hero__vignette" />
        </div>

        {/* Overlay content */}
        <div className="dk-archetype-hero__content">
          <div className="dk-archetype-hero__top">
            <span className="dk-result-eyebrow">PERFIL MAESTRO MK</span>
            {/* Classification badge */}
            <span
              className="dk-classification-badge"
              style={{ '--cls-color': cls.color } as React.CSSProperties}
            >
              {cls.label}
            </span>
          </div>

          <div className="dk-archetype-hero__bottom">
            {archetype.roman && (
              <p className="dk-archetype-hero__roman">{archetype.roman}</p>
            )}
            <h1 className="dk-archetype-hero__name">{archetype.label}</h1>
            <p className="dk-archetype-hero__tagline">{archetype.tagline}</p>
          </div>
        </div>
      </section>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div className="dk-result-body">

        {/* Classification banner */}
        <div className="dk-classification-banner" style={{ '--cls-color': cls.color } as React.CSSProperties}>
          <div className="dk-classification-banner__score">{mkGlobal}</div>
          <div>
            <p className="dk-classification-banner__label">{cls.label} — {cls.title}</p>
            <p className="dk-classification-banner__sub">Índice Global MK · 0–100</p>
          </div>
        </div>

        {/* Archetype description */}
        <p className="dk-result-description">{archetype.description}</p>

        {/* ── SECONDARY ARCHETYPE ─────────────────────────────────────── */}
        {secondaryMeta && (
          <div className="dk-secondary-archetype">
            {/* image as atmospheric accent */}
            {secondaryMeta.image && (
              <div className="dk-secondary-archetype__bg" aria-hidden>
                <Image src={secondaryMeta.image} alt="" fill className="dk-secondary-archetype__img" />
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

        {/* ── SOMBRA ─────────────────────────────────────────────────── */}
        <div className="dk-shadow-section">
          <div className="dk-shadow-section__header">
            <span className="dk-result-eyebrow" style={{ color: 'rgba(255,80,80,0.7)' }}>LA SOMBRA</span>
            <span className="dk-shadow-score">{shadowScore}</span>
          </div>
          {archetype.shadow?.label && (
            <p className="dk-shadow-section__archetype">
              Como <strong>{archetype.label}</strong>, tu sombra toma la forma de{' '}
              <strong>{archetype.shadow.label}</strong>: {archetype.shadow.description}
            </p>
          )}
          <p className="dk-shadow-section__text">
            La sombra es el conjunto de patrones inconscientes que operan contra tu avance.
            Cuanto más alto su índice, más energía consumen sin que lo notes.
          </p>
          <div className="dk-shadow-bar">
            <div
              className="dk-shadow-bar__fill"
              style={{ width: `${Math.min(100, shadowScore)}%` }}
            />
          </div>
          <p className="dk-shadow-section__caption">
            {shadowScore < 30
              ? 'Sombra contenida — buena conciencia de tus patrones.'
              : shadowScore < 60
              ? 'Sombra activa — algunos patrones están limitando tu potencial.'
              : 'Sombra dominante — este es tu cuello de botella más crítico.'}
          </p>
        </div>

        {/* ── COMPOSITE INDICES ──────────────────────────────────────── */}
        <div className="dk-result-section">
          <p className="dk-result-section__label">ÍNDICES COMPUESTOS</p>
          <div className="dk-indices-row">
            {Object.entries(INDEX_LABELS).map(([key, label]) => {
              const val = Math.round(indices[key] ?? 0);
              return (
                <div key={key} className="dk-index-item">
                  <span className="dk-index-item__value" style={{ color: val >= 60 ? '#cc0000' : '#444' }}>
                    {val}
                  </span>
                  <span className="dk-index-item__label">{label.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── DIMENSION SCORES ────────────────────────────────────────── */}
        <div className="dk-result-section">
          <p className="dk-result-section__label">DIMENSIONES</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {DIMENSION_ORDER.filter((d) => scores[d] !== undefined).map((dim) => (
              <ScoreBar key={dim} label={DIMENSION_LABELS[dim] ?? dim} score={scores[dim] ?? 0} />
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div className="dk-result-section" style={{ borderLeft: '2px solid #1a1a1a', paddingLeft: '1rem' }}>
          <p className="dk-result-section__label" style={{ color: '#333' }}>PRÓXIMAMENTE</p>
          <p className="font-body-sm" style={{ color: '#333', margin: 0 }}>
            Fortalezas, cuello de botella y prioridades a 90 días.
          </p>
        </div>

        {/* CTA */}
        <Link href="/panel" className="ag-btn-cta font-label-lg" style={{ textAlign: 'center' }}>
          ← Volver al panel
        </Link>
      </div>
    </main>
  );
}
