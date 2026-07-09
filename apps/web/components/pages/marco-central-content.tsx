'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import { ArchetypePortrait } from '@/components/archetype/ArchetypePortrait';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { SectionIntro } from '@/components/pages/section-intro';
import { SubpageCta } from '@/components/pages/subpage-cta';
import { ARCHETYPES, ARCHETYPE_SLUGS } from '@/lib/archetypes';
import { LANDING_IMAGES } from '@/lib/assets';
import { MARCO_CARDS, MARCO_VIDEO, type MarcoCard } from '@/lib/marco-central';

const SYSTEM_LAYERS: ReadonlyArray<{
  num: string;
  tag: string;
  icon: AppIconName;
  title: string;
  body: string;
  platform: string;
}> = [
  {
    num: '01',
    tag: 'Entrada',
    icon: 'scan-line',
    title: 'Diagnóstico',
    body: 'Mide tu estado real en espíritu, mente y cuerpo. Es la puerta de entrada al sistema.',
    platform: 'En la plataforma: diagnóstico inicial',
  },
  {
    num: '02',
    tag: 'Auditoría',
    icon: 'columns',
    title: '8 Pilares',
    body: 'El marco audita tu vida completa, pilar por pilar, en un orden deliberado.',
    platform: 'En la plataforma: auditorías de la Ruta',
  },
  {
    num: '03',
    tag: 'Síntesis',
    icon: 'map',
    title: 'HdRP y Arquetipo',
    body: 'Lo auditado se ordena en tu Hoja de Ruta de Propósito, con tu arquetipo y tu sombra.',
    platform: 'En la plataforma: Perfil Maestro',
  },
  {
    num: '04',
    tag: 'Ejecución',
    icon: 'target',
    title: 'Ruta MK',
    body: 'El documento se convierte en ejecución diaria: misiones, indicadores y seguimiento.',
    platform: 'En la plataforma: Ruta MK',
  },
];

function PillarItem({
  card,
  isOpen,
  onToggle,
  reduced,
}: {
  card: MarcoCard;
  isOpen: boolean;
  onToggle: () => void;
  reduced: boolean;
}) {
  const panelId = `pillar-panel-${card.num}`;

  return (
    <article className={`ag-pillar-item${isOpen ? ' ag-pillar-item--open' : ''}`}>
      <h3 className="ag-pillar-item__heading" id={`pillar-q-${card.num}`}>
        <button
          type="button"
          className="ag-pillar-item__trigger"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span className="ag-pillar-item__num font-display-xl" aria-hidden>{card.num}</span>
          <AppIcon name={card.icon} size={20} className="ag-pillar-item__icon" aria-hidden />
          <span className="ag-pillar-item__title font-headline-sm">{card.title}</span>
          <motion.span
            className="ag-pillar-item__chevron-wrap"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            aria-hidden
          >
            <AppIcon name="chevron-down" size={18} className="ag-pillar-item__chevron" />
          </motion.span>
        </button>
      </h3>
      <motion.div
        id={panelId}
        className="ag-pillar-item__panel-wrap"
        aria-labelledby={`pillar-q-${card.num}`}
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: reduced ? 0 : 0.32, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ overflow: 'hidden' }}
      >
        <div className="ag-pillar-item__panel">
          {card.quote && <p className="ag-pillar-item__quote font-body-md">&ldquo;{card.quote}&rdquo;</p>}
          <p className="ag-pillar-item__text font-body-md">{card.deep}</p>
        </div>
      </motion.div>
    </article>
  );
}

