'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import { HeroReveal, HeroRevealItem } from '@/components/motion/hero-reveal';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { AuthCta } from '@/components/auth-cta';
import { PublicFooter } from '@/components/public-footer';
import { PublicNav } from '@/components/public-nav';
import { LANDING_IMAGES } from '@/lib/assets';
import { LANDING_FAQ_ITEMS } from '@/lib/landing-faq';
import {
  FOUNDER_BENEFITS,
  METHOD_PHASE_MICROSTATES,
  PLATFORM_STATUS_LINE,
} from '@/lib/platform-status';
import { EarlyAccessForm } from '@/components/early-access-form';

const MK_REALMS = [
  {
    label: 'Espíritu',
    icon: 'flame' as const,
    symbol: 'Llama eterna',
    body: 'La fuerza vital que guía tu voluntad, visión y disciplina.',
  },
  {
    label: 'Mente',
    icon: 'brain' as const,
    symbol: 'Cerebro',
    body: 'La herramienta que ordena el caos y traza los planes de ejecución.',
  },
  {
    label: 'Cuerpo',
    icon: 'muscles' as const,
    symbol: 'Músculos',
    body: 'La fuerza que hace realidad tus planes en el mundo tangible.',
  },
] as const;

const CRISIS_CARDS = [
  {
    num: '01',
    title: 'Falta de Visión',
    body: 'Operar sin una trayectoria clara a 5 años.',
  },
  {
    num: '02',
    title: 'Identidad Fragmentada',
    body: 'Inconsistencias entre las acciones y el yo deseado.',
  },
  {
    num: '03',
    title: 'Energía Agotada',
    body: 'Agotamiento físico y mental por desalineación.',
  },
] as const;

function FaqItem({
  id,
  question,
  answer,
  isOpen,
  onToggle,
  reduced,
}: {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  reduced: boolean;
}) {
  const answerId = `faq-answer-${id}`;

  return (
    <article className={`ag-faq-item${isOpen ? ' ag-faq-item--open' : ''}`}>
      <h3 className="ag-faq-item__heading" id={`faq-q-${id}`}>
        <button
          type="button"
          className="ag-faq-item__trigger"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={answerId}
        >
          <span className="ag-faq-item__question font-headline-sm">{question}</span>
          <motion.span
            className="ag-faq-item__chevron-wrap"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            aria-hidden
          >
            <AppIcon name="chevron-down" size={18} className="ag-faq-item__chevron" />
          </motion.span>
        </button>
      </h3>
      <motion.div
        id={answerId}
        className="ag-faq-item__answer-wrap"
        aria-labelledby={`faq-q-${id}`}
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          duration: reduced ? 0 : 0.32,
          ease: [0.2, 0.8, 0.2, 1],
        }}
        style={{ overflow: 'hidden' }}
      >
        <p className="ag-faq-item__answer-text font-body-md">{answer}</p>
      </motion.div>
    </article>
  );
}

const MARCO_CARDS: ReadonlyArray<{
  num: string;
  title: string;
  icon: AppIconName;
  quote?: string;
  body: string;
}> = [
  {
    num: '01',
    title: 'Visión',
    icon: 'helm',
    quote: 'Lo que me gustaría llegar a ser.',
    body: 'Define el hombre que quieres encarnar. Tu timón orienta cada decisión hacia ese futuro.',
  },
  {
    num: '02',
    title: 'Identidad',
    icon: 'sword',
    quote: 'Diga el débil: Fuerte soy.',
    body: 'No cambias resultados hasta cambiar cómo te ves. La tensión entre quién eres y quién declaras ser.',
  },
  {
    num: '03',
    title: 'Valores',
    icon: 'columns',
    quote: 'Principios que me guían.',
    body: 'Pilares que guían tus decisiones. Coherencia con la visión, no solo con las metas.',
  },
  {
    num: '04',
    title: 'Estándares',
    icon: 'crown',
    quote: 'La identidad se construye sobre la base de los estándares, no de la motivación.',
    body: 'Reglas personales, no deseos. Los valores hechos acción y hábito diario.',
  },
  {
    num: '05',
    title: 'La Sombra',
    icon: 'shadow',
    quote: 'Lo que niegas, te somete. Lo que aceptas, te transforma.',
    body: 'Lo oculto esconde fortalezas. Integrarlo devuelve energía y baja el sabotaje interno.',
  },
  {
    num: '06',
    title: 'Ikigai',
    icon: 'ikigai',
    quote: 'Mi razón de ser.',
    body: 'Pasión, vocación, misión y oficio alineados. De ahí sale el sentido de tu vida.',
  },
  {
    num: '07',
    title: 'Origen y Linaje',
    icon: 'anchor',
    quote: 'Mis antepasados habitan en mí.',
    body: 'Nombre, apellido y linaje como raíz. Eslabón consciente de una cadena que honras y transformas.',
  },
  {
    num: '08',
    title: 'Huella Personal',
    icon: 'target',
    quote: 'El sello que dejaré en el mundo.',
    body: 'El legado que construyes: el mensaje que dejas en quienes te rodean y la marca que imprimes en el mundo.',
  },
];

