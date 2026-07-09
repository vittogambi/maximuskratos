'use client';

import { DeviceShowcase, type DeviceShowcaseFocus } from '@/components/device-showcase';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { SectionIntro } from '@/components/pages/section-intro';
import { SubpageCta } from '@/components/pages/subpage-cta';
import {
  PLATFORM_MODULES,
  PLATFORM_STATUS_LABELS,
  type PlatformModuleStatus,
} from '@/lib/platform-status';

const EXPERIENCES: ReadonlyArray<{
  num: string;
  eyebrow: string;
  title: string;
  body: string;
  specs: ReadonlyArray<string>;
  focus: DeviceShowcaseFocus;
  reverse?: boolean;
}> = [
  {
    num: '01',
    eyebrow: 'CLARIDAD',
    title: 'Descubre quién eres.',
    body: 'Diagnóstico en Espíritu, Mente y Cuerpo. Sin autoengaño.',
    specs: ['3 dimensiones', 'Preguntas estructuradas', 'Índice de alineación'],
    focus: 'diagnostico',
  },
  {
    num: '02',
    eyebrow: 'DIRECCIÓN',
    title: 'Sigue tu Ruta MK.',
    body: 'Auditorías secuenciales. Cada una revela una capa más del sistema, en orden.',
    specs: ['Auditorías en orden', 'Progreso medible', 'Desbloqueo por etapas'],
    focus: 'ruta',
    reverse: true,
  },
  {
    num: '03',
    eyebrow: 'AUTOCONOCIMIENTO',
    title: 'Tu Perfil Maestro.',
    body: 'Arquetipo, sombra y radar de las 8 dimensiones. Sin relleno.',
    specs: ['Arquetipo dominante', 'Trabajo de sombra', 'Radar de 8 dimensiones'],
    focus: 'perfil',
  },
];

const ECOSYSTEM_NODES: ReadonlyArray<{
  icon: AppIconName;
  title: string;
  status: string;
  statusTone: 'live' | 'dev';
  body: string;
}> = [
  {
    icon: 'globe',
    title: 'Plataforma web',
    status: 'Disponible hoy',
    statusTone: 'live',
    body: 'Cuenta, diagnóstico y panel personal desde cualquier navegador.',
  },
  {
    icon: 'layout-grid',
    title: 'App iOS / Android',
    status: 'En desarrollo',
    statusTone: 'dev',
    body: 'Misiones diarias, métricas y notificaciones para la ejecución en el día a día.',
  },
];

const MODULE_STATUS_TONE: Record<PlatformModuleStatus, string> = {
  disponible: 'is-live',
  proximamente: 'is-next',
  'en-desarrollo': 'is-dev',
};

export function SistemaContent() {
  return (
    <div className="ag-landing ag-page ag-sistema-page flex min-h-full flex-col antialiased">
      <section className="ag-sistema-hero ag-sistema-hero--product relative overflow-x-hidden">
        <div
          className="ag-sistema-hero__grid-bg pointer-events-none absolute inset-0"
          aria-hidden
        />
        <div className="ag-container ag-sistema-hero__stack relative z-10">
          <ScrollReveal className="ag-sistema-hero__intro text-center" distance={16}>
            <p className="hud-text text-action-red">MK · EL SISTEMA</p>
            <h1 className="ag-sistema-hero__title font-display-xl text-white">
              El tablero de control de tu transformación.
            </h1>
            <div className="ag-sistema-hero__pills" aria-label="Estado de la plataforma">
              <span className="ag-sistema-pill ag-sistema-pill--app">Web · disponible hoy</span>
              <span className="ag-sistema-pill">App · en desarrollo</span>
              <span className="ag-sistema-pill">Una sola cuenta</span>
            </div>
          </ScrollReveal>

          <ScrollReveal className="ag-sistema-hero__preview" distance={14} delay={0.06}>
            <DeviceShowcase focus="overview" layout="hero" />
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-sistema-experiences" aria-label="Experiencias del sistema">
        <div className="ag-container ag-sistema-experiences__inner">
          {EXPERIENCES.map((exp) => (
            <ScrollReveal
              key={exp.num}
              className={`ag-sistema-exp ag-phase-row${exp.reverse ? ' ag-sistema-exp--reverse' : ''}`}
              distance={18}
            >
              <div className={`ag-sistema-exp__copy${exp.reverse ? ' lg:order-2' : ' lg:order-1'}`}>
                <p className="hud-text text-action-red">
                  {exp.num} · {exp.eyebrow}
                </p>
                <h2 className="ag-sistema-exp__title font-display-xl text-white">{exp.title}</h2>
                <p className="ag-sistema-exp__body font-body-lg">{exp.body}</p>
                <ul className="ag-sistema-exp__specs" aria-label="Características">
                  {exp.specs.map((spec) => (
                    <li key={spec} className="ag-sistema-exp__spec font-label-lg">
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`ag-sistema-exp__media${exp.reverse ? ' lg:order-1' : ' lg:order-2'}`}>
                <DeviceShowcase focus={exp.focus} layout="experience" />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

   

      <section className="ag-section-inner ag-sistema-ecosystem" aria-labelledby="eco-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="MK · ECOSISTEMA"
            title="Una cuenta. Un sistema."
            lead="Tu progreso vive en un solo lugar y te sigue en cada dispositivo."
            headingId="eco-heading"
          />

          <ScrollStaggerContainer className="ag-sistema-eco__grid" stagger={0.08}>
            {ECOSYSTEM_NODES.map((node) => (
              <StaggerItem key={node.title} distance={14} className="ag-sistema-eco__item">
                <div className="ag-panel ag-panel--marco ag-sistema-eco__card h-full">
                  <span className="ag-panel__corner ag-panel__corner--hover" aria-hidden />
                  <div className="ag-sistema-eco__head">
                    <div className="ag-marco-card__icon" aria-hidden>
                      <AppIcon name={node.icon} size={22} />
                    </div>
                    <span
                      className={`ag-sistema-eco__status ${node.statusTone === 'live' ? 'is-live' : 'is-dev'}`}
                    >
                      {node.status}
                    </span>
                  </div>
                  <p className="ag-panel__card-title font-headline-sm">{node.title}</p>
                  <p className="ag-panel__card-body font-body-md">{node.body}</p>
                </div>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>

          <ScrollReveal className="ag-sistema-eco__sync" distance={10} delay={0.08}>
            <AppIcon name="activity" size={16} aria-hidden />
            <span className="font-body-md">
              Sincronizado: el mismo perfil, la misma ruta y el mismo índice en web y app.
            </span>
          </ScrollReveal>
        </div>
      </section>

      <SubpageCta />
    </div>
  );
}
