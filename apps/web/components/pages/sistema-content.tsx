'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { DeviceShowcase, type DeviceShowcaseFocus } from '@/components/device-showcase';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import {
  MOTION_DISTANCE,
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_STAGGER,
  MOTION_VIEWPORT,
} from '@/components/motion/tokens';
import { SectionIntro } from '@/components/pages/section-intro';
import { SubpageCta } from '@/components/pages/subpage-cta';
import { PublicFaqSection } from '@/components/pages/public-faq-section';
import { MkCycleHub, MkCycleOrbit } from '@/components/pages/mk-cycle-hub';
import { ACTION_STEPS } from '@/lib/marco-central';
import { SISTEMA_FAQ_ITEMS } from '@/lib/sistema-faq';

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
    title: 'Mira con honestidad dónde estás.',
    body: 'Un diagnóstico estructurado en Espíritu, Mente y Cuerpo. Detecta tensiones y desequilibrios antes de construir nada encima.',
    specs: ['Espíritu, Mente y Cuerpo', 'Preguntas estructuradas', 'Primera lectura del sistema'],
    focus: 'diagnostico',
  },
  {
    num: '02',
    eyebrow: 'SÍNTESIS',
    title: 'Tu Perfil Maestro.',
    body: 'El diagnóstico se vuelve una lectura clara: índices de Alineación y Profundidad, resultado por pilar y por ámbito. Mide coherencia, no tu valor.',
    specs: [
      'Índice de Alineación MK',
      'Espíritu, Mente y Cuerpo',
      'Lectura por ámbito',
      'Mide coherencia, no tu valor',
    ],
    focus: 'perfil',
    reverse: true,
  },
  {
    num: '03',
    eyebrow: 'DIRECCIÓN',
    title: 'Sigue tu Ruta MK.',
    body: 'Auditorías en orden. Cada etapa profundiza una capa del sistema y desbloquea la siguiente cuando corresponde.',
    specs: ['Auditorías secuenciales', 'Progreso medible', 'Desbloqueo por etapas'],
    focus: 'ruta',
  },
  {
    num: '04',
    eyebrow: 'CONTINUIDAD',
    title: 'Tu proceso no se reinicia.',
    body: 'El panel conserva diagnóstico, prioridades, acciones e historial. Ves cómo evoluciona tu sistema sin empezar de cero.',
    specs: [
      'Evolución por ámbito en el tiempo',
      'Índices que se actualizan contigo',
      'Web y app bajo la misma cuenta',
    ],
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

function SistemaCycleDiagram() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    once: true,
    amount: 0.35,
    margin: MOTION_VIEWPORT.margin,
  });
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    if (!inView || reduced) {
      if (reduced) setActiveStep(ACTION_STEPS.length);
      return;
    }
    setActiveStep(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      if (i >= ACTION_STEPS.length) {
        window.clearInterval(id);
        setActiveStep(ACTION_STEPS.length);
        return;
      }
      setActiveStep(i);
    }, 420);
    return () => window.clearInterval(id);
  }, [inView, reduced]);

  return (
    <ScrollReveal className="ag-about-cycle ag-sistema-cycle__diagram" density="default">
      <div ref={ref} className="ag-about-cycle__ring">
        <MkCycleOrbit />
        <MkCycleHub label="Ciclo de la Ruta MK" />

        <ol className="ag-about-cycle__list">
          {ACTION_STEPS.map((step, index) => {
            const lit = activeStep >= index;
            const focused = activeStep === index;
            return (
              <li
                key={step.num}
                className={`ag-about-cycle__step ag-about-cycle__step--${index + 1}${
                  lit ? ' is-lit' : ''
                }${focused ? ' is-focus' : ''}`}
              >
                <span className="ag-about-cycle__num hud-text">{step.num}</span>
                <h3 className="ag-about-cycle__title font-headline-sm">{step.title}</h3>
                <p className="ag-about-cycle__body font-body-md">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="ag-about-cycle__note font-body-md">
        El ciclo no termina al completar una auditoría. Cada etapa vuelve a leer, corregir
        y fortalecer tu arquitectura.
      </p>
    </ScrollReveal>
  );
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
          <ScrollReveal className="ag-sistema-hero__intro text-center" density="spacious">
            <p className="hud-text text-action-red">MK · PRODUCTO</p>
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

          <ScrollReveal className="ag-sistema-hero__preview" density="default" delay={0.06}>
            <DeviceShowcase focus="perfil" layout="hero" />
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-sistema-experiences" aria-labelledby="experiencias-heading">
        <div className="ag-container ag-sistema-experiences__inner">
          <SectionIntro
            eyebrow="MK · EL RECORRIDO"
            title="Así se ve el recorrido."
            lead="Vista previa del producto en construcción. Diagnóstico, perfil, ruta y panel bajo una sola cuenta."
            headingId="experiencias-heading"
          />

          {EXPERIENCES.map((exp) => (
            <ScrollReveal
              key={exp.num}
              className={`ag-sistema-exp${exp.reverse ? ' ag-sistema-exp--reverse' : ''}`}
              density="default"
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

      <section className="ag-section-inner ag-sistema-cycle" aria-labelledby="cycle-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="MK · CÓMO OPERA"
            title="El producto no se detiene después de un diagnóstico."
            lead="Define, ejecuta, registra, revisa y ajusta. El ciclo que mantiene tu Ruta MK viva mientras cambian tus prioridades."
            headingId="cycle-heading"
          />

          <SistemaCycleDiagram />
        </div>
      </section>

      <section className="ag-section-inner ag-sistema-status" aria-labelledby="status-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="MK · ESTADO DEL PRODUCTO"
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
            title="Una cuenta. Una plataforma."
            lead="Tu acceso de fundador es el mismo hilo que seguirá en la webapp y en la app móvil."
            headingId="eco-heading"
          />

          <div className="ag-sistema-eco">
            <motion.div
              className="ag-sistema-eco__continuity"
              aria-hidden
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                type: 'tween',
                duration: MOTION_DURATION.reveal,
                ease: MOTION_EASE.enter,
              }}
              style={{ transformOrigin: 'left center' }}
            />
            <ScrollStaggerContainer
              className="ag-sistema-eco__grid"
              stagger={MOTION_STAGGER.base}
              itemCount={ECOSYSTEM_NODES.length}
            >
              {ECOSYSTEM_NODES.map((node) => (
                <StaggerItem key={node.title} distance={MOTION_DISTANCE.sm} className="ag-sistema-eco__item">
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
          </div>

          <ScrollReveal className="ag-sistema-eco__sync" density="tight" delay={0.08}>
            <AppIcon name="activity" size={16} aria-hidden />
            <span className="font-body-md">
              La misma cuenta seguirá en web y app cuando lancemos ambas.
            </span>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-sistema-model-brief" aria-labelledby="modelo-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="MK · BASE METODOLÓGICA"
            title="El método detrás de la plataforma."
            lead="Diagnóstico, Perfil Maestro y Ruta MK no son piezas sueltas. Leen la misma arquitectura: tres pilares en cuatro ámbitos de tu vida. El mapa completo está en el Marco Central."
            headingId="modelo-heading"
          />

          <ScrollReveal className="ag-sistema-formula" density="tight">
            <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
            <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
            <div className="ag-sistema-formula__row">
              <div className="ag-sistema-formula__term">
                <span className="ag-sistema-formula__value">3</span>
                <span className="ag-sistema-formula__label">Pilares</span>
              </div>
              <span className="ag-sistema-formula__op" aria-hidden>
                ×
              </span>
              <div className="ag-sistema-formula__term">
                <span className="ag-sistema-formula__value">4</span>
                <span className="ag-sistema-formula__label">Ámbitos</span>
              </div>
              <span className="ag-sistema-formula__op ag-sistema-formula__op--arrow" aria-hidden>
                →
              </span>
              <div className="ag-sistema-formula__term ag-sistema-formula__term--result">
                <span className="ag-sistema-formula__value">12</span>
                <span className="ag-sistema-formula__label">Celdas</span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal className="ag-sistema-model-brief__link" density="tight" delay={0.05}>
            <Link href="/marco-central" className="ag-marco-more__link font-label-lg">
              Ver el Marco Central
              <AppIcon name="arrow-right" size={14} />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <PublicFaqSection
        idPrefix="sistema"
        title="Preguntas sobre la plataforma."
        lead="Diagnóstico, acceso de fundador, apps y cómo se relacionan las páginas de MK."
        items={SISTEMA_FAQ_ITEMS}
      />

      <SubpageCta>
        <Link href="/precios" className="ag-marco-more__link font-label-lg">
          Ver precios
          <AppIcon name="arrow-right" size={14} />
        </Link>
      </SubpageCta>
    </div>
  );
}