export function MarcoCentralContent() {
  const reduced = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="ag-landing ag-page ag-marco-page flex min-h-full flex-col antialiased">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="ag-marco-central-hero relative overflow-hidden">
        <div className="ag-marco-central-hero__bg" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LANDING_IMAGES.bgMarcoCentral}
            alt=""
            className="ag-marco-central-hero__bg-img"
          />
        </div>
        <div className="ag-marco-central-hero__scrim" aria-hidden />
        <div className="ag-container relative z-10">
          <SectionIntro
            eyebrow="MK · MARCO CENTRAL"
            title="El mapa detrás del método."
            lead="Maximus Kratos no es una lista de consejos. Es un marco de 8 pilares que audita tu vida completa, sostenido por una filosofía de arquetipo, sombra y Hoja de Ruta de Propósito que le da sentido a cada uno."
            as="h1"
            size="display"
          />
        </div>
      </section>

      {/* ── EL SISTEMA EN CAPAS ──────────────────────────────────────── */}
      <section className="ag-section-inner ag-marco-layers-section" aria-labelledby="layers-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="MK · SISTEMA OPERATIVO PERSONAL"
            title="Cuatro capas. Un solo flujo."
            lead="Del diagnóstico a la ejecución diaria: cada capa alimenta a la siguiente."
            headingId="layers-heading"
          />
          <ScrollStaggerContainer className="ag-marco-layers" stagger={0.09}>
            {SYSTEM_LAYERS.map((layer) => (
              <StaggerItem key={layer.num} distance={14} className="ag-marco-layers__item">
                <article className="ag-marco-layer">
                  <div className="ag-marco-layer__head">
                    <span className="ag-marco-layer__num font-display-xl" aria-hidden>
                      {layer.num}
                    </span>
                    <span className="ag-marco-layer__tag hud-text">{layer.tag}</span>
                  </div>
                  <div className="ag-marco-layer__icon" aria-hidden>
                    <AppIcon name={layer.icon} size={20} />
                  </div>
                  <h3 className="ag-marco-layer__title font-headline-sm">{layer.title}</h3>
                  <p className="ag-marco-layer__body font-body-md">{layer.body}</p>
                  <p className="ag-marco-layer__platform hud-text">{layer.platform}</p>
                </article>
                <span className="ag-marco-layers__connector" aria-hidden>
                  <AppIcon name="arrow-right" size={16} />
                </span>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>

      {/* ── VIDEO ────────────────────────────────────────────────────── */}
      <section className="ag-section-inner ag-marco-video" aria-labelledby="video-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="MK · EL MÉTODO EXPLICADO"
            title="Escúchalo de quien lo diseñó."
            headingId="video-heading"
          />
          <ScrollReveal className="ag-marco-video__frame" distance={14} delay={0.05}>
            <iframe
              src={MARCO_VIDEO.embedUrl}
              title="Maximus Kratos: El Marco Central explicado"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              className="ag-marco-video__iframe"
            />
          </ScrollReveal>
        </div>
      </section>

      {/* ── NIVEL 1 — LOS 8 PILARES ──────────────────────────────────── */}
      <section className="ag-section-inner ag-marco-pillars" aria-labelledby="pillars-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="NIVEL 1 · PARA EMPEZAR"
            title="Los 8 Pilares"
            lead="El proceso de auditoría y autodescubrimiento que da forma a tu Hoja de Ruta de Propósito. Toca cada pilar para profundizar."
            headingId="pillars-heading"
          />

          <ScrollStaggerContainer className="ag-pillar-list" stagger={0.06}>
            {MARCO_CARDS.map((card, index) => (
              <StaggerItem key={card.num} distance={10}>
                <PillarItem
                  card={card}
                  isOpen={openIndex === index}
                  reduced={reduced ?? false}
                  onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
                />
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>

      {/* ── NIVEL 2 — ZONA PROFUNDA ──────────────────────────────────── */}
      <section className="ag-section-inner ag-marco-deep" aria-labelledby="deep-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="NIVEL 2 · PARA QUIEN YA ENTRÓ"
            title="Lo que sostiene el marco."
            lead="Los 8 pilares se auditan y se ordenan en un documento. Esto es lo que le da forma a ese documento y a lo que encuentras en el camino."
            headingId="deep-heading"
          />

          {/* HdRP */}
          <ScrollReveal className="ag-panel ag-panel--wide ag-marco-hdrp relative overflow-hidden" distance={14} delay={0.05}>
            <span className="ag-panel__inset" aria-hidden />
            <div className="ag-marco-hdrp__icon" aria-hidden>
              <AppIcon name="map" size={26} />
            </div>
            <p className="hud-text ag-marco-hdrp__eyebrow">HOJA DE RUTA DE PROPÓSITO (HdRP)</p>
            <p className="font-body-lg ag-marco-hdrp__body">
              El documento maestro que articula tu Visión con tus Valores y el desarrollo de las
              áreas psicológica, relacional, financiera y física. Es un <em>pacto de
              responsabilidad radical</em>: convierte tu propósito en un legado medible.
            </p>
            <p className="font-body-md ag-marco-hdrp__note">
              Cuando dudes sobre una inversión, una relación o un hábito, la respuesta no está en
              cómo te sientes ese día, sino en tu Hoja de Ruta.
            </p>
          </ScrollReveal>

          {/* Arquetipos + Sombra */}
          <div className="ag-marco-archetypes">
            <ScrollReveal className="text-center" distance={12}>
              <p className="hud-text ag-marco-archetypes__eyebrow">LOS 4 ARQUETIPOS Y SU SOMBRA</p>
            </ScrollReveal>
            <ScrollStaggerContainer className="ag-marco-archetypes__grid" stagger={0.08}>
              {ARCHETYPE_SLUGS.map((slug) => {
                const meta = ARCHETYPES[slug];
                return (
                  <StaggerItem key={slug} distance={14} className="ag-marco-archetype-card">
                    <ArchetypePortrait slug={slug} size="md" className="ag-marco-archetype-card__portrait" />
                    <p className="font-headline-sm text-white ag-marco-archetype-card__name">
                      {meta.label}
                    </p>
                    <p className="font-body-sm ag-marco-archetype-card__tagline">{meta.tagline}</p>
                    <div className="ag-marco-archetype-card__shadow">
                      <span className="hud-text ag-marco-archetype-card__shadow-eyebrow">SOMBRA</span>
                      <p className="font-body-sm ag-marco-archetype-card__shadow-label">
                        {meta.shadow.label}
                      </p>
                      <p className="font-body-sm ag-marco-archetype-card__shadow-text">
                        {meta.shadow.description}
                      </p>
                    </div>
                  </StaggerItem>
                );
              })}
            </ScrollStaggerContainer>
          </div>

          <ScrollReveal className="text-center ag-marco-closing" distance={12}>
            <p className="font-body-lg ag-marco-closing__text">
              Ocho pilares, cuatro arquetipos y una sombra por integrar. No es una lista de
              tareas: es la arquitectura completa de un hombre que decide dejar de operar por
              inercia.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <SubpageCta
        title="Empieza tu propia Hoja de Ruta."
        lead="Diagnóstico gratuito. Arquetipo, sombra e índice de alineación inicial en minutos."
      />
    </div>
  );
}