type GradientDir = 'to-b' | 'to-t';

function StickyStatue({
  src,
  alt,
  imgOpacity,
  gradientDir,
  gradientFrom,
  gradientVia,
  gradientTo,
  hasBg,
  variant = 'default',
}: {
  src: string;
  alt: string;
  imgOpacity: number;
  gradientDir: GradientDir;
  gradientFrom: string;
  gradientVia?: string;
  gradientTo: string;
  hasBg?: boolean;
  variant?: 'default' | 'hero' | 'crisis';
}) {
  const gradientStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: gradientVia
      ? `linear-gradient(${gradientDir === 'to-b' ? 'to bottom' : 'to top'}, ${gradientFrom}, ${gradientVia}, ${gradientTo})`
      : `linear-gradient(${gradientDir === 'to-b' ? 'to bottom' : 'to top'}, ${gradientFrom}, ${gradientTo})`,
  };

  const isHero = variant === 'hero';
  const isCrisis = variant === 'crisis';

  return (
    <div
      className={
        isHero ? 'ag-sticky-bg ag-hero-bg' : isCrisis ? 'ag-sticky-bg ag-crisis-bg' : 'ag-sticky-bg'
      }
      style={hasBg ? { backgroundColor: '#0e0e0e' } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={
          isHero ? 'ag-hero-bg__img' : isCrisis ? 'ag-crisis-bg__img' : undefined
        }
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          maxWidth: 'none',
          objectFit: 'cover',
          ...(isHero || isCrisis ? {} : { objectPosition: 'center' }),
          opacity: imgOpacity,
        }}
      />
      {isHero && <div className="ag-hero-bg__scrim" aria-hidden />}
      <div style={gradientStyle} />
    </div>
  );
}

