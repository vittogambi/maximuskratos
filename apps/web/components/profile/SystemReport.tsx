'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppIcon } from '@/components/app-icon';
import { AppReveal } from '@/components/motion/app-reveal';
import { MotionNumber } from '@/components/motion/motion-number';
import {
  areasNeedingStrength,
  computeDomainScores,
  computePillarScores,
  developedAreas,
  DIMENSION_LABELS,
  DIMENSION_ORDER,
  DOMAINS,
  PILLARS,
  pillarContributions,
  pillarMisalignment,
  PRESENTATION_INDICES,
  type SystemArea,
} from '@/lib/mk-system';
import { ScoreBar } from '@/components/profile/ScoreBar';
import { SystemMap } from '@/components/profile/SystemMap';

const PROFILE_VIEW_KEY = 'mk_profile_indices_seen';

const RadarProfile = dynamic(
  () => import('@/components/charts/RadarProfile').then((m) => ({ default: m.RadarProfile })),
  { ssr: false, loading: () => <div className="mk-radar-placeholder" aria-hidden /> },
);

type Classification = { label: string; title: string; color: string };

function classify(val: number): Classification {
  if (val < 40) return { label: 'CRÍTICO', title: 'Desalineación Total', color: '#ff3333' };
  if (val < 60) return { label: 'INESTABLE', title: 'Intención sin Sistema', color: '#ff8800' };
  if (val < 80) return { label: 'SÓLIDO', title: 'Identidad en Construcción', color: '#c9a24a' };
  return { label: 'DOMINANTE', title: 'Alineación y Control', color: '#22c060' };
}

/** Solo lo que este reporte necesita del arquetipo — evita depender del slug tipado. */
export type ArchetypeLike = {
  label: string;
  tagline: string;
  description: string;
  image: string;
  shadow?: { label: string; description: string };
};

function ArchetypeCard({ meta, kind }: { meta: ArchetypeLike; kind: 'primary' | 'secondary' }) {
  return (
    <div className="dk-secondary-archetype">
      {meta.image && (
        <div className="dk-secondary-archetype__bg" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.image}
            alt=""
            className="dk-secondary-archetype__img"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
          <div className="dk-secondary-archetype__scrim" />
        </div>
      )}
      <div className="dk-secondary-archetype__content">
        <p className="dk-result-eyebrow" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {kind === 'primary' ? 'ARQUETIPO DOMINANTE' : 'ARQUETIPO SECUNDARIO'}
        </p>
        <p className="dk-secondary-archetype__name">{meta.label}</p>
        <p className="dk-secondary-archetype__tagline">{meta.tagline}</p>
      </div>
    </div>
  );
}

type SystemReportProps = {
  scores: Record<string, number>;
  indices: Record<string, number>;
  archetype: ArchetypeLike;
  secondaryArchetype: ArchetypeLike | null;
};

/**
 * Lectura del perfil como sistema: índices de Alineación/Profundidad, resultado por
 * pilar y por ámbito, mapa de relación, y qué áreas están más o menos desarrolladas.
 * El arquetipo queda al final como referencia interpretativa secundaria.
 * Compartido entre PerfilContent (panel) y DiagnosticResult (página de resultado).
 */
