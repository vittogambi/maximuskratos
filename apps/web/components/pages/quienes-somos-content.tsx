'use client';

import Link from 'next/link';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { AuthCta } from '@/components/auth-cta';
import { LANDING_IMAGES } from '@/lib/assets';

const PILLARS: ReadonlyArray<{
  num: string;
  label: string;
  icon: AppIconName;
  body: string;
}> = [
  {
    num: '01',
    label: 'Misión',
    icon: 'target',
    body: 'Equipar a los hombres con el sistema y la claridad necesarios para vivir con intención máxima.',
  },
  {
    num: '02',
    label: 'Visión',
    icon: 'eye',
    body: 'Convertirnos en el sistema operativo de referencia para el desarrollo humano masculino.',
  },
  {
    num: '03',
    label: 'Principios',
    icon: 'anchor',
    body: 'Precisión sobre inspiración. Sistemas sobre motivación. Resultados sobre promesas.',
  },
];

const METHOD_PHASES = [
  {
    num: '01',
    hud: 'FASE 01 · DIAGNÓSTICO',
    title: 'Diagnóstico de 8 dimensiones',
    body: 'Diagnóstico estructurado de 8 dimensiones. El motor de puntuación genera tu Índice de Alineación y un mapa de fortalezas y brechas.',
    image: LANDING_IMAGES.phase01,
    badge: 'ÍNDICE DE ALINEACIÓN',
    badgeSide: 'left' as const,
    imageFirst: true,
    steps: [
      { label: 'Evaluamos', text: 'Ocho dimensiones con precisión clínica.' },
      { label: 'Detectamos', text: 'Fortalezas, brechas y patrones de sabotaje.' },
      { label: 'Entregamos', text: 'Tu radiografía y mapa de alineación.' },
    ],
  },
  {
    num: '02',
    hud: 'FASE 02 · BLUEPRINT',
    title: 'Plano maestro personalizado',
    body: 'El sistema procesa tu perfil, aplica el motor de reglas y genera tu plan maestro: arquetipo, propósito, horizontes 30/90/365.',
    image: LANDING_IMAGES.phase02,
    badge: 'PLANO DE VIDA',
    badgeSide: 'right' as const,
    imageFirst: false,
    steps: [
      { label: 'Procesamos', text: 'Perfil, reglas y arquetipo identitario.' },
      { label: 'Diseñamos', text: 'Propósito y horizontes 30, 90 y 365 días.' },
      { label: 'Entregamos', text: 'Blueprint ejecutable y medible.' },
    ],
  },
  {
    num: '03',
    hud: 'FASE 03 · EJECUCIÓN',
    title: 'Ritmo de ejecución diaria',
    body: 'Misiones estructuradas, seguimiento de hábitos y puntos de control periódicos para mantener el progreso medible.',
    image: LANDING_IMAGES.phase03,
    badge: 'RITMO DIARIO',
    badgeSide: 'left' as const,
    imageFirst: true,
    steps: [
      { label: 'Activamos', text: 'Misiones diarias y hábitos alineados al plan.' },
      { label: 'Acompañamos', text: 'Seguimiento semanal y alertas de desvío.' },
      { label: 'Medimos', text: 'Hitos a 40 días, 3, 6 y 12 meses.' },
    ],
  },
] as const;

