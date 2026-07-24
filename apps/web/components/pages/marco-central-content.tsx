'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AppIcon } from '@/components/app-icon';
import { ArchetypePortrait } from '@/components/archetype/ArchetypePortrait';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { SectionIntro } from '@/components/pages/section-intro';
import { SubpageCta } from '@/components/pages/subpage-cta';
import {
  ARCHETYPES,
  ARCHETYPE_SLUGS,
  type ArchetypeSlug,
} from '@/lib/archetypes';
import { LANDING_IMAGES } from '@/lib/assets';
import {
  ACTION_STEPS,
  HDRP_BLOCKS,
  MARCO_CARDS,
  MARCO_STAGES,
  MARCO_VIDEO,
  type MarcoCard,
} from '@/lib/marco-central';
import { DOMAINS, INTEGRATION_EXAMPLES, PILLARS } from '@/lib/mk-system';

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
          <span className="ag-marco-pillar__num font-display-xl" aria-hidden>
            {card.num}
          </span>
          <span className="ag-marco-pillar__meta">
            <span className="ag-marco-pillar__title font-headline-sm">{card.title}</span>
            <span className="ag-marco-pillar__question font-body-md">{card.question}</span>
            <span className="ag-marco-pillar__apport hud-text">{card.apport}</span>
          </span>
          <motion.span
            className="ag-marco-pillar__chevron-wrap"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
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
        transition={{ duration: reduced ? 0 : 0.32, ease: [0.2, 0.8, 0.2, 1] }}
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
            lead="Maximus Kratos estudia las dimensiones que construyen la dirección de un hombre y las ordena dentro de una misma arquitectura. Nueve pilares permiten auditar su vida. El arquetipo muestra cómo ejerce sus capacidades. La sombra revela cómo puede deformarlas. La Hoja de Ruta de Propósito integra todo en un plano que después se convierte en ejecución."
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
            title="Muchas preguntas. Un solo sistema."
            lead="Cada componente de MK cumple una función distinta. Juntos convierten la reflexión personal en una estructura que puede guiar decisiones, acciones y progreso."
            headingId="arch-heading"
          />

          <ScrollReveal className="ag-marco-flow" distance={14}>
            <ol className="ag-marco-flow__list">
              {MARCO_STAGES.map((stage, index) => (
                <li key={stage.num} className="ag-marco-flow__item">
                  <article className="ag-marco-flow__node">
                    <div className="ag-marco-flow__head">
                      <span className="ag-marco-flow__num font-display-xl" aria-hidden>
                        {stage.num}
                      </span>
                      <span className="ag-marco-flow__tag hud-text">{stage.tag}</span>
                    </div>
                    <div className="ag-marco-flow__icon" aria-hidden>
                      <AppIcon name={stage.icon} size={18} />
                    </div>
                    <h3 className="ag-marco-flow__title font-headline-sm">{stage.title}</h3>
                    <p className="ag-marco-flow__body font-body-md">{stage.body}</p>
                    <p className="ag-marco-flow__platform hud-text">
                      En la plataforma: {stage.platform}
                    </p>
                  </article>
                  {index < MARCO_STAGES.length - 1 ? (
                    <span className="ag-marco-flow__connector" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ol>
          </ScrollReveal>
        </div>
      </section>

      {/* ── PILARES × ÁMBITOS ────────────────────────────────────────── */}
      <section className="ag-section-inner ag-marco-matrix-section" aria-labelledby="matrix-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="PILARES × ÁMBITOS"
            title="Cómo se relacionan las dimensiones internas con la vida real."
            lead="Espíritu, Mente y Cuerpo son los tres pilares. Mentalidad, Relaciones, Finanzas y Salud física son los cuatro ámbitos donde esos pilares se manifiestan y se ponen a prueba."
            headingId="matrix-heading"
          />

          <div className="ag-sistema-model__block">
            <div className="ag-sistema-model__block-head">
              <p className="hud-text text-action-red">MATRIZ DE RELACIÓN</p>
              <h3 className="ag-type-item text-white">Los pilares se manifiestan en cada ámbito.</h3>
            </div>
            <div
              className="ag-sistema-matrix"
              role="img"
              aria-label="Los tres pilares (Espíritu, Mente, Cuerpo) se conectan con los cuatro ámbitos (Mentalidad, Relaciones, Finanzas, Salud física)"
            >
              <div className="ag-sistema-matrix__pillars">
                {PILLARS.map((pillar) => (
                  <div
                    key={pillar.key}
                    className="ag-sistema-matrix__node ag-sistema-matrix__node--pillar"
                  >
                    <AppIcon name={pillar.icon} size={18} />
                    <span>{pillar.label}</span>
                  </div>
                ))}
              </div>
              <span className="ag-sistema-matrix__connector" aria-hidden>
                <AppIcon name="arrow-right" size={20} />
              </span>
              <div className="ag-sistema-matrix__domains">
                {DOMAINS.map((domain) => (
                  <div
                    key={domain.key}
                    className="ag-sistema-matrix__node ag-sistema-matrix__node--domain"
                  >
                    <AppIcon name={domain.icon} size={18} />
                    <span>{domain.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ag-sistema-model__block">
            <div className="ag-sistema-model__block-head">
              <p className="hud-text text-action-red">EJEMPLOS DE INTEGRACIÓN</p>
              <h3 className="ag-type-item text-white">Cómo se ven los pilares trabajando juntos.</h3>
            </div>
            <ScrollStaggerContainer className="ag-sistema-integration" stagger={0.08}>
              {INTEGRATION_EXAMPLES.map((example) => {
                const domain = DOMAINS.find((d) => d.key === example.domain);
                if (!domain) return null;
                return (
                  <StaggerItem
                    key={example.domain}
                    className="ag-sistema-integration__item"
                    distance={12}
                  >
                    <div className="ag-panel ag-panel--marco h-full">
                      <span className="ag-panel__corner ag-panel__corner--hover" aria-hidden />
                      <div className="ag-panel__head ag-marco-card__head">
                        <div className="ag-marco-card__icon" aria-hidden>
                          <AppIcon name={domain.icon} size={22} />
                        </div>
                        <div>
                          <p className="ag-panel__card-title font-headline-sm">{domain.label}</p>
                          <p className="ag-sistema-integration__question">{domain.question}</p>
                        </div>
                      </div>
                      <ul className="ag-sistema-integration__list">
                        {PILLARS.map((pillar) => (
                          <li key={pillar.key}>
                            <span className="ag-sistema-integration__pillar">
                              {pillar.label} aporta
                            </span>
                            {example.contributions[pillar.key]}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </StaggerItem>
                );
              })}
            </ScrollStaggerContainer>
          </div>
        </div>
      </section>

      {/* ── LOS OCHO PILARES ─────────────────────────────────────────── */}
      <section className="ag-section-inner ag-marco-pillars" aria-labelledby="pillars-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="LOS NUEVE PILARES"
            title="Las preguntas que sostienen una vida."
            lead="Los pilares no representan áreas independientes. Cada uno resuelve una parte de la arquitectura y modifica la manera en que los demás pueden construirse. Por eso se trabajan en un orden deliberado: del linaje a la huella."
            headingId="pillars-heading"
          />

          <ScrollStaggerContainer className="ag-marco-pillars__grid" stagger={0.05}>
            {MARCO_CARDS.map((card, index) => (
              <StaggerItem key={card.num} className="ag-marco-pillars__item" distance={10}>
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

          <ScrollReveal className="ag-marco-lens" distance={14}>
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
                    <span className="ag-marco-lens__media" aria-hidden>
                      <ArchetypePortrait
                        slug={slug}
                        size="md"
                        className="ag-marco-lens__thumb"
                      />
                    </span>
                    <span className="ag-marco-lens__card-label font-label-lg">{meta.label}</span>
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
              <div className="ag-marco-lens__lead">
                <p className="ag-marco-lens__function font-headline-sm">{archetype.tagline}</p>
                <p className="ag-marco-lens__desc font-body-md">{archetype.description}</p>
              </div>

              <div className="ag-marco-lens__modules">
                <article className="ag-marco-lens__module">
                  <span className="hud-text ag-marco-lens__kicker">En equilibrio</span>
                  <p className="font-body-md">{archetype.balanced}</p>
                </article>
                {archetype.shadowPoles.map((pole) => (
                  <article key={pole.label} className="ag-marco-lens__module ag-marco-lens__module--shadow">
                    <span className="hud-text ag-marco-lens__kicker ag-marco-lens__kicker--shadow">
                      Sombra · {pole.label}
                    </span>
                    <p className="font-body-md">{pole.description}</p>
                  </article>
                ))}
              </div>

              <p className="ag-marco-lens__platform font-body-sm">{archetype.platform}</p>
            </div>
          </ScrollReveal>

          <ScrollReveal className="ag-marco-lens-close" distance={12}>
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
            lead="La Hoja de Ruta de Propósito no es una declaración inspiracional ni una descripción estática de personalidad. Es el documento maestro en el que convergen tu visión, identidad, valores, estándares, propósito, origen, huella, arquetipo y sombra."
            headingId="hdrp-heading"
          />

          <ScrollReveal className="ag-marco-hdrp-body" distance={14}>
            <p className="ag-marco-hdrp-body__lead font-body-lg">
              Su función es darte una referencia estable para decidir qué construir, qué proteger,
              qué corregir y qué rechazar. Cuando aparece una decisión sobre trabajo, dinero,
              relaciones, hábitos o dirección, la HdRP permite evaluarla desde algo más sólido que
              el impulso del momento.
            </p>

            <ul className="ag-marco-hdrp-blocks">
              {HDRP_BLOCKS.map((block) => (
                <li key={block.title} className="ag-marco-hdrp-blocks__item">
                  <span className="ag-marco-hdrp-blocks__title font-label-lg">{block.title}</span>
                  <span className="ag-marco-hdrp-blocks__body font-body-md">{block.body}</span>
                </li>
              ))}
            </ul>

            <aside className="ag-marco-doc" aria-label="Representación de la Hoja de Ruta">
              <div className="ag-marco-doc__chrome">
                <span className="hud-text">HdRP · VIVA</span>
                <span className="ag-marco-doc__status hud-text">Perfil Maestro ↔ Ruta MK</span>
              </div>
              <div className="ag-marco-doc__body">
                <p className="ag-marco-doc__title font-headline-sm">Hoja de Ruta de Propósito</p>
                <div className="ag-marco-doc__lines" aria-hidden>
                  <span className="ag-marco-doc__line ag-marco-doc__line--short" />
                  <span className="ag-marco-doc__line" />
                  <span className="ag-marco-doc__line ag-marco-doc__line--mid" />
                </div>
                <div className="ag-marco-doc__sections">
                  {HDRP_BLOCKS.slice(0, 4).map((block) => (
                    <div key={block.title} className="ag-marco-doc__section">
                      <span className="hud-text">{block.title}</span>
                      <span className="ag-marco-doc__bar" aria-hidden />
                    </div>
                  ))}
                </div>
                <div className="ag-marco-doc__foot">
                  <span className="ag-marco-doc__chip hud-text">Arquetipo</span>
                  <span className="ag-marco-doc__chip hud-text">Sombra</span>
                  <span className="ag-marco-doc__chip hud-text">Prioridades</span>
                </div>
              </div>
            </aside>
          </ScrollReveal>
        </div>
      </section>

      {/* ── DE LA ARQUITECTURA A LA ACCIÓN ───────────────────────────── */}
      <section className="ag-section-inner ag-marco-action" aria-labelledby="action-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="DE LA ARQUITECTURA A LA ACCIÓN"
            title="Un plano solo importa cuando modifica la forma de vivir."
            lead="Lo descubierto en el Marco Central no permanece como contenido de lectura. MK convierte la Hoja de Ruta en prioridades, misiones, prácticas e indicadores que permiten actuar, registrar y revisar el proceso."
            headingId="action-heading"
          />

          <ScrollReveal className="ag-about-cycle ag-marco-action__cycle" distance={14}>
            <div className="ag-about-cycle__ring">
              <svg className="ag-about-cycle__orbit" viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="38" fill="none" pathLength="100" />
                <polygon points="50,8 47.2,13.5 52.8,13.5" className="ag-about-cycle__orbit-arrow" />
              </svg>

              <div className="ag-about-cycle__hub" aria-hidden>
                <p className="hud-text text-action-red">CICLO</p>
                <p className="ag-about-cycle__hub-title">Ruta</p>
                <p className="ag-about-cycle__hub-sub">define → ajusta</p>
              </div>

              <ol className="ag-about-cycle__list">
                {ACTION_STEPS.map((step, index) => (
                  <li
                    key={step.num}
                    className={`ag-about-cycle__step ag-about-cycle__step--${index + 1}`}
                  >
                    <span className="ag-about-cycle__num hud-text">{step.num}</span>
                    <h3 className="ag-about-cycle__title font-headline-sm">{step.title}</h3>
                    <p className="ag-about-cycle__body font-body-md">{step.body}</p>
                  </li>
                ))}
              </ol>
            </div>
            <p className="ag-about-cycle__note font-body-md">
              El sistema no termina cuando completas una auditoría. Cada nueva etapa permite
              volver a leer, corregir y fortalecer la arquitectura.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── EL MÉTODO EXPLICADO (después de la estructura) ───────────── */}
      <section className="ag-section-inner ag-marco-video" aria-labelledby="video-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="EL MÉTODO EXPLICADO"
            title="Escucha cómo se conectan sus partes."
            lead="Conoce por qué el Marco Central se construye mediante nueve pilares, cómo funcionan los arquetipos y la sombra, y de qué manera todo se integra en la Hoja de Ruta de Propósito."
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

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <SubpageCta />
    </div>
  );
}