export function SystemReport({ scores, indices, archetype, secondaryArchetype }: SystemReportProps) {
  const alineacion = Math.round(indices[PRESENTATION_INDICES.alineacion.sourceKey] ?? 0);
  const profundidad = Math.round(indices[PRESENTATION_INDICES.profundidad.sourceKey] ?? 0);
  const ejecucion = Math.round(indices[PRESENTATION_INDICES.ejecucion.sourceKey] ?? 0);
  const estabilidad = Math.round(indices[PRESENTATION_INDICES.estabilidad.sourceKey] ?? 0);
  const shadowScore = Math.round(scores.shadow ?? 0);
  const cls = classify(alineacion);
  const [firstView, setFirstView] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(PROFILE_VIEW_KEY)) {
        setFirstView(false);
        return;
      }
      localStorage.setItem(PROFILE_VIEW_KEY, '1');
      setFirstView(true);
    } catch {
      setFirstView(false);
    }
  }, []);

  const pillarScores = computePillarScores(scores);
  const domainScores = computeDomainScores(scores);

  const areas: SystemArea[] = [
    ...PILLARS.map((p) => ({ label: p.label, score: pillarScores[p.key] })),
    ...DOMAINS.map((d) => ({ label: d.label, score: domainScores[d.key] })),
  ].filter((a): a is SystemArea => a.score !== null);
  const strong = developedAreas(areas);
  const weak = areasNeedingStrength(areas);

  const misalignment = pillarMisalignment(pillarScores);
  const misalignmentDomains = misalignment
    ? pillarContributions(misalignment.low)
        .map((c) => DOMAINS.find((d) => d.key === c.domain)?.label)
        .filter((label): label is string => Boolean(label))
    : [];
  const highLabel = misalignment ? PILLARS.find((p) => p.key === misalignment.high)?.label : null;
  const lowLabel = misalignment ? PILLARS.find((p) => p.key === misalignment.low)?.label : null;

  return (
    <div className="sys-report">
      {/* Encabezado: clasificación + índices de Alineación y Profundidad */}
      <AppReveal active={firstView}>
      <section className="sys-header">
        <div className="sys-header__top">
          <p className="dk-result-eyebrow">PERFIL MAESTRO MK</p>
          <span className="dk-classification-badge" style={{ '--cls-color': cls.color } as React.CSSProperties}>
            {cls.label}
          </span>
        </div>
        <p className="sys-header__title">{cls.title}</p>
        <div className="sys-header__indices">
          <div className="sys-index" style={{ '--cls-color': cls.color } as React.CSSProperties}>
            <span className="sys-index__value">
              {firstView ? <MotionNumber to={alineacion} startWhen="mount" /> : alineacion}
            </span>
            <span className="sys-index__label">Índice de Alineación</span>
          </div>
          <div className="sys-index">
            <span className="sys-index__value">
              {firstView ? <MotionNumber to={profundidad} startWhen="mount" /> : profundidad}
            </span>
            <span className="sys-index__label">Índice de Profundidad</span>
          </div>
        </div>
        <div className="dk-indices-row">
          <div className="dk-index-item">
            <span className="dk-index-item__value" style={{ color: ejecucion >= 60 ? '#cc0000' : '#444' }}>
              {firstView ? <MotionNumber to={ejecucion} startWhen="mount" /> : ejecucion}
            </span>
            <span className="dk-index-item__label">EJECUCIÓN</span>
          </div>
          <div className="dk-index-item">
            <span className="dk-index-item__value" style={{ color: estabilidad >= 60 ? '#cc0000' : '#444' }}>
              {firstView ? <MotionNumber to={estabilidad} startWhen="mount" /> : estabilidad}
            </span>
            <span className="dk-index-item__label">ESTABILIDAD</span>
          </div>
        </div>
      </section>
      </AppReveal>

      {/* Resultado por pilar */}
      <section className="dk-result-section">
        <p className="dk-result-section__label">RESULTADO POR PILAR</p>
        <div className="sys-pillars">
          {PILLARS.map((pillar) => (
            <div key={pillar.key} className="sys-pillar-card">
              <span className="sys-pillar-card__icon">
                <AppIcon name={pillar.icon} size={20} />
              </span>
              <span className="sys-pillar-card__label">{pillar.label}</span>
              <span className="sys-pillar-card__score">{pillarScores[pillar.key] ?? '—'}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Resultado por ámbito + relación con los pilares */}
      <section className="dk-result-section">
        <p className="dk-result-section__label">RESULTADO POR ÁMBITO · RELACIÓN CON LOS PILARES</p>
        <SystemMap pillarScores={pillarScores} domainScores={domainScores} />
      </section>

      {/* Áreas más desarrolladas / que requieren mayor desarrollo */}
      {(strong.length > 0 || weak.length > 0) && (
        <section className="dk-result-section">
          <p className="dk-result-section__label">LECTURA DEL SISTEMA</p>
          <div className="sys-areas">
            {strong.length > 0 && (
              <div className="sys-areas__group">
                <p className="sys-areas__group-label sys-areas__group-label--strong">Más desarrolladas</p>
                {strong.map((a) => (
                  <div key={a.label} className="sys-area-row">
                    <span>{a.label}</span>
                    <span className="sys-area-row__score sys-area-row__score--strong">{a.score}</span>
                  </div>
                ))}
              </div>
            )}
            {weak.length > 0 && (
              <div className="sys-areas__group">
                <p className="sys-areas__group-label sys-areas__group-label--weak">Requieren mayor desarrollo</p>
                {weak.map((a) => (
                  <div key={a.label} className="sys-area-row">
                    <span>{a.label}</span>
                    <span className="sys-area-row__score">{a.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Desalineación relevante entre pilares */}
      {misalignment && highLabel && lowLabel && (
        <div className="sys-misalignment">
          <p className="dk-result-eyebrow" style={{ color: 'rgba(255,180,168,0.7)' }}>
            DESALINEACIÓN RELEVANTE
          </p>
          <p className="sys-misalignment__text">
            <strong>{highLabel}</strong> está {misalignment.gap} puntos por delante de{' '}
            <strong>{lowLabel}</strong>. Esa brecha limita la integración del sistema
            {misalignmentDomains.length > 0 ? <>, especialmente en {misalignmentDomains.join(', ')}</> : null}.
          </p>
        </div>
      )}

      {/* Radar de dimensiones, agrupado por pilar */}
      <section className="mk-section">
        <p className="mk-section-eyebrow">DIMENSIONES · RADAR</p>
        <div className="mk-radar-card">
          <RadarProfile scores={scores} />
        </div>
        <div className="sys-dimensions">
          {DIMENSION_ORDER.filter((d) => scores[d] !== undefined).map((dim) => (
            <div key={dim} className="sys-dimensions__row">
              <ScoreBar label={DIMENSION_LABELS[dim] ?? dim} score={scores[dim] ?? 0} />
              {dim === 'ikigai' && (
                <Link href="/ikigai" className="sys-dimensions__link">
                  ¿Qué es el IKIGAI?
                  <AppIcon name="arrow-right" size={12} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Sombra */}
      <div className="dk-shadow-section">
        <div className="dk-shadow-section__header">
          <span className="dk-result-eyebrow" style={{ color: 'rgba(255,80,80,0.7)' }}>
            LA SOMBRA
          </span>
          <span className="dk-shadow-score">{shadowScore}</span>
        </div>
        {archetype.shadow?.label && (
          <p className="dk-shadow-section__archetype">
            Como <strong>{archetype.label}</strong>, tu sombra toma la forma de{' '}
            <strong>{archetype.shadow.label}</strong>: {archetype.shadow.description}
          </p>
        )}
        <p className="dk-shadow-section__text">
          La sombra es el conjunto de patrones inconscientes que operan contra tu avance. Cuanto más
          alto su índice, más energía consumen sin que lo notes.
        </p>
        <div className="dk-shadow-bar">
          <div className="dk-shadow-bar__fill" style={{ width: `${Math.min(100, shadowScore)}%` }} />
        </div>
        <p className="dk-shadow-section__caption">
          {shadowScore < 30
            ? 'Sombra contenida: buena conciencia de tus patrones.'
            : shadowScore < 60
              ? 'Sombra activa: algunos patrones están limitando tu potencial.'
              : 'Sombra dominante: este es tu cuello de botella más crítico.'}
        </p>
      </div>

      {/* Arquetipo — referencia interpretativa secundaria, no el eje del perfil */}
      <section className="sys-archetype">
        <p className="dk-result-eyebrow">ARQUETIPO · REFERENCIA INTERPRETATIVA</p>
        <ArchetypeCard meta={archetype} kind="primary" />
        <p className="sys-archetype__note">
          Tu arquetipo funciona como una referencia interpretativa. No define quién eres ni limita tu
          desarrollo. Representa ciertos patrones predominantes observados en tu diagnóstico actual.
        </p>
        <p className="dk-result-description">{archetype.description}</p>
        {secondaryArchetype && <ArchetypeCard meta={secondaryArchetype} kind="secondary" />}
      </section>

      {/* Próximamente */}
      <div className="dk-result-section sys-coming-soon">
        <p className="dk-result-section__label" style={{ color: '#333' }}>
          PRÓXIMAMENTE
        </p>
        <p className="font-body-sm" style={{ color: '#333', margin: 0 }}>
          Fortalezas, cuello de botella y prioridades a 90 días.
        </p>
      </div>
    </div>
  );
}
