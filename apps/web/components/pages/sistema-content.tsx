'use client';

import { DeviceShowcase, type DeviceShowcaseFocus } from '@/components/device-showcase';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { AuthCta } from '@/components/auth-cta';
import { PlatformStatusBadge } from '@/components/platform-status-badge';
import { publicNavAuth } from '@/lib/design';
import {
  PLATFORM_MODULES,
  PLATFORM_STATUS_LINE,
  PLATFORM_STATUS_LABELS,
  type PlatformModuleStatus,
} from '@/lib/platform-status';

const EXPERIENCES: ReadonlyArray<{
  num: string;
  eyebrow: string;
  title: string;
  body: string;
  focus: DeviceShowcaseFocus;
  reverse?: boolean;
}> = [
  {
    num: '01',
    eyebrow: 'CLARIDAD',
    title: 'Descubre quién eres.',
    body: 'Diagnóstico en Espíritu, Mente y Cuerpo. Sin autoengaño.',
    focus: 'diagnostico',
  },
  {
    num: '02',
    eyebrow: 'DIRECCIÓN',
    title: 'Diseña tu Plano de Vida.',
    body: 'Propósito, arquetipo y hoja de ruta. Un plano, no motivación.',
    focus: 'blueprint',
    reverse: true,
  },
  {
    num: '03',
    eyebrow: 'CONSISTENCIA',
    title: 'Ejecuta sin perder el rumbo.',
    body: 'Misiones diarias, rachas y revisiones. El plan se vive, no se archiva.',
    focus: 'ejecucion',
  },
];

const ECOSYSTEM: ReadonlyArray<{ icon: AppIconName; label: string }> = [
  { icon: 'globe', label: 'Web · disponible hoy' },
  { icon: 'layout-grid', label: 'App · en desarrollo' },
  { icon: 'activity', label: 'Sincronizado · una sola cuenta' },
];

function roadmapStatusLabel(estado: PlatformModuleStatus): string {
  return PLATFORM_STATUS_LABELS[estado];
}

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
              El Sistema Operativo para la Vida.
            </h1>
            <p className="ag-sistema-hero__status font-body-md">{PLATFORM_STATUS_LINE}</p>
          </ScrollReveal>

          <ScrollReveal className="ag-sistema-hero__preview" distance={14} delay={0.06}>
            <DeviceShowcase previewBadge focus="overview" layout="hero" />
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
              </div>
              <div className={`ag-sistema-exp__media${exp.reverse ? ' lg:order-1' : ' lg:order-2'}`}>
                <DeviceShowcase focus={exp.focus} layout="experience" />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="ag-section-inner ag-sistema-ecosystem">
        <div className="ag-container">
          <ScrollReveal className="ag-sistema-ecosystem__head text-center" distance={14}>
            <p className="hud-text text-action-red">MK · ECOSISTEMA</p>
            <h2
              className="font-display-xl text-white"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
            >
              Una cuenta. Un sistema.
            </h2>
          </ScrollReveal>

          <ScrollReveal className="ag-sistema-ecosystem__flow" distance={12} delay={0.05}>
            {ECOSYSTEM.map((node, index) => (
              <div key={node.label} className="ag-sistema-ecosystem__node-wrap">
                {index > 0 ? (
                  <span className="ag-sistema-ecosystem__connector" aria-hidden />
                ) : null}
                <div className="ag-sistema-ecosystem__node">
                  <AppIcon name={node.icon} size={20} aria-hidden />
                  <span className="font-label-lg">{node.label}</span>
                </div>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-sistema-roadmap">
        <div className="ag-container ag-sistema-roadmap__shell">
          <ScrollReveal distance={14}>
            <p className="hud-text text-action-red">MK · EN CONSTRUCCIÓN</p>
            <h2
              className="ag-sistema-roadmap__title font-display-xl text-white"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
            >
              Se activa por etapas.
            </h2>
            <p className="ag-sistema-roadmap__lead font-body-md">
              Sin fechas fijas. Con transparencia sobre qué existe hoy.
            </p>
          </ScrollReveal>

          <ScrollReveal distance={12} delay={0.06}>
            <ul className="ag-sistema-roadmap__list">
              {PLATFORM_MODULES.map((module) => (
                <li
                  key={module.id}
                  className={`ag-sistema-roadmap__item ag-sistema-roadmap__item--${module.estado}`}
                >
                  <span className="ag-sistema-roadmap__name">{module.nombre}</span>
                  <PlatformStatusBadge status={module.estado} label={roadmapStatusLabel(module.estado)} />
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-sistema-cta">
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
