'use client';

import Link from 'next/link';
import { DeviceShowcase } from '@/components/device-showcase';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { AuthCta, GuestAuthLinks } from '@/components/auth-cta';
import { LANDING_IMAGES } from '@/lib/assets';
import { publicNavAuth } from '@/lib/design';

const PLATFORM_SIGNALS: ReadonlyArray<{
  icon: AppIconName;
  label: string;
  desc: string;
}> = [
  {
    icon: 'globe',
    label: 'Web app',
    desc: 'Panel completo en navegador: diagnóstico, blueprint y seguimiento en escritorio.',
  },
  {
    icon: 'layout-grid',
    label: 'App móvil',
    desc: 'iOS y Android para misiones diarias, hábitos y revisiones donde estés.',
  },
  {
    icon: 'activity',
    label: 'Misma cuenta',
    desc: 'Un solo perfil sincronizado. Empieza en web, continúa en el móvil — o al revés.',
  },
];

const APP_STEPS = [
  {
    num: '01',
    title: 'Crea tu cuenta',
    body: 'Un registro para web y móvil. Accede desde el navegador o descarga la app.',
  },
  {
    num: '02',
    title: 'Completa el diagnóstico',
    body: 'El motor analiza 8 dimensiones y genera tu Índice de Alineación en la plataforma.',
  },
  {
    num: '03',
    title: 'Ejecuta donde estés',
    body: 'Blueprint, misiones y puntos de control disponibles en web y app móvil.',
  },
] as const;

const MODULES: ReadonlyArray<{
  num: string;
  icon: AppIconName;
  tag: string;
  title: string;
  body: string;
}> = [
  {
    num: '01',
    icon: 'scan-line',
    tag: 'Core',
    title: 'Diagnóstico de Vida Completo',
    body: 'Evaluación estructurada de 8 dimensiones con más de 120 puntos de dato. Resultado: tu Índice de Alineación y mapa de fortalezas.',
  },
  {
    num: '02',
    icon: 'map',
    tag: 'Core',
    title: 'Blueprint de Vida',
    body: 'El artefacto central de la app. Propósito, arquetipo, brechas y plan a 30, 90 y 365 días generado por el motor de reglas.',
  },
  {
    num: '03',
    icon: 'calendar-check',
    tag: 'App',
    title: 'Ejecución Diaria',
    body: 'Misiones personalizadas, hábitos, rachas y reflexiones guiadas dentro de tu espacio de trabajo.',
  },
  {
    num: '04',
    icon: 'user-check',
    tag: 'Análisis',
    title: 'Perfil de Arquetipo',
    body: 'Identificación de tu arquetipo dominante con recomendaciones adaptadas a tu perfil.',
  },
  {
    num: '05',
    icon: 'moon',
    tag: 'Avanzado',
    title: 'Análisis de Sombra',
    body: 'Patrones de sabotaje y creencias limitantes con plan de integración estructurado.',
  },
  {
    num: '06',
    icon: 'activity',
    tag: 'Control',
    title: 'Puntos de Control',
    body: 'Revisiones periódicas, alertas de estancamiento y ajuste dinámico del plan.',
  },
];

const COMPARISON = [
  {
    icon: 'circle-x' as const,
    label: 'Coaching tradicional',
    points: [
      'Motivación temporal',
      'Genérico y repetible',
      'Sin medición objetiva',
      'Dependencia del coach',
    ],
    highlight: false,
  },
  {
    icon: 'circle-check' as const,
    label: 'App Maximus Kratos',
    points: [
      'Diagnóstico estructurado en la plataforma',
      'Personalizado por motor de reglas',
      'Progreso medible con índices',
      'Web y móvil con la misma cuenta',
    ],
    highlight: true,
  },
] as const;

