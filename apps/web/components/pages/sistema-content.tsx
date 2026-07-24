'use client';

import Link from 'next/link';
import { DeviceShowcase, type DeviceShowcaseFocus } from '@/components/device-showcase';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { SectionIntro } from '@/components/pages/section-intro';
import { SubpageCta } from '@/components/pages/subpage-cta';
import { MkDomainsBridge } from '@/components/pages/mk-domains-bridge';
import { LANDING_DOMAINS_SECTION } from '@/lib/landing-copy';

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
    eyebrow: 'AUTOCONOCIMIENTO',
    title: 'Tu Perfil Maestro.',
    body: 'Una lectura integral de tu sistema: índices de Alineación y Profundidad, resultado por pilar y por ámbito. El arquetipo queda como referencia interpretativa.',
    specs: ['Índices de Alineación y Profundidad', 'Pilares y ámbitos', 'Arquetipo de referencia'],
    focus: 'perfil',
    reverse: true,
  },
  {
    num: '03',
    eyebrow: 'DIRECCIÓN',
    title: 'Sigue tu Ruta MK.',
    body: 'Auditorías secuenciales. Cada una revela una capa más del sistema, en orden.',
    specs: ['Auditorías en orden', 'Progreso medible', 'Desbloqueo por etapas'],
    focus: 'ruta',
  },
  {
    num: '04',
    eyebrow: 'PANEL Y CONTINUIDAD',
    title: 'Tu proceso no se reinicia.',
    body: 'Panel personal con tus índices y evolución, el progreso por etapas y el historial completo. MK conserva el contexto y las prioridades vigentes del proceso.',
    specs: ['Índices y evolución', 'Progreso por etapas', 'Historial del proceso'],
    focus: 'overview',
    reverse: true,
  },
];

/** Product status stream (Linear / Now→Next style): short names + status, no dual brochure columns. */
const STATUS_STREAM: ReadonlyArray<{
  id: string;
  label: string;
  tone: 'live' | 'next';
  items: ReadonlyArray<{ title: string; status: string }>;
}> = [
  {
    id: 'hoy',
    label: 'HOY',
    tone: 'live',
    items: [
      { title: 'Cuenta de fundador', status: 'Abierto' },
      { title: 'Panel de acceso anticipado', status: 'Abierto' },
      { title: 'Exploración del método', status: 'Abierto' },
    ],
  },
  {
    id: 'lanzamiento',
    label: 'LANZAMIENTO',
    tone: 'next',
    items: [
      { title: 'Diagnóstico y auditorías', status: 'Próximo' },
      { title: 'Perfil Maestro y Ruta MK', status: 'Próximo' },
      { title: 'App iOS y Android', status: 'Próximo' },
      { title: 'Misiones, métricas y notificaciones', status: 'Próximo' },
    ],
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
    title: 'Sitio y cuenta',
    status: 'Disponible hoy',
    statusTone: 'live',
    body: 'Explora el método y crea tu cuenta de fundador desde cualquier navegador.',
  },
  {
    icon: 'layout-grid',
    title: 'Webapp y app móvil',
    status: 'Próximamente',
    statusTone: 'dev',
    body: 'Diagnóstico, panel completo y app iOS/Android se lanzan juntos bajo una sola cuenta.',
  },
];

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
            <p className="ag-sistema-hero__lead font-body-lg">
              No es un curso ni una biblioteca de contenido. Es la plataforma donde vivirá tu
              proceso. Hoy puedes reservar tu lugar como fundador.
            </p>
            <div className="ag-sistema-hero__pills" aria-label="Estado de la plataforma">
              <span className="ag-sistema-pill ag-sistema-pill--app">Acceso anticipado abierto</span>
              <span className="ag-sistema-pill">Diagnóstico próximamente</span>
              <span className="ag-sistema-pill">Web y app en preparación</span>
            </div>
          </ScrollReveal>

          <ScrollReveal className="ag-sistema-hero__preview" distance={14} delay={0.06}>
            <DeviceShowcase focus="overview" layout="hero" />
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-sistema-experiences" aria-labelledby="experiencias-heading">
        <div className="ag-container ag-sistema-experiences__inner">
          <SectionIntro
            eyebrow="MK · EL RECORRIDO"
            title="Qué construye el sistema."
            lead="Así se verá el recorrido cuando abra la plataforma. Vista previa del producto en construcción."
            headingId="experiencias-heading"
          />

          {EXPERIENCES.map((exp) => (
            <ScrollReveal
              key={exp.num}
              className={`ag-sistema-exp${exp.reverse ? ' ag-sistema-exp--reverse' : ''}`}
              distance={18}
            >
              <div className="ag-sistema-exp__copy">
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
              <div className="ag-sistema-exp__media">
                <DeviceShowcase focus={exp.focus} layout="experience" />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="ag-section-inner ag-sistema-status" aria-labelledby="status-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="MK · ESTADO DEL SISTEMA"
            title="Qué está abierto. Qué viene después."
            lead="Hoy reservas tu lugar. El diagnóstico y las apps se activan en el lanzamiento."
            headingId="status-heading"
          />

          <div className="ag-sistema-status__stream">
            {STATUS_STREAM.map((group) => (
              <div key={group.id} className="ag-sistema-status__group">
                <p
                  className={`hud-text ag-sistema-status__group-label${
                    group.tone === 'live' ? ' text-action-red' : ''
                  }`}
                >
                  {group.label}
                </p>
                <ul className="ag-sistema-status__list">
                  {group.items.map((item) => (
                    <li key={item.title} className="ag-sistema-status__row">
                      <span className="ag-sistema-status__name font-headline-sm">{item.title}</span>
                      <span
                        className={`ag-sistema-status__mark font-label-lg${
                          group.tone === 'live' ? ' is-live' : ' is-next'
                        }`}
                      >
                        {item.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ag-section-inner ag-sistema-ecosystem" aria-labelledby="eco-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="MK · ECOSISTEMA"
            title="Una cuenta. Un sistema."
            lead="Tu acceso de fundador es el mismo hilo que seguirá en la webapp y en la app móvil."
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
              La misma cuenta seguirá en web y app cuando lancemos ambas.
            </span>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-sistema-model-brief" aria-labelledby="modelo-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="MK · EL MODELO"
            title="Tres pilares. Cuatro ámbitos."
            lead="El modelo que la plataforma ejecutará cuando abra."
            headingId="modelo-heading"
          />

          <MkDomainsBridge className="ag-sistema-model-brief__bridge" />

          <p className="ag-sistema-model-brief__close font-body-md">
            {LANDING_DOMAINS_SECTION.leadClose}
          </p>

          <ScrollReveal className="ag-sistema-model-brief__link" distance={10}>
            <Link href="/marco-central" className="ag-inline-link font-label-lg">
              Ver el Marco Central
              <AppIcon name="arrow-right" size={14} />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <SubpageCta />
    </div>
  );
}
