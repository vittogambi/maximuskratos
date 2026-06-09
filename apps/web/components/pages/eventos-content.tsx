'use client';

import Link from 'next/link';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { AuthCta } from '@/components/auth-cta';
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
    desc: 'Conexión con hombres que comparten objetivos exigentes.',
  },
];

export function EventosContent() {
  return (
    <div className="ag-landing ag-page flex min-h-full flex-col antialiased">
      <section className="ag-about-hero relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LANDING_IMAGES.phase02}
          alt=""
          className="ag-about-hero__bg"
          style={{ objectPosition: 'center 40%' }}
          aria-hidden
        />
        <div className="ag-about-hero__scrim" aria-hidden />
        <div className="ag-about-hero__content ag-container relative z-10">
          <ScrollReveal distance={16}>
            <p className="hud-text text-action-red">MK · EVENTOS</p>
            <h1
              className="ag-about-hero__title font-display-xl text-white"
              style={{ fontSize: 'clamp(2.25rem, 6vw, 4rem)' }}
            >
              Próximamente.
            </h1>
          </ScrollReveal>
          <ScrollReveal className="ag-about-hero__panel" distance={14} delay={0.08}>
            <div className="ag-panel ag-panel--wide">
              <p className="ag-panel__body font-body-lg">
                Estamos preparando el primer evento presencial de Maximus Kratos: una jornada
                intensiva de diagnóstico, estrategia y alineación de vida.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal className="ag-about-hero__secondary" distance={12} delay={0.12}>
            <p className="font-body-md">
              Regístrate para recibir acceso anticipado e información de prelanzamiento.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-eventos-section">
        <div className="ag-container ag-eventos-layout">
          <div className="ag-eventos-info">
            <ScrollReveal distance={14}>
              <p className="hud-text text-action-red">MK · JORNADA PRESENCIAL</p>
              <h2
                className="ag-eventos-info__title font-display-xl text-white"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
              >
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
              <span className="ag-panel__corner ag-panel__corner--hover" aria-hidden />
              <div className="ag-eventos-card__badge hud-text">Prelanzamiento · 2026</div>
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

              <ul className="ag-eventos-card__list">
                {EVENT_FEATURES.map((item) => (
                  <li key={item.label}>
                    <span className="ag-prestaciones-compare__dot ag-prestaciones-compare__dot--yes" aria-hidden />
                    {item.label}
                  </li>
                ))}
              </ul>

              <div className="ag-eventos-card__actions">
                <Link href="/contacto" className="ag-btn-primary font-label-lg">
                  Solicitar Información
                </Link>
                <AuthCta href="/register" className="ag-eventos-card__secondary font-label-lg">
                  Acceso anticipado
                </AuthCta>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-prestaciones-quote relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LANDING_IMAGES.statueAligned}
          alt=""
          className="ag-prestaciones-quote__bg"
          aria-hidden
        />
        <div className="ag-prestaciones-quote__scrim" aria-hidden />
        <ScrollReveal className="ag-container relative z-10" distance={14}>
          <div className="ag-panel ag-panel--wide ag-prestaciones-quote__panel">
            <span
              className="font-label-lg mb-6 flex items-center justify-center gap-4 text-sm uppercase text-white/50"
              style={{ letterSpacing: '0.3em' }}
            >
              <span className="h-px w-8 bg-white/30" />
              <span className="h-px w-8 bg-white/30" />
            </span>
            <blockquote className="ag-prestaciones-quote__text font-display-xl text-white">
              &ldquo;El hombre que actúa en comunidad de propósito multiplica su impacto.&rdquo;
            </blockquote>
            <footer className="hud-text mt-6 text-action-red">Principio Maximus Kratos</footer>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
