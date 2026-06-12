'use client';

import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { AuthCta } from '@/components/auth-cta';
import { PlatformStatusBadge } from '@/components/platform-status-badge';
import { LANDING_IMAGES } from '@/lib/assets';
import { publicNavAuth } from '@/lib/design';
import {
  PLATFORM_STATUS_LABELS,
  type PlatformModuleStatus,
} from '@/lib/platform-status';

const PROBLEM_OBSERVATIONS = [
  'Hombres que saben qué deberían hacer, pero no tienen un plano.',
  'Motivación que se renueva cada lunes y muere cada mes.',
  'Desarrollo personal tratado como contenido, no como infraestructura.',
  'Progreso que nadie puede medir ni sostener.',
] as const;

const BELIEFS = [
  'La claridad precede a la disciplina.',
  'Los sistemas superan la motivación.',
  'La identidad precede al comportamiento.',
  'Lo que no se mide se distorsiona.',
  'El propósito sin ejecución es fantasía.',
] as const;

const TECH_THESIS = [
  { label: 'Coaching', body: 'Depende de una persona. Caduca.' },
  { label: 'Cursos', body: 'Informan. No estructuran.' },
  { label: 'Mentorías', body: 'Caras, no escalables, sin memoria.' },
  {
    label: 'Software',
    body: 'Diagnóstico, plano y ritmo en un solo sistema.',
    highlight: true,
  },
] as const;

const EVOLUTION: ReadonlyArray<{
  label: string;
  note: string;
  estado: PlatformModuleStatus;
}> = [
  {
    label: 'Metodología documentada',
    note: 'Espíritu · Mente · Cuerpo',
    estado: 'disponible',
  },
  {
    label: 'Plataforma web',
    note: 'Panel y cuenta · hoy',
    estado: 'disponible',
  },
  {
    label: 'Diagnóstico digital',
    note: 'Índice de alineación',
    estado: 'en-desarrollo',
  },
  {
    label: 'Sistema operativo personal',
    note: 'Plano de Vida y ejecución',
    estado: 'en-desarrollo',
  },
  {
    label: 'Aplicación móvil',
    note: 'iOS y Android',
    estado: 'en-desarrollo',
  },
];

