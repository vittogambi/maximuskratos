'use client';

import Link from 'next/link';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import { EarlyAccessForm } from '@/components/early-access-form';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { SectionIntro } from '@/components/pages/section-intro';
import { LANDING_IMAGES } from '@/lib/assets';

const EVENT_FEATURES: ReadonlyArray<{
  icon: AppIconName;
  label: string;
  desc: string;
}> = [
  {
    icon: 'stethoscope',
    label: 'Diagnóstico intensivo presencial',
    desc: 'Evaluación profunda en vivo con metodología Maximus Kratos.',
  },
  {
    icon: 'map',
    label: 'Blueprint individual',
    desc: 'Construcción de tu plan estratégico durante la jornada.',
  },
  {
    icon: 'crosshair',
    label: 'Análisis de arquetipo',
    desc: 'Sesiones guiadas para identificar tu perfil dominante.',
  },
  {
    icon: 'users',
    label: 'Red de alto estándar',
    desc: 'Conexión con quienes comparten objetivos exigentes.',
  },
];

const EVENT_SPECS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Formato', value: 'Presencial · Jornada de 1 día' },
  { label: 'Fecha', value: 'Por confirmar · 2026' },
  { label: 'Ciudad', value: 'Por confirmar' },
  { label: 'Cupo', value: 'Limitado · prioridad por lista' },
];

const EVENT_AGENDA: ReadonlyArray<{ num: string; title: string; body: string }> = [
  {
    num: '01',
    title: 'Diagnóstico presencial',
    body: 'Evaluación en vivo de tu estado real en espíritu, mente y cuerpo. Sin autoengaño: el punto de partida se mide, no se estima.',
  },
  {
    num: '02',
    title: 'Estrategia · tu Blueprint',
    body: 'Construcción de tu plan estratégico individual durante la jornada: prioridades, bloqueos y las primeras decisiones de tu Ruta.',
  },
  {
    num: '03',
    title: 'Alineación y consejo',
    body: 'Análisis de arquetipo y cierre de compromisos frente a una red con el mismo estándar de exigencia.',
  },
];