export function QuienesSomosContent() {
  return (
    <div className="ag-landing ag-page flex min-h-full flex-col antialiased">
      {/* Hero */}
      <section className="ag-about-hero relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LANDING_IMAGES.statueAligned}
          alt=""
          className="ag-about-hero__bg"
          aria-hidden
        />
        <div className="ag-about-hero__scrim" aria-hidden />
        <div className="ag-about-hero__content ag-container relative z-10">
          <ScrollReveal distance={16}>
            <p className="hud-text text-action-red">MK · QUIÉNES SOMOS</p>
            <h1
              className="ag-about-hero__title font-display-xl text-white"
              style={{ fontSize: 'clamp(2.25rem, 6vw, 4rem)' }}
            >
              Construimos sistemas,
              <br />
              no discursos.
            </h1>
          </ScrollReveal>
          <ScrollReveal className="ag-about-hero__panel" distance={14} delay={0.08}>
            <div className="ag-panel ag-panel--wide">
              <p className="ag-panel__body font-body-lg">
                Maximus Kratos es una plataforma de tecnología orientada al desarrollo humano de
                alta precisión. Combinamos marcos de diagnóstico propietarios con motores de
                puntuación y análisis estructurado para entregar a cada hombre un sistema de vida
                personalizado y ejecutable.
              </p>
              <p className="ag-about-hero__secondary font-body-md">
                No somos un programa de coaching. No vendemos motivación. Somos ingeniería aplicada
                a la transformación personal: diagnóstico profundo, plan estratégico, ejecución diaria.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pillars */}
      <section className="ag-section-inner">
        <div className="ag-container">
          <ScrollReveal className="ag-about-section-head text-center" distance={14}>
            <span
              className="font-label-lg mb-6 flex items-center justify-center gap-4 text-sm uppercase text-white/50"
              style={{ letterSpacing: '0.3em' }}
            >
              <span className="h-px w-4 bg-white/30" />
              Fundamentos
              <span className="h-px w-4 bg-white/30" />
            </span>
            <h2
              className="font-display-xl text-white"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}
            >
              Lo que nos define
            </h2>
          </ScrollReveal>

          <ScrollStaggerContainer className="ag-about-pillars" stagger={0.08}>
            {PILLARS.map((pillar) => (
              <StaggerItem key={pillar.label} distance={12} className="ag-about-pillars__item">
                <div className="ag-panel ag-panel--marco group h-full">
                  <span className="ag-panel__corner ag-panel__corner--hover" aria-hidden />
                  <div className="ag-panel__head ag-marco-card__head">
                    <div className="ag-marco-card__icon" aria-hidden>
                      <AppIcon name={pillar.icon} size={24} />
                    </div>
                    <h3 className="ag-panel__card-title font-headline-sm">{pillar.label}</h3>
                    <span className="ag-marco-card__num font-label-lg font-mono text-sm text-white/30">
                      {pillar.num}
                    </span>
                  </div>
                  <p className="ag-panel__card-body font-body-md">{pillar.body}</p>
                </div>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>

      {/* Method */}
      <section className="ag-section-inner ag-about-method">
        <div className="ag-container">
          <ScrollReveal className="ag-about-section-head text-center" distance={14}>
            <p className="hud-text text-action-red">MK · EL MÉTODO</p>
            <h2
              className="font-display-xl text-white"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}
            >
              Tres fases, un sistema coherente
            </h2>
            <p className="ag-about-section-head__lead font-body-lg">
              Diagnóstico, arquitectura y ejecución en un solo flujo diseñado para resultados medibles.
            </p>
          </ScrollReveal>

          <div className="ag-os-phases">
            {METHOD_PHASES.map((phase) => (
              <ScrollReveal key={phase.num} className="ag-phase-row" distance={18}>
                <div
                  className={`ag-phase-media relative${phase.imageFirst ? ' order-2 lg:order-1' : ''}`}
                >
                  <div className="absolute -inset-4 border border-white/10" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={phase.image}
                    alt={phase.title}
                    className="h-auto w-full border border-white/5 object-cover opacity-80 grayscale mix-blend-lighten"
                  />
                  <div
                    className={`hud-text absolute top-4 border border-white/20 bg-black/80 px-2 py-1${
                      phase.badgeSide === 'right' ? ' right-4' : ' left-4'
                    }`}
                  >
                    {phase.badge}
                  </div>
                </div>
                <div className={`ag-panel ag-panel--phase${phase.imageFirst ? ' order-1 lg:order-2' : ''}`}>
                  <div className="hud-text mb-4 text-action-red">{phase.hud}</div>
                  <h3 className="ag-panel__title font-headline-md">{phase.title}</h3>
                  <p className="ag-panel__body font-body-md">{phase.body}</p>
                  <div className="ag-phase-steps">
                    {phase.steps.map((step) => (
                      <div key={step.label} className="ag-phase-step">
                        <span className="hud-text ag-phase-step__label">{step.label}</span>
                        <p className="ag-phase-step__text">{step.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ag-cta-section ag-section-inner relative flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LANDING_IMAGES.statueSovereign}
          alt=""
          className="ag-about-cta__bg"
          aria-hidden
        />
        <div className="ag-about-cta__scrim" aria-hidden />
        <ScrollReveal className="ag-panel ag-panel--wide relative z-10" distance={16}>
          <div className="hud-text mb-8" style={{ letterSpacing: '0.4em' }}>
            ACCESO
          </div>
          <h2
            className="ag-cta-title font-display-xl text-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}
          >
            Comienza tu diagnóstico
          </h2>
          <p className="ag-cta-lead ag-panel__body font-body-lg">
            El primer paso es el diagnóstico completo. Sin compromiso, sin precio de entrada.
          </p>
          <AuthCta href="/register" className="ag-btn-cta font-label-lg">
            Comenzar Diagnóstico
          </AuthCta>
        </ScrollReveal>
      </section>
    </div>
  );
}