export function QuienesSomosContent() {
  return (
    <div className="ag-landing ag-page ag-about-page flex min-h-full flex-col antialiased">
      <section className="ag-about-hero ag-about-hero--origin relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LANDING_IMAGES.statueAligned}
          alt=""
          className="ag-about-hero__bg"
          aria-hidden
        />
        <div className="ag-about-hero__scrim" aria-hidden />
        <div className="ag-about-hero__content ag-container relative z-10">
          <ScrollReveal className="ag-about-hero__intro text-center" distance={16}>
            <p className="hud-text text-action-red">MK · QUIÉNES SOMOS</p>
            <h1
              className="ag-about-hero__title font-display-xl text-white"
              style={{ fontSize: 'clamp(2.25rem, 6vw, 4rem)' }}
            >
              Construimos sistemas,
              <br />
              no discursos.
            </h1>
            <p className="ag-about-hero__origin font-body-lg">
              Vimos hombres capaces de esfuerzo, pero sin arquitectura. Mucha energía. Poco
              sistema. Maximus Kratos nació para cerrar esa brecha.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-about-block">
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal distance={14}>
            <p className="hud-text text-action-red">MK · EL PROBLEMA</p>
            <h2
              className="ag-about-block__title font-display-xl text-white"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
            >
              Lo que observamos
            </h2>
          </ScrollReveal>
          <ScrollReveal distance={12} delay={0.05}>
            <ul className="ag-about-problem">
              {PROBLEM_OBSERVATIONS.map((item) => (
                <li key={item} className="font-body-lg">
                  {item}
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-about-block ag-about-block--dark">
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal distance={14}>
            <p className="hud-text text-action-red">MK · LO QUE CREEMOS</p>
            <h2
              className="ag-about-block__title ag-about-manifesto__title font-display-xl text-white"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
            >
              Creemos que…
            </h2>
            <ul className="ag-founder-benefits ag-about-manifesto">
              {BELIEFS.map((belief) => (
                <li key={belief} className="font-body-lg">
                  {belief}
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-about-block">
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal distance={14}>
            <p className="hud-text text-action-red">MK · POR QUÉ TECNOLOGÍA</p>
            <h2
              className="ag-about-block__title font-display-xl text-white"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
            >
              No bastaba otra mentoría.
            </h2>
            <p className="ag-about-block__lead font-body-md">
              El desarrollo personal necesitaba memoria, estructura y medición. Eso es software.
            </p>
          </ScrollReveal>
          <ScrollReveal distance={12} delay={0.05}>
            <ul className="ag-about-tech">
              {TECH_THESIS.map((item) => (
                <li
                  key={item.label}
                  className={`ag-about-tech__row${'highlight' in item && item.highlight ? ' is-highlight' : ''}`}
                >
                  <span className="ag-about-tech__label font-label-lg">{item.label}</span>
                  <span className="ag-about-tech__body font-body-md">{item.body}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-about-block ag-about-block--dark">
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal distance={14}>
            <p className="hud-text text-action-red">MK · EN CONSTRUCCIÓN</p>
            <h2
              className="ag-about-block__title font-display-xl text-white"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
            >
              Un sistema que crece contigo.
            </h2>
            <p className="ag-about-block__lead font-body-md">
              Metodología primero. Plataforma después. Sin atajos de marketing.
            </p>
          </ScrollReveal>
          <ScrollReveal distance={12} delay={0.05}>
            <ol className="ag-about-evolution">
              {EVOLUTION.map((step, index) => (
                <li key={step.label} className="ag-about-evolution__step">
                  <div className="ag-about-evolution__rail" aria-hidden>
                    <span className="ag-about-evolution__node" />
                    {index < EVOLUTION.length - 1 ? (
                      <span className="ag-about-evolution__line" />
                    ) : null}
                  </div>
                  <div className="ag-about-evolution__content">
                    <div className="ag-about-evolution__head">
                      <span className="ag-about-evolution__label">{step.label}</span>
                      <PlatformStatusBadge
                        status={step.estado}
                        label={PLATFORM_STATUS_LABELS[step.estado]}
                      />
                    </div>
                    <p className="ag-about-evolution__note font-body-md">{step.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-about-block">
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal className="ag-about-founder" distance={14}>
            <p className="hud-text text-action-red">MK · QUIEN LO CONSTRUYE</p>
            <div className="ag-about-founder__grid">
              <div className="ag-about-founder__avatar" aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/mk-shield.png" alt="" className="ag-about-founder__mark" />
              </div>
              <div className="ag-about-founder__copy">
                <h2 className="ag-about-founder__name font-headline-md text-white">
                  El equipo detrás de Maximus Kratos
                </h2>
                <p className="font-body-md ag-about-founder__bio">
                  Un equipo pequeño obsesionado con precisión, legado y desarrollo masculino de
                  alto estándar. La historia del fundador se publicará aquí.
                </p>
                <p className="font-body-md ag-about-founder__vision">
                  Construimos infraestructura para hombres que exigen claridad real, no frases
                  vacías.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-sistema-cta ag-about-cta">
        <div className="ag-container">
          <ScrollReveal className="ag-sistema-cta__inner text-center" distance={14}>
            <h2
              className="font-display-xl text-white"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
            >
              Entra antes de que abra el sistema.
            </h2>
            <p className="ag-sistema-cta__lead font-body-md">
              Cuenta de fundador gratuita. Estatus permanente.
            </p>
            <AuthCta href={publicNavAuth.register.href} className="ag-btn-cta font-label-lg">
              Crear cuenta de fundador
            </AuthCta>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