export function EventosContent() {
  return (
    <div className="ag-landing ag-page flex min-h-full flex-col antialiased">
      <section className="ag-about-hero relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LANDING_IMAGES.eventosHero}
          alt=""
          className="ag-about-hero__bg"
          style={{ objectPosition: 'center 30%' }}
          aria-hidden
        />
        <div className="ag-about-hero__scrim" aria-hidden />
        <div className="ag-about-hero__content ag-container relative z-10">
          <ScrollReveal className="ag-about-hero__intro text-center" distance={16}>
            <p className="hud-text text-action-red">MK · EVENTOS</p>
            <h1 className="ag-about-hero__title ag-type-display text-white">Próximamente.</h1>
          </ScrollReveal>
          <ScrollReveal className="ag-about-hero__panel" distance={14} delay={0.08}>
            <div className="ag-panel ag-panel--wide">
              <p className="ag-panel__body font-body-lg">
                Estamos preparando el primer evento presencial de Maximus Kratos: una jornada
                intensiva de diagnóstico, estrategia y alineación de vida.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal className="ag-about-hero__secondary text-center" distance={12} delay={0.12}>
            <p className="ag-eventos-status font-body-md">
              <span className="ag-eventos-status__pip" aria-hidden />
              Sin eventos activos. Lista de espera abierta
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-eventos-section">
        <div className="ag-container ag-eventos-layout">
          <div className="ag-eventos-info">
            <ScrollReveal distance={14}>
              <p className="hud-text text-action-red">MK · JORNADA PRESENCIAL</p>
              <h2 className="ag-eventos-info__title ag-type-section text-white">
                Diagnóstico, estrategia y alineación en un solo día.
              </h2>
              <p className="ag-eventos-info__lead font-body-lg">
                Una experiencia presencial diseñada para hombres que buscan claridad estructural,
                no motivación temporal. Cupos limitados para el primer evento.
              </p>
            </ScrollReveal>

            <ScrollStaggerContainer className="ag-eventos-highlights" stagger={0.07}>
              {EVENT_FEATURES.map((item) => (
                <StaggerItem key={item.label} distance={10} className="ag-eventos-highlights__item">
                  <div className="ag-panel ag-panel--marco ag-eventos-highlight group h-full">
                    <span className="ag-panel__corner ag-panel__corner--hover" aria-hidden />
                    <div className="ag-eventos-highlight__head">
                      <div className="ag-marco-card__icon" aria-hidden>
                        <AppIcon name={item.icon} size={22} />
                      </div>
                      <div>
                        <p className="ag-panel__card-title font-headline-sm">{item.label}</p>
                        <p className="ag-panel__card-body font-body-md">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </ScrollStaggerContainer>
          </div>

          <ScrollReveal className="ag-eventos-card-wrap" distance={14} delay={0.1}>
            <div className="ag-panel ag-eventos-card">
              <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
              <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
              <div className="ag-eventos-card__badge hud-text">Prelanzamiento 2026</div>
              <div className="ag-eventos-card__head">
                <div className="ag-marco-card__icon" aria-hidden>
                  <AppIcon name="calendar" size={24} />
                </div>
                <div>
                  <p className="hud-text text-action-red">Primer evento</p>
                  <h3 className="ag-eventos-card__title font-headline-md text-white">
                    Jornada intensiva presencial
                  </h3>
                </div>
              </div>

              <dl className="ag-eventos-card__specs">
                {EVENT_SPECS.map((spec) => (
                  <div key={spec.label} className="ag-eventos-card__spec">
                    <dt className="hud-text">{spec.label}</dt>
                    <dd className="font-body-md">{spec.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="ag-eventos-card__waitlist">
                <p className="ag-eventos-card__waitlist-label font-label-lg">
                  Únete a la lista de espera
                </p>
                <p className="ag-eventos-card__waitlist-lead font-body-md">
                  Acceso anticipado a fecha, ciudad y reserva de cupo antes del anuncio público.
                </p>
                <EarlyAccessForm
                  variant="secondary"
                  className="ag-eventos-card__waitlist-form"
                  submitLabel="Unirme a la lista"
                  successMessage="Estás en la lista. Te avisaremos antes del anuncio público."
                  source="eventos-waitlist"
                />
              </div>

              <p className="ag-eventos-card__contact font-body-md">
                ¿Tienes preguntas sobre el evento?{' '}
                <Link href="/contacto" className="ag-eventos-card__contact-link">
                  Escríbenos
                </Link>
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-eventos-agenda" aria-labelledby="agenda-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="MK · QUÉ SE VIVIRÁ"
            title="Tres movimientos. Un solo día."
            lead="La jornada sigue la misma lógica del sistema: primero mirar con honestidad, después ordenar, y al final comprometerse con un plan concreto."
            headingId="agenda-heading"
          />
          <ol className="ag-eventos-agenda__list">
            {EVENT_AGENDA.map((block) => (
              <ScrollReveal key={block.num} className="ag-eventos-agenda__item" distance={12}>
                <span className="ag-eventos-agenda__num" aria-hidden>
                  {block.num}
                </span>
                <div className="ag-eventos-agenda__copy">
                  <h3 className="ag-eventos-agenda__title ag-type-item text-white">
                    {block.title}
                  </h3>
                  <p className="ag-eventos-agenda__body font-body-md">{block.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="ag-prestaciones-quote relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LANDING_IMAGES.eventosQuote}
          alt=""
          className="ag-prestaciones-quote__bg"
          aria-hidden
        />
        <div className="ag-prestaciones-quote__scrim" aria-hidden />
        <ScrollReveal className="ag-container relative z-10" distance={14}>
          <div className="ag-panel ag-panel--wide ag-prestaciones-quote__panel">
            <span className="ag-eventos-quote-rule" aria-hidden />
            <blockquote className="ag-prestaciones-quote__text font-display-xl text-white">
              &ldquo;Donde la voluntad se agota, la estructura sostiene. Somos una fraternidad de
              constructores.&rdquo;
            </blockquote>
            <footer className="hud-text mt-6 text-action-red">Manifiesto MK · No Caminamos Solos</footer>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