export function AethelgardLanding() {
  const reduced = useReducedMotion();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <div className="ag-landing flex min-h-screen flex-col overflow-x-hidden antialiased" style={{ background: '#0e0e0e', color: '#e5e2e1' }}>
      <PublicNav />

      {/* HUD */}
      <div
        className="ag-hud pointer-events-none fixed inset-0 z-40 overflow-hidden"
        style={{ mixBlendMode: 'screen', opacity: 0.5 }}
      >
        <div className="hud-line hud-line--left top-0 h-screen w-px" />
        <div className="hud-line hud-line--right top-0 h-screen w-px" />
      </div>

      <main className="grow">
        <div className="relative w-full">

          {/* ── Hero — Clean Statue ──────────────────────────────────────── */}
          <section className="ag-hero-section relative">
            <StickyStatue
              src={LANDING_IMAGES.statueClean}
              alt="Estatua"
              imgOpacity={0.8}
              gradientDir="to-b"
              gradientFrom="transparent"
              gradientVia="transparent"
              gradientTo="#0e0e0e"
              hasBg
              variant="hero"
            />
            <div className="ag-hero-overlay pointer-events-none relative z-10 flex flex-col justify-between">
              <HeroReveal className="ag-hero-title-zone">
                <HeroRevealItem distance={18}>
                  <h1 className="ag-hero-title cinematic-shadow">
                    <span className="ag-hero-title__line">Descúbrete.</span>
                    <span className="ag-hero-title__line">Alíneate.</span>
                    <span className="ag-hero-title__line">Construye.</span>
                  </h1>
                  <p className="ag-hero-title__lead font-body-lg cinematic-shadow mt-4 max-w-xl text-center text-white/85">
                    Define tu propósito trascendental y conviértelo en una vida coherente,
                    significativa y con impacto.
                  </p>
                </HeroRevealItem>
              </HeroReveal>
              <HeroReveal className="ag-hero-cta-zone pointer-events-auto flex w-full items-center justify-center">
                <HeroRevealItem distance={16}>
                  <div className="ag-panel ag-panel--hero">
                    <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
                    <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
                    <p className="ag-panel__body font-body-lg">
                      Una metodología que construye sistemas alienados a tu propósito
                      trascendental.
                    </p>
                    <p className="ag-hero-status hud-text">{PLATFORM_STATUS_LINE}</p>
                    <AuthCta href="/register" className="btn-primary font-label-lg">
                      Crea tu cuenta de fundador
                    </AuthCta>
                  </div>
                </HeroRevealItem>
              </HeroReveal>
            </div>
          </section>

          {/* ── Crisis — Broken Statue ───────────────────────────────────── */}
          <section id="crisis" className="ag-crisis-section relative">
            <StickyStatue
              src={LANDING_IMAGES.statueBroken}
              alt="Estatua rota"
              imgOpacity={0.7}
              gradientDir="to-b"
              gradientFrom="#0e0e0e"
              gradientVia="transparent"
              gradientTo="#0e0e0e"
              variant="crisis"
            />
            <div className="ag-crisis-content relative z-10">
              <div className="ag-container mx-auto w-full max-w-6xl">
                <ScrollReveal className="ag-crisis-intro text-center" distance={16}>
                  <span
                    className="font-label-lg mb-6 flex items-center justify-center gap-4 text-sm uppercase text-action-red"
                    style={{ letterSpacing: '0.3em' }}
                  >
                    <span className="h-px w-8 bg-action-red" />
                    La Crisis Moderna
                    <span className="h-px w-8 bg-action-red" />
                  </span>
                  <h2
                    className="ag-crisis-title font-display-xl text-glow text-action-red"
                    style={{ fontSize: 'clamp(2.25rem, 7vw, 4.5rem)' }}
                  >
                    El hombre 
                    <br />
                    sin rumbo
                  </h2>
                  <p className="ag-crisis-lead font-body-lg cinematic-shadow text-white/80">
                    El caos es el estado natural. En un mundo de distracción infinita, la mayoría
                    carece de un plan definitivo para sus vidas.
                  </p>
                </ScrollReveal>
                <ScrollStaggerContainer className="ag-crisis-cards">
                  {CRISIS_CARDS.map((card) => (
                    <StaggerItem key={card.num} distance={16}>
                      <div className="ag-milled-card group relative">
                        <span className="font-headline-md text-glow mb-6 block text-5xl text-action-red opacity-50 transition-opacity group-hover:opacity-100">
                          {card.num}
                        </span>
                        <h3 className="font-headline-sm mb-4 text-2xl text-white">{card.title}</h3>
                        <p className="font-body-md text-lg text-white/70">{card.body}</p>
                      </div>
                    </StaggerItem>
                  ))}
                </ScrollStaggerContainer>
              </div>
            </div>
          </section>

          {/* ── Operating System ─────────────────────────────────────────── */}
          <section id="funcionamiento" className="ag-section-inner ag-os-section relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
              }}
            />
            <div className="ag-container relative z-10 mx-auto">
              <ScrollReveal className="ag-os-intro text-center" distance={16}>
                <span className="hud-text mb-4 block text-action-red">MK · EL MÉTODO</span>
                <h2
                    className="font-display-xl leading-tight text-white"
                    style={{ fontSize: 'clamp(3rem, 7vw, 4.5rem)' }}
                  >
                    La arquitectura del sentido
                  </h2>
                <p className="ag-os-lead font-body-lg text-xl text-white/70">
                  No es coaching ni motivación. Es una metodología documentada que alinea Espíritu,
                  Mente y Cuerpo. No se queda en teoría: se convierte en tu sistema personal, etapa
                  por etapa.
                </p>
              </ScrollReveal>

              <ScrollReveal className="ag-mk-alignment" distance={14}>

                <div className="ag-mk-realms">
                  <div className="ag-mk-realms__rail" aria-hidden>
                    <span className="ag-mk-realms__rail-line" />
                    <span className="ag-mk-realms__rail-core">Alinea</span>
                    <span className="ag-mk-realms__rail-line" />
                  </div>
                  {MK_REALMS.map((realm) => (
                    <div key={realm.label} className="ag-mk-realm">
                      <div className="ag-mk-realm__node" aria-hidden />
                      <div className="ag-mk-realm__icon" aria-hidden>
                        <AppIcon name={realm.icon} size={22} />
                      </div>
                      <span className="ag-mk-realm__label font-headline-sm">{realm.label}</span>
                      <span className="ag-mk-realm__symbol hud-text">{realm.symbol}</span>
                      <p className="ag-mk-realm__body font-body-md">{realm.body}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>

              <div className="ag-os-phases">
                {/* Phase 01 */}
                <ScrollReveal className="ag-phase-row" distance={18}>
                  <div className="ag-phase-media relative order-2 lg:order-1">
                    <div className="absolute -inset-4 border border-white/10" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={LANDING_IMAGES.phase01}
                      alt="Fase 01"
                      className="h-auto w-full border border-white/5 object-cover opacity-80 grayscale mix-blend-lighten"
                    />
                    <div className="hud-text absolute left-4 top-4 border border-white/20 bg-black/80 px-2 py-1">
                      ESPÍRITU · MENTE · CUERPO
                    </div>
                  </div>
                  <div className="ag-panel ag-panel--phase order-1 lg:order-2">
                    <div className="hud-text mb-4 text-action-red">FASE 01 · DIAGNÓSTICO</div>
                    <h3 className="ag-panel__title font-headline-md">Diagnóstico en 3 dimensiones</h3>
                    <p className="ag-panel__body font-body-md">
                      Ver la realidad sin autoengaño. Un diagnóstico honesto en Espíritu, Mente y Cuerpo
                      para saber dónde estás fragmentado y qué te está frenando.
                    </p>
                    <div className="ag-phase-steps">
                      <div className="ag-phase-step">
                        <span className="hud-text ag-phase-step__label">Evaluamos</span>
                        <p className="ag-phase-step__text">Espíritu, Mente y Cuerpo en profundidad.</p>
                      </div>
                      <div className="ag-phase-step">
                        <span className="hud-text ag-phase-step__label">Detectamos</span>
                        <p className="ag-phase-step__text">Brechas, patrones ocultos y causa raíz.</p>
                      </div>
                      <div className="ag-phase-step">
                        <span className="hud-text ag-phase-step__label">Entregamos</span>
                        <p className="ag-phase-step__text">Tu diagnóstico e índice de alineación.</p>
                      </div>
                    </div>
                    <p className="ag-phase-microstate hud-text">{METHOD_PHASE_MICROSTATES.diagnostico}</p>
                  </div>
                </ScrollReveal>

                {/* Phase 02 */}
                <ScrollReveal className="ag-phase-row" distance={18}>
                  <div className="ag-panel ag-panel--phase">
                    <div className="hud-text mb-4 text-action-red">FASE 02 · ARQUITECTURA</div>
                    <h3 className="ag-panel__title font-headline-md">Plano de Vida</h3>
                    <p className="ag-panel__body font-body-md">
                      Antes que la estrategia, viene la identidad. Con el diagnóstico hecho, redefinimos
                      quién eres, hacia dónde vas y cómo se articula tu propósito.
                    </p>
                    <div className="ag-phase-steps">
                      <div className="ag-phase-step">
                        <span className="hud-text ag-phase-step__label">Definimos</span>
                        <p className="ag-phase-step__text">Identidad, valores, estándares y arquetipo.</p>
                      </div>
                      <div className="ag-phase-step">
                        <span className="hud-text ag-phase-step__label">Diseñamos</span>
                        <p className="ag-phase-step__text">Tu declaración de propósito y Plano de Vida.</p>
                      </div>
                      <div className="ag-phase-step">
                        <span className="hud-text ag-phase-step__label">Entregamos</span>
                        <p className="ag-phase-step__text">Hoja de ruta a 30, 90 y 365 días.</p>
                      </div>
                    </div>
                    <p className="ag-phase-microstate hud-text">{METHOD_PHASE_MICROSTATES.arquitectura}</p>
                  </div>
                  <div className="ag-phase-media relative">
                    <div className="absolute -inset-4 border border-white/10" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={LANDING_IMAGES.phase02}
                      alt="Fase 02"
                      className="h-auto w-full border border-white/5 object-cover opacity-90 mix-blend-lighten"
                    />
                    <div className="hud-text absolute right-4 top-4 border border-white/20 bg-black/80 px-2 py-1">
                      PLANO DE VIDA
                    </div>
                  </div>
                </ScrollReveal>

                {/* Phase 03 */}
                <ScrollReveal className="ag-phase-row" distance={18}>
                  <div className="ag-phase-media relative order-2 lg:order-1">
                    <div className="absolute -inset-4 border border-white/10" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={LANDING_IMAGES.phase03}
                      alt="Fase 03"
                      className="h-auto w-full border border-white/5 object-cover opacity-100 mix-blend-lighten"
                    />
                    <div className="hud-text absolute left-4 top-4 border border-white/20 bg-black/80 px-2 py-1">
                      RITMO DIARIO
                    </div>
                  </div>
                  <div className="ag-panel ag-panel--phase order-1 lg:order-2">
                    <div className="hud-text mb-4 text-action-red">FASE 03 · EJECUCIÓN</div>
                    <h3 className="ag-panel__title font-headline-md">Ritmo de ejecución diaria</h3>
                    <p className="ag-panel__body font-body-md">
                      El plan solo sirve si se vive. Activamos hábitos y misiones para que cada día
                      avance hacia tu plan maestro con disciplina sostenida.
                    </p>
                    <div className="ag-phase-steps">
                      <div className="ag-phase-step">
                        <span className="hud-text ag-phase-step__label">Activamos</span>
                        <p className="ag-phase-step__text">Misiones diarias y hábitos alineados al plan.</p>
                      </div>
                      <div className="ag-phase-step">
                        <span className="hud-text ag-phase-step__label">Acompañamos</span>
                        <p className="ag-phase-step__text">Seguimiento semanal y alertas de desvío.</p>
                      </div>
                      <div className="ag-phase-step">
                        <span className="hud-text ag-phase-step__label">Medimos</span>
                        <p className="ag-phase-step__text">Hitos a 40 días, 3, 6 y 12 meses.</p>
                      </div>
                    </div>
                    <p className="ag-phase-microstate hud-text">{METHOD_PHASE_MICROSTATES.ejecucion}</p>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </section>

          {/* ── Marco Central — Aligned Statue ───────────────────────────── */}
          <section id="marco-central" className="ag-marco-section relative">
            <StickyStatue
              src={LANDING_IMAGES.statueAligned}
              alt="Estatua alineada"
              imgOpacity={0.8}
              gradientDir="to-b"
              gradientFrom="#0e0e0e"
              gradientVia="rgba(14,14,14,0.7)"
              gradientTo="#0e0e0e"
            />
            <div className="ag-marco-overlay ag-section-inner relative z-10 flex flex-col">
              <div className="ag-container mx-auto w-full">
                <ScrollReveal className="ag-panel ag-panel--wide ag-marco-intro relative overflow-hidden" distance={16}>
                  <span className="ag-panel__inset" aria-hidden />
                  <span
                    className="font-label-lg mb-6 flex items-center justify-center gap-4 text-sm uppercase text-white/50"
                    style={{ letterSpacing: '0.3em' }}
                  >
                    <span className="h-px w-4 bg-white/30" />
                    El marco de la metodología
                    <span className="h-px w-4 bg-white/30" />
                  </span>
                  <h2
                    className="font-display-xl text-white"
                    style={{ fontSize: 'clamp(2.25rem, 6vw, 4rem)' }}
                  >
                    Marco Central
                  </h2>
                  <p className="ag-marco-context font-body-md text-white/60">
                    Ocho pilares que componen el perfil Maximus documentado en la metodología.
                  </p>
                </ScrollReveal>
                <ScrollStaggerContainer className="ag-marco-grid">
                  {MARCO_CARDS.map((card) => (
                    <StaggerItem key={card.num} distance={14} className="ag-marco-grid__item">
                      <div className="ag-panel ag-panel--marco group">
                        <span className="ag-panel__corner ag-panel__corner--hover" aria-hidden />
                        <div className="ag-panel__head ag-marco-card__head">
                          <div className="ag-marco-card__icon" aria-hidden>
                            <AppIcon name={card.icon} size={24} />
                          </div>
                          <h3 className="ag-panel__card-title font-headline-sm">{card.title}</h3>
                        </div>
                        {card.quote ? (
                          <p className="ag-panel__card-quote font-body-md">{card.quote}</p>
                        ) : null}
                        <p className="ag-panel__card-body font-body-md">{card.body}</p>
                      </div>
                    </StaggerItem>
                  ))}
                </ScrollStaggerContainer>
              </div>
            </div>
          </section>
        </div>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section
          id="preguntas-frecuentes"
          className="ag-faq-section ag-section-inner"
          aria-labelledby="faq-heading"
        >
          <div className="ag-container ag-container--narrow">
            <ScrollReveal className="ag-faq-header text-center" distance={16}>
              <p className="hud-text text-action-red">MK · PREGUNTAS FRECUENTES</p>
              <h2
                id="faq-heading"
                className="ag-faq-header__title font-display-xl text-white"
                style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
              >
                Antes de dar el paso
              </h2>
              <p className="ag-faq-header__lead font-body-lg">
                Respuestas claras sobre la metodología Maximus Kratos, el proceso y cómo
                empezar.
              </p>
            </ScrollReveal>

            <ScrollStaggerContainer className="ag-faq-list" stagger={0.06}>
              {LANDING_FAQ_ITEMS.map((item, index) => (
                <StaggerItem key={item.id} distance={10}>
                  <FaqItem
                    id={item.id}
                    question={item.question}
                    answer={item.answer}
                    isOpen={openFaqIndex === index}
                    reduced={reduced ?? false}
                    onToggle={() =>
                      setOpenFaqIndex((current) => (current === index ? null : index))
                    }
                  />
                </StaggerItem>
              ))}
            </ScrollStaggerContainer>

            <ScrollReveal className="ag-faq-footer text-center" distance={10}>
              <p className="ag-faq-footer__text font-body-md">
                ¿Otra duda?{' '}
                <Link href="/contacto" className="ag-faq-cta__link">
                  Escríbenos
                </Link>
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ── Programa Fundador — unified closing ───────────────────────── */}
        <section className="ag-cta-section ag-section-inner relative flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LANDING_IMAGES.statueSovereign}
            alt="Estatua soberana"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              maxWidth: 'none',
              objectFit: 'cover',
              objectPosition: 'top',
              opacity: 0.55,
              mixBlendMode: 'lighten',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(to top, #0e0e0e, rgba(14,14,14,0.55), transparent)',
            }}
          />
          <ScrollReveal className="ag-panel ag-panel--wide relative z-10 ag-founder-close" distance={16}>
            <div className="hud-text mb-8" style={{ letterSpacing: '0.4em' }}>PROGRAMA FUNDADOR</div>
            <h2
              className="ag-cta-title font-display-xl text-white"
              style={{ fontSize: 'clamp(2.25rem, 6vw, 4rem)' }}
            >
              Tu yo del futuro
              <br />
              te está esperando.
            </h2>
            <ul className="ag-founder-benefits font-body-lg">
              {FOUNDER_BENEFITS.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
            <div className="ag-founder-close__primary">
              <AuthCta href="/register" className="ag-btn-cta ag-founder-close__cta font-label-lg">
                Crea tu cuenta de fundador
              </AuthCta>
            </div>
            <div className="ag-founder-secondary">
              <p className="ag-founder-secondary__lead font-body-md">
                ¿Aún no? Déjanos tu correo y te avisamos cuando el diagnóstico abra.
              </p>
              <EarlyAccessForm submitLabel="Recibir aviso" variant="secondary" />
            </div>
          </ScrollReveal>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
