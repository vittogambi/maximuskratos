'use client';

import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { SubpageCta } from '@/components/pages/subpage-cta';
import { LANDING_IMAGES } from '@/lib/assets';

const GREEK_CONCEPTS = [
  {
    term: 'Areté',
    greek: 'ἀρετή',
    meaning: 'La virtud como excelencia',
    body: 'Ser excelente en aquello para lo que existes. No perfección: función cumplida al máximo nivel.',
  },
  {
    term: 'Kalos Kagathos',
    greek: 'καλὸς κἀγαθός',
    meaning: 'Lo bello y lo bueno',
    body: 'El ideal del hombre completo: fuerte por fuera, recto por dentro. Cuerpo y carácter como una sola obra.',
  },
] as const;

const PROBLEM_OBSERVATIONS = [
  'Hombres que saben qué deberían hacer, pero no tienen un plano.',
  'Motivación que se renueva cada lunes y muere cada mes.',
  'Desarrollo personal tratado como contenido, no como infraestructura.',
  'Progreso que nadie puede medir ni sostener.',
] as const;

const BELIEFS = [
  'El orden precede al poder.',
  'No se construye sobre el caos. Primero se ordena.',
  'Antes que la estrategia, viene la identidad.',
  'El cuerpo es el testigo que no miente.',
  'El propósito no se descubre, se construye.',
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

function AboutEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="ag-about-eyebrow">
      <span className="ag-about-eyebrow__rule" aria-hidden />
      <p className="hud-text text-action-red">{children}</p>
    </div>
  );
}

export function QuienesSomosContent() {
  return (
    <div className="ag-landing ag-page ag-about-page flex min-h-full flex-col antialiased">
      <section className="ag-about-hero ag-about-hero--origin relative overflow-hidden">
        <div className="ag-about-hero__bg-wrap" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LANDING_IMAGES.bgAboutSystems}
            alt=""
            className="ag-about-hero__bg ag-about-hero__bg--systems"
          />
        </div>
        <div className="ag-about-hero__scrim" aria-hidden />
        <div className="ag-about-hero__content ag-container relative z-10">
          <ScrollReveal className="ag-about-hero__intro text-center" distance={16}>
            <p className="hud-text text-action-red">MK · QUIÉNES SOMOS</p>
            <h1 className="ag-about-hero__title ag-type-display text-white">
              Construimos sistemas,
              <br />
              no discursos.
            </h1>
            <p className="ag-about-hero__origin font-body-lg">
              Vimos hombres capaces de esfuerzo, pero sin arquitectura. Mucha energía. Poco
              sistema. Maximus Kratos nació para darles el plano que les faltaba.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-about-block">
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal distance={14}>
            <AboutEyebrow>MK · EL FUNDAMENTO</AboutEyebrow>
            <h2 className="ag-about-block__title ag-type-section text-white">
              No inventamos la idea. La rescatamos.
            </h2>
            <p className="ag-about-block__lead font-body-md">
              Maximus Kratos recupera dos conceptos griegos que se alcanzan mediante la
              arquitectura del sentido: ordenar espíritu, mente y cuerpo hasta que toda la vida
              sostenga un mismo propósito.
            </p>
          </ScrollReveal>
          <ScrollReveal distance={12} delay={0.05}>
            <div className="ag-about-concepts">
              {GREEK_CONCEPTS.map((concept) => (
                <article key={concept.term} className="ag-about-concept">
                  <span className="ag-about-concept__corner ag-about-concept__corner--tl" aria-hidden />
                  <span className="ag-about-concept__corner ag-about-concept__corner--br" aria-hidden />
                  <div className="ag-about-concept__header">
                    <p className="ag-about-concept__greek" lang="grc">
                      {concept.greek}
                    </p>
                  </div>
                  <div className="ag-about-concept__meta">
                    <h3 className="ag-about-concept__term ag-type-item text-white">{concept.term}</h3>
                    <p className="ag-about-concept__meaning">{concept.meaning}</p>
                  </div>
                  <p className="ag-about-concept__body font-body-md">{concept.body}</p>
                  <span className="ag-about-concept__bar" aria-hidden />
                </article>
              ))}
            </div>
          </ScrollReveal>
          <ScrollReveal distance={10} delay={0.08}>
            <p className="ag-about-block__lead ag-about-concepts__close font-body-md">
              Ahí el hombre se convierte en arquitecto de sí mismo y de su mundo: constructor de
              orden, belleza y solidez para su vida, su familia y su legado.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section-inner ag-about-block ag-about-contrast relative overflow-hidden">
        <div className="ag-about-block__bg pointer-events-none absolute inset-0" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LANDING_IMAGES.bgAboutSystems}
            alt=""
            className="ag-about-block__bg-img"
          />
        </div>
        <div className="ag-about-block__bg-scrim pointer-events-none absolute inset-0" aria-hidden />
        <div className="ag-container ag-about-contrast__shell relative z-10">
          <div className="ag-about-contrast__grid">
            <ScrollReveal className="ag-about-contrast__observations" distance={14}>
              <AboutEyebrow>MK · EL PROBLEMA</AboutEyebrow>
              <h2 className="ag-about-block__title ag-type-section text-white">
                Lo que observamos
              </h2>
              <p className="ag-about-contrast__lead font-body-md">
                Patrones que se repiten cuando falta estructura, no voluntad.
              </p>
              <ul className="ag-about-obs-grid">
                {PROBLEM_OBSERVATIONS.map((item) => (
                  <li key={item} className="ag-about-obs-card font-body-md">
                    {item}
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            <ScrollReveal className="ag-about-contrast__beliefs" distance={14} delay={0.06}>
              <AboutEyebrow>MK · LO QUE CREEMOS</AboutEyebrow>
              <div className="ag-panel ag-about-manifesto-panel">
                <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
                <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
                <p className="ag-about-manifesto-panel__anchor font-headline-md text-white">
                  {BELIEFS[0]}
                </p>
                <ul className="ag-about-beliefs-spine">
                  {BELIEFS.slice(1).map((belief) => (
                    <li key={belief} className="ag-about-beliefs-spine__item font-body-md">
                      {belief}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="ag-section-inner ag-about-block">
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal distance={14}>
            <AboutEyebrow>MK · POR QUÉ TECNOLOGÍA</AboutEyebrow>
            <h2 className="ag-about-block__title ag-type-section text-white">
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

      <section className="ag-section-inner ag-about-block">
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal className="ag-about-founder" distance={14}>
            <AboutEyebrow>MK · QUIEN LO CONSTRUYE</AboutEyebrow>
            <div className="ag-about-founder__card">
              <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
              <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
              <div className="ag-about-founder__grid">
                <div className="ag-about-founder__avatar" aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/mk-shield.png" alt="" className="ag-about-founder__mark" />
                </div>
                <div className="ag-about-founder__copy">
                  <h2 className="ag-about-founder__name ag-type-item text-white">
                    El equipo detrás de Maximus Kratos
                  </h2>
                  <p className="font-body-md ag-about-founder__bio">
                    Construimos infraestructura para hombres que exigen claridad real, no frases
                    vacías.
                  </p>
                  <ul className="ag-about-founder__principles">
                    <li className="font-body-md">Equipo reducido, sin atajos de marketing.</li>
                    <li className="font-body-md">
                      La metodología se construyó y se probó antes de convertirse en plataforma.
                    </li>
                    <li className="font-body-md">
                      Infraestructura y medición, no contenido motivacional.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <SubpageCta className="ag-about-cta" />
    </div>
  );
}
