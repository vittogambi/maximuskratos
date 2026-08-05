'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AppIcon } from '@/components/app-icon';
import { ArchetypePortrait } from '@/components/archetype/ArchetypePortrait';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import {
  INTERACTION_SPRING,
  MOTION_DISTANCE,
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_STAGGER,
  interactionChevronTransition,
  interactionContentTransition,
} from '@/components/motion/tokens';
import { SectionIntro } from '@/components/pages/section-intro';
import { SubpageCta } from '@/components/pages/subpage-cta';
import { PublicFaqSection } from '@/components/pages/public-faq-section';
import {
  ARCHETYPES,
  ARCHETYPE_SLUGS,
  type ArchetypeSlug,
} from '@/lib/archetypes';
import { LANDING_IMAGES } from '@/lib/assets';
import {
  HDRP_BLOCKS,
  MARCO_CARDS,
  MARCO_STAGES,
  type MarcoCard,
} from '@/lib/marco-central';
import { MARCO_CENTRAL_FAQ_ITEMS } from '@/lib/marco-central-faq';
import { MkPillarsDomainsMatrix } from '@/components/pages/mk-pillars-domains-matrix';
import { MODEL_INTRO } from '@/lib/mk-system';

function PillarCard({
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
    <article className={`ag-marco-pillar${isOpen ? ' ag-marco-pillar--open' : ''}`}>
      <h3 className="ag-marco-pillar__heading" id={`pillar-q-${card.num}`}>
        <button
          type="button"
          className="ag-marco-pillar__trigger"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span className="ag-marco-pillar__icon" aria-hidden>
            <AppIcon name={card.icon} size={18} />
          </span>
          <span className="ag-marco-pillar__meta">
            <span className="ag-marco-pillar__title font-headline-sm">{card.title}</span>
            <span className="ag-marco-pillar__question font-body-md">{card.question}</span>
            <span className="ag-marco-pillar__apport hud-text">{card.apport}</span>
          </span>
          <motion.span
            className="ag-marco-pillar__chevron-wrap"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={reduced ? { duration: 0 } : interactionChevronTransition}
            aria-hidden
          >
            <AppIcon name="chevron-down" size={16} className="ag-marco-pillar__chevron" />
          </motion.span>
        </button>
      </h3>
      <motion.div
        id={panelId}
        className="ag-marco-pillar__panel-wrap"
        aria-labelledby={`pillar-q-${card.num}`}
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={
          reduced
            ? { duration: 0 }
            : {
                duration: MOTION_DURATION.interaction + 0.06,
                ease: MOTION_EASE.standard,
              }
        }
        style={{ overflow: 'hidden' }}
      >
        <div className="ag-marco-pillar__panel">
          <p className="ag-marco-pillar__deep font-body-md">{card.deep}</p>
          {card.link && (
            <Link href={card.link.href} className="ag-inline-link font-label-lg">
              {card.link.label}
              <AppIcon name="arrow-right" size={14} />
            </Link>
          )}
        </div>
      </motion.div>
    </article>
  );
}