export function SistemaContent() {
  return (
    <div className="ag-landing ag-page flex min-h-full flex-col antialiased">
      <section className="ag-sistema-hero relative overflow-x-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LANDING_IMAGES.statueClean}
          alt=""
          className="ag-about-hero__bg"
          style={{ objectPosition: 'center 30%' }}
          aria-hidden
        />
        <div className="ag-about-hero__scrim" aria-hidden />
        <div className="ag-container ag-sistema-hero__grid relative z-10">
          <div className="ag-sistema-hero__copy">
            <div className="ag-sistema-hero__stack">
              <ScrollReveal distance={16}>
                <div className="ag-sistema-hero__badges">
                  <span className="ag-sistema-pill ag-sistema-pill--app">Web + Móvil</span>
                  <span className="ag-sistema-pill">Una sola cuenta</span>
                </div>
                <p className="hud-text text-action-red">MK · EL SISTEMA</p>
                <h1 className="ag-sistema-hero__title font-display-xl text-white">
                  Tu sistema operativo de vida, en web y móvil.
                </h1>
                <p className="ag-sistema-hero__lead ag-sistema-hero__lead--full font-body-lg">
                  Maximus Kratos es una plataforma digital — web app y app móvil — que analiza quién
                  eres, diseña tu blueprint y te guía con misiones diarias. Misma cuenta, mismos datos,
                  en el dispositivo que uses. No es un curso ni coaching: es software para alinear tu vida.
                </p>
                <p className="ag-sistema-hero__lead ag-sistema-hero__lead--short font-body-lg">
                  Plataforma web y app móvil con una sola cuenta. Diagnóstico, blueprint y misiones
                  diarias — software para alinear tu vida, no coaching.
                </p>
              </ScrollReveal>

              <ScrollReveal className="ag-sistema-hero__actions" distance={12} delay={0.08}>
                <GuestAuthLinks
                  registerClassName="ag-btn-cta font-label-lg"
                  loginClassName="ag-sistema-hero__login font-label-lg"
                  registerLabel="Crear cuenta gratis"
                  loginLabel="Iniciar sesión"
                />
              </ScrollReveal>
            </div>
          </div>

          <ScrollReveal className="ag-sistema-hero__preview" distance={14} delay={0.1}>
            <DeviceShowcase />
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-sistema-platform">
        <div className="ag-container">
          <ScrollStaggerContainer className="ag-sistema-platform__grid" stagger={0.07}>
            {PLATFORM_SIGNALS.map((item) => (
              <StaggerItem key={item.label} distance={10}>
                <div className="ag-panel ag-panel--marco ag-sistema-platform__card group h-full">
                  <span className="ag-panel__corner ag-panel__corner--hover" aria-hidden />
                  <div className="ag-marco-card__icon" aria-hidden>
                    <AppIcon name={item.icon} size={22} />
                  </div>
                  <p className="ag-panel__card-title font-headline-sm">{item.label}</p>
                  <p className="ag-panel__card-body font-body-md">{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>

      <section className="ag-section-inner ag-sistema-steps">
        <div className="ag-container">
          <ScrollReveal className="ag-about-section-head text-center" distance={14}>
            <p className="hud-text text-action-red">MK · CÓMO FUNCIONA LA APP</p>
            <h2
              className="font-display-xl text-white"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
            >
              De registro a ejecución en tres pasos
            </h2>
          </ScrollReveal>

          <ScrollStaggerContainer className="ag-sistema-steps__grid" stagger={0.08}>
            {APP_STEPS.map((step) => (
              <StaggerItem key={step.num} distance={12}>
                <div className="ag-panel ag-panel--marco ag-sistema-step group h-full">
                  <span className="ag-panel__corner ag-panel__corner--hover" aria-hidden />
                  <span className="ag-marco-card__num font-label-lg font-mono text-sm text-white/30">
                    {step.num}
                  </span>
                  <h3 className="ag-panel__card-title font-headline-sm">{step.title}</h3>
                  <p className="ag-panel__card-body font-body-md">{step.body}</p>
                </div>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>

      <section className="ag-section-inner ag-about-method">
        <div className="ag-container">
          <ScrollReveal className="ag-about-section-head text-center" distance={14}>
            <p className="hud-text text-action-red">MK · MÓDULOS DE LA APP</p>
            <h2
              className="font-display-xl text-white"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}
            >
              Todo lo que incluye la plataforma
            </h2>
            <p className="ag-about-section-head__lead font-body-lg">
              Cada módulo está disponible en web y móvil. Diseñados para trabajar juntos como un
              sistema operativo de vida.
            </p>
          </ScrollReveal>

          <ScrollStaggerContainer className="ag-prestaciones-grid" stagger={0.06}>
            {MODULES.map((module) => (
              <StaggerItem key={module.num} distance={12} className="ag-prestaciones-grid__item">
                <div className="ag-panel ag-panel--marco group h-full">
                  <span className="ag-panel__corner ag-panel__corner--hover" aria-hidden />
                  <div className="ag-prestaciones-card__meta">
                    <span className="ag-marco-card__num font-label-lg font-mono text-sm text-white/30">
                      {module.num}
                    </span>
                    <span className="hud-text ag-prestaciones-card__tag">{module.tag}</span>
                  </div>
                  <div className="ag-panel__head ag-marco-card__head">
                    <div className="ag-marco-card__icon" aria-hidden>
                      <AppIcon name={module.icon} size={24} />
                    </div>
                    <h3 className="ag-panel__card-title font-headline-sm">{module.title}</h3>
                  </div>
                  <p className="ag-panel__card-body font-body-md">{module.body}</p>
                </div>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>

          <ScrollReveal className="ag-prestaciones-cta text-center" distance={14}>
            <AuthCta href={publicNavAuth.register.href} className="ag-btn-cta font-label-lg">
              Crear cuenta — Web y móvil
            </AuthCta>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-prestaciones-quote relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LANDING_IMAGES.statueBroken}
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
              &ldquo;Conoce tus fuerzas, domina tu debilidad. El sistema hace la diferencia.&rdquo;
            </blockquote>
            <footer className="hud-text mt-6 text-action-red">Maximus Kratos</footer>
          </div>
        </ScrollReveal>
      </section>

      <section className="ag-section-inner ag-about-method">
        <div className="ag-container">
          <ScrollReveal className="ag-about-section-head text-center" distance={14}>
            <p className="hud-text text-action-red">MK · DIFERENCIAL</p>
            <h2
              className="font-display-xl text-white"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}
            >
              Software de precisión, no motivación
            </h2>
          </ScrollReveal>

          <ScrollStaggerContainer className="ag-prestaciones-compare" stagger={0.1}>
            {COMPARISON.map((col) => (
              <StaggerItem key={col.label} distance={12}>
                <div
                  className={`ag-panel ag-prestaciones-compare__card h-full${
                    col.highlight ? ' ag-prestaciones-compare__card--highlight' : ''
                  }`}
                >
                  {col.highlight ? (
                    <span className="ag-panel__corner ag-panel__corner--hover" aria-hidden />
                  ) : null}
                  <div className="ag-prestaciones-compare__head">
                    <AppIcon
                      name={col.icon}
                      size={22}
                      className={col.highlight ? 'text-action-red' : 'text-white/40'}
                    />
                    <h3 className="ag-panel__card-title font-headline-sm">{col.label}</h3>
                  </div>
                  <ul className="ag-prestaciones-compare__list">
                    {col.points.map((pt) => (
                      <li key={pt}>
                        <span
                          className={`ag-prestaciones-compare__dot${
                            col.highlight ? ' ag-prestaciones-compare__dot--yes' : ''
                          }`}
                          aria-hidden
                        />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>
    </div>
  );
}
