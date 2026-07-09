'use client';

import Link from 'next/link';
import { AppIcon } from '@/components/app-icon';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { SectionIntro } from '@/components/pages/section-intro';
import { SubpageCta } from '@/components/pages/subpage-cta';
import { LANDING_IMAGES } from '@/lib/assets';
import { BASE_CONCEPTUAL } from '@/lib/landing-copy';

const DIAGNOSTIC_BRIDGE: ReadonlyArray<{ num: string; title: string; body: string }> = [
  {
    num: '01',
    title: 'Cuatro dimensiones',
    body: 'Propósito, autodominio, cuerpo y orden estructuran todo el sistema. No son categorías decorativas: son la base del cuestionario.',
  },
  {
    num: '02',
    title: 'El diagnóstico las mide',
    body: 'Cada pregunta del diagnóstico inicial apunta a una de estas dimensiones. El resultado no es una etiqueta: es tu estado real, medido.',
  },
  {
    num: '03',
    title: 'Tu índice marca prioridades',
    body: 'Con el índice de alineación inicial sabes qué dimensión requiere atención primero. Ahí empieza tu Ruta.',
  },
];

export function BaseConceptualContent() {
  return (
    <div className="ag-landing ag-page ag-about-page ag-base-page flex min-h-full flex-col antialiased">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="ag-about-hero ag-about-hero--origin relative overflow-hidden">
        <div className="ag-about-hero__bg-wrap" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LANDING_IMAGES.bgAboutSystems}
            alt=""
            className="ag-about-hero__bg ag-about-hero__bg--systems"
          />
        </div>
        <div className="ag-about-hero__scrim" aria-hidden />
        <div className="ag-about-hero__content ag-container relative z-10">
          <ScrollReveal className="ag-about-hero__intro text-center" distance={16}>
            <p className="hud-text text-action-red">{BASE_CONCEPTUAL.eyebrow}</p>
            <h1 className="ag-about-hero__title ag-type-display text-white">
              {BASE_CONCEPTUAL.title}
              <br />
              {BASE_CONCEPTUAL.titleLine2}
            </h1>
            <p className="ag-about-hero__origin font-body-lg">{BASE_CONCEPTUAL.lead}</p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Biblioteca de dimensiones ────────────────────────────────── */}
      <section
        className="ag-section-inner ag-about-block ag-about-block--dark ag-base-library"
        aria-labelledby="dimensiones-heading"
      >
        <div className="ag-container">
          <SectionIntro
            eyebrow={BASE_CONCEPTUAL.sectionEyebrow}
            title={BASE_CONCEPTUAL.sectionTitle}
            lead={BASE_CONCEPTUAL.sectionLead}
            headingId="dimensiones-heading"
          />

          <ScrollStaggerContainer className="ag-base-grid" stagger={0.08}>
            {BASE_CONCEPTUAL.pillars.map((pillar, index) => (
              <StaggerItem key={pillar.title} distance={14} className="ag-base-grid__item">
                <article className="ag-base-card">
                  <div className="ag-base-card__head">
                    <span className="ag-base-card__num" aria-hidden>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="ag-base-card__title ag-type-item text-white">{pillar.title}</h3>
                  <p className="ag-base-card__body font-body-md">{pillar.body}</p>
                  <span className="ag-base-card__bar" aria-hidden />
                </article>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>

          <ScrollReveal className="ag-base-library__more text-center" distance={10} delay={0.06}>
            <Link href="/marco-central" className="ag-marco-more__link font-label-lg">
              La metodología completa vive en el Marco Central
              <AppIcon name="arrow-right" size={16} />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── De la teoría al diagnóstico ──────────────────────────────── */}
      <section className="ag-section-inner ag-base-bridge" aria-labelledby="bridge-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="MK · DE LA TEORÍA AL SISTEMA"
            title="Esto no se queda en papel."
            lead="Las cuatro dimensiones son la columna vertebral del diagnóstico y de tu Ruta."
            headingId="bridge-heading"
          />
          <ol className="ag-base-bridge__list">
            {DIAGNOSTIC_BRIDGE.map((step, index) => (
              <ScrollReveal key={step.num} className="ag-base-bridge__item" distance={12}>
                <div className="ag-base-bridge__rail" aria-hidden>
                  <span className="ag-base-bridge__node" />
                  {index < DIAGNOSTIC_BRIDGE.length - 1 ? (
                    <span className="ag-base-bridge__line" />
                  ) : null}
                </div>
                <div className="ag-base-bridge__copy">
                  <p className="hud-text text-action-red">{step.num}</p>
                  <h3 className="ag-base-bridge__title ag-type-item text-white">{step.title}</h3>
                  <p className="ag-base-bridge__body font-body-md">{step.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Close ────────────────────────────────────────────────────── */}
      <SubpageCta
        eyebrow="MK · EL SIGUIENTE PASO"
        title={BASE_CONCEPTUAL.close}
        lead={BASE_CONCEPTUAL.closeLead}
        className="ag-base-close"
      >
        <Link href="/" className="ag-page-back font-label-lg">
          <AppIcon name="arrow-right" size={14} className="ag-page-back__icon" />
          Volver al inicio
        </Link>
      </SubpageCta>
    </div>
  );
}