export function MarcoCentralContent() {
  const reduced = useReducedMotion();
  const [openPillar, setOpenPillar] = useState<number | null>(null);
  const [activeArchetype, setActiveArchetype] = useState<ArchetypeSlug>('rey');
  const archetype = ARCHETYPES[activeArchetype];

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
            eyebrow="MARCO CENTRAL"
            title="El mapa detrás del método."
            lead="El método completo, antes de cualquier producto."
            as="h1"
            size="display"
          />
        </div>
      </section>

      {/* ── LA ARQUITECTURA ──────────────────────────────────────────── */}
      <section className="ag-section-inner ag-marco-arch" aria-labelledby="arch-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="LA ARQUITECTURA"
            title="Cinco etapas. Un solo sistema."
            lead="Cada pieza tiene un rol. Juntas convierten la reflexión en una estructura que guía decisiones, acciones y progreso."
            headingId="arch-heading"
          />

          <div className="ag-marco-flow">
            <ScrollStaggerContainer
              className="ag-marco-flow__list"
              stagger={MOTION_STAGGER.base}
              itemCount={MARCO_STAGES.length}
            >
              {MARCO_STAGES.map((stage, index) => (
                <StaggerItem key={stage.num} className="ag-marco-flow__item" distance={MOTION_DISTANCE.sm + 2}>
                  <div className="ag-marco-flow__rail" aria-hidden>
                    <span className="ag-marco-flow__num">{stage.num}</span>
                    {index < MARCO_STAGES.length - 1 ? (
                      <span className="ag-marco-flow__connector" />
                    ) : null}
                  </div>
                  <article className="ag-marco-flow__node">
                    <div className="ag-marco-flow__meta">
                      <span className="ag-marco-flow__tag hud-text">{stage.tag}</span>
                      <span className="ag-marco-flow__icon" aria-hidden>
                        <AppIcon name={stage.icon} size={16} />
                      </span>
                    </div>
                    <h3 className="ag-marco-flow__title font-headline-sm">{stage.title}</h3>
                    <p className="ag-marco-flow__body font-body-md">{stage.body}</p>
                    <p className="ag-marco-flow__platform font-body-sm">
                      Dentro de MK: {stage.platform}
                    </p>
                  </article>
                </StaggerItem>
              ))}
            </ScrollStaggerContainer>
          </div>
        </div>
      </section>

      {/* ── EL MODELO MK (matriz) ─────────────────────────────────────── */}
      <section className="ag-section-inner ag-marco-matrix-section" aria-labelledby="matrix-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow={MODEL_INTRO.eyebrow}
            title={MODEL_INTRO.title}
            lead={MODEL_INTRO.lead}
            headingId="matrix-heading"
          />

          <div className="ag-sistema-model__block">
            <MkPillarsDomainsMatrix />
          </div>
        </div>
      </section>

      {/* ── LOS NUEVE COMPONENTES ─────────────────────────────────────── */}
      <section className="ag-section-inner ag-marco-pillars" aria-labelledby="pillars-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="LOS NUEVE COMPONENTES"
            title="Los nueve componentes de la Hoja de Ruta."
            lead="La matriz indica dónde mirar. Los nueve componentes determinan qué construir, del linaje a la huella."
            headingId="pillars-heading"
          />

          <ScrollStaggerContainer
            className="ag-marco-pillars__grid"
            stagger={MOTION_STAGGER.base}
            itemCount={MARCO_CARDS.length}
          >
            {MARCO_CARDS.map((card, index) => (
              <StaggerItem key={card.num} className="ag-marco-pillars__item" distance={MOTION_DISTANCE.sm}>
                <PillarCard
                  card={card}
                  isOpen={openPillar === index}
                  reduced={reduced ?? false}
                  onToggle={() =>
                    setOpenPillar((current) => (current === index ? null : index))
                  }
                />
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>

      {/* ── LENTES DE INTERPRETACIÓN ─────────────────────────────────── */}
      <section className="ag-section-inner ag-marco-lenses" aria-labelledby="lenses-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="LENTES DE INTERPRETACIÓN"
            title="No basta con saber qué quieres. Debes entender cómo ejerces tu poder."
            lead="Los pilares muestran qué estás construyendo. Los arquetipos ayudan a comprender desde qué capacidades lo construyes. La sombra revela qué ocurre cuando esas capacidades pierden equilibrio."
            headingId="lenses-heading"
          />

          <ScrollReveal className="ag-marco-lens" density="default">
            <div
              className="ag-marco-lens__grid"
              role="tablist"
              aria-label="Arquetipos"
            >
              {ARCHETYPE_SLUGS.map((slug) => {
                const meta = ARCHETYPES[slug];
                const selected = slug === activeArchetype;
                return (
                  <button
                    key={slug}
                    type="button"
                    role="tab"
                    id={`lens-tab-${slug}`}
                    aria-selected={selected}
                    aria-controls="lens-panel"
                    className={`ag-marco-lens__card${selected ? ' ag-marco-lens__card--active' : ''}`}
                    onClick={() => setActiveArchetype(slug)}
                  >
                    {selected && !reduced ? (
                      <motion.span
                        layoutId="marco-lens-indicator"
                        className="ag-marco-lens__indicator"
                        transition={INTERACTION_SPRING}
                        aria-hidden
                      />
                    ) : null}
                    <span className="ag-marco-lens__media" aria-hidden>
                      <ArchetypePortrait
                        slug={slug}
                        size="md"
                        className="ag-marco-lens__thumb"
                      />
                    </span>
                    <span className="ag-marco-lens__card-copy">
                      <span className="ag-marco-lens__card-label font-label-lg">{meta.label}</span>
                      <span className="ag-marco-lens__card-tagline font-body-sm">{meta.tagline}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              id="lens-panel"
              role="tabpanel"
              aria-labelledby={`lens-tab-${activeArchetype}`}
              className="ag-marco-lens__panel"
            >
              <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
              <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeArchetype}
                  className="ag-marco-lens__panel-inner"
                  initial={reduced ? false : { opacity: 0, y: MOTION_DISTANCE.micro }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -MOTION_DISTANCE.micro }}
                  transition={reduced ? { duration: 0 } : interactionContentTransition}
                >
                  <div className="ag-marco-lens__lead">
                    <p className="ag-marco-lens__function font-headline-sm">{archetype.tagline}</p>
                    <p className="ag-marco-lens__desc font-body-md">{archetype.description}</p>
                  </div>

                  <div className="ag-marco-lens__modules">
                    <article className="ag-marco-lens__module ag-marco-lens__module--balance">
                      <span className="ag-marco-lens__module-icon" aria-hidden>
                        <AppIcon name="circle-check" size={14} />
                      </span>
                      <span className="hud-text ag-marco-lens__kicker">En equilibrio</span>
                      <p className="font-body-md">{archetype.balanced}</p>
                    </article>
                    {archetype.shadowPoles.map((pole) => (
                      <article
                        key={pole.label}
                        className="ag-marco-lens__module ag-marco-lens__module--shadow"
                      >
                        <span
                          className="ag-marco-lens__module-icon ag-marco-lens__module-icon--shadow"
                          aria-hidden
                        >
                          <AppIcon name="shadow" size={14} />
                        </span>
                        <span className="hud-text ag-marco-lens__kicker ag-marco-lens__kicker--shadow">
                          Sombra · {pole.label}
                        </span>
                        <p className="font-body-md">{pole.description}</p>
                      </article>
                    ))}
                  </div>

                  <p className="ag-marco-lens__platform font-body-sm">{archetype.platform}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </ScrollReveal>

          <ScrollReveal className="ag-marco-lens-close" density="tight">
            <p className="font-body-lg">
              El objetivo no es pertenecer a un solo arquetipo. El objetivo es reconocer qué
              capacidades están desarrolladas, cuáles permanecen ausentes y cuáles están siendo
              gobernadas por su sombra.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── HOJA DE RUTA DE PROPÓSITO ────────────────────────────────── */}
      <section className="ag-section-inner ag-marco-hdrp-section" aria-labelledby="hdrp-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="HOJA DE RUTA DE PROPÓSITO"
            title="El documento que integra el sistema."
            lead="Convierte lo descubierto en una referencia estable para decidir qué construir, qué proteger y qué rechazar."
            headingId="hdrp-heading"
          />

          <ScrollReveal className="ag-marco-hdrp-body" density="default">
            <aside className="ag-marco-doc" aria-label="Contenido de la Hoja de Ruta">
              <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
              <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
              <div className="ag-marco-doc__chrome">
                <span className="hud-text">HdRP</span>
                <span className="ag-marco-doc__status hud-text">Lee. Decide. Actúa</span>
              </div>
              <div className="ag-marco-doc__body">
                <p className="ag-marco-doc__title font-headline-sm">Hoja de Ruta de Propósito</p>
                <div className="ag-marco-doc__route" aria-hidden>
                  <motion.span
                    className="ag-marco-doc__route-line"
                    initial={reduced ? false : { scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{
                      type: 'tween',
                      duration: MOTION_DURATION.reveal,
                      ease: MOTION_EASE.enter,
                    }}
                    style={{ transformOrigin: 'top center' }}
                  />
                </div>
                <ScrollStaggerContainer
                  className="ag-marco-doc__blocks"
                  stagger={MOTION_STAGGER.tight}
                  itemCount={HDRP_BLOCKS.length}
                >
                  {HDRP_BLOCKS.map((block) => (
                    <StaggerItem key={block.title} className="ag-marco-doc__block" distance={MOTION_DISTANCE.sm}>
                      <span className="ag-marco-doc__block-icon" aria-hidden>
                        <AppIcon name={block.icon} size={15} />
                      </span>
                      <span className="ag-marco-doc__block-copy">
                        <span className="ag-marco-doc__block-title">{block.title}</span>
                        <span className="ag-marco-doc__block-body font-body-md">{block.body}</span>
                      </span>
                    </StaggerItem>
                  ))}
                </ScrollStaggerContainer>
              </div>
            </aside>
          </ScrollReveal>
        </div>
      </section>

      {/* ── DEL MARCO AL SISTEMA ─────────────────────────────────────── */}
      <section className="ag-section-inner ag-marco-action" aria-labelledby="action-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="DEL MARCO AL PRODUCTO"
            title="Del plano a la plataforma."
            lead="Lo que aquí se define se ejecuta en el Producto."
            headingId="action-heading"
          />

          <ScrollReveal className="ag-marco-bridge__link" density="tight">
            <Link href="/sistema" className="ag-marco-more__link font-label-lg">
              Ver cómo funciona la plataforma
              <AppIcon name="arrow-right" size={14} />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <PublicFaqSection
        idPrefix="marco"
        title="Preguntas sobre el método."
        lead="Pilares, ámbitos, Hoja de Ruta, arquetipos e Ikigai."
        items={MARCO_CENTRAL_FAQ_ITEMS}
      />

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <SubpageCta />
    </div>
  );
}
