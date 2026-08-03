'use client';

import Link from 'next/link';
import { AppIcon } from '@/components/app-icon';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { SubpageCta } from '@/components/pages/subpage-cta';
import { PublicFaqSection } from '@/components/pages/public-faq-section';
import { LANDING_IMAGES } from '@/lib/assets';
import { MANIFIESTO_FAQ_ITEMS } from '@/lib/manifiesto-faq';
import { DOMAINS } from '@/lib/mk-system';

const NAME_ETIMOLOGY = [
  {
    term: 'Maximus',
    origin: 'Latín',
    meaning: 'El más grande, el mayor',
    body: 'Título honorífico de la Antigua Roma para generales y figuras de excelencia.',
  },
  {
    term: 'Kratos',
    origin: 'Griego Κράτος',
    meaning: 'Poder, fuerza, soberanía',
    body: 'Gobierno de sí mismo: la fuerza que sostiene, no la que domina por vanidad.',
  },
] as const;

const LOGO_SYMBOLS = [
  {
    part: 'Escudo',
    meaning: 'La disciplina',
  },
  {
    part: 'Gules',
    meaning: 'La sangre del guerrero',
  },
  {
    part: 'Mancuerna y cruz',
    meaning: 'El sacrificio',
  },
] as const;

const MK_DEFINITION = {
  what: {
    label: '¿Qué es?',
    highlight: 'metodología de autodescubrimiento',
    body: 'MK es una metodología de autodescubrimiento y arquitectura personal que construye sistemas prácticos alineados a tu propósito trascendental, utilizando el rigor físico y la rendición de cuentas como el tablero de control de tu verdadera transformación.',
  },
  why: {
    label: '¿Por qué Maximus Kratos?',
    highlight: 'rescatando su potencial oculto',
    body: 'Creemos imprescindible despertar a quien se siente vacío y anestesiado por la materia, rescatando su potencial oculto para transformarlo en una fuerza de orden, construcción y servicio más allá de sí mismo.',
  },
  how: {
    label: '¿Cómo funciona?',
    lead: 'Mediante dos ejes fundamentales:',
    axes: [
      {
        title: 'Arquitectura del Sentido',
        body: 'Alinear Espíritu, Mente y Cuerpo, ayudándote a definir el propósito trascendental que justifica y direcciona tus acciones.',
      },
      {
        title: 'Rigor físico',
        body: 'Construye no solo cuerpos fuertes, sino mentes dominantes y resilientes sobre sus sombras. El autodominio es la base del resto.',
      },
    ],
  },
} as const;

const GREEK_CONCEPTS = [
  {
    term: 'Areté',
    greek: 'ἀρετή',
    meaning: 'La virtud como excelencia',
    body: 'Llevar tus capacidades al máximo al servicio del propósito que construyes. No perfección: excelencia aplicada.',
  },
  {
    term: 'Kalos Kagathos',
    greek: 'καλὸς κἀγαθός',
    meaning: 'Lo bello y lo bueno',
    body: 'El ideal de la vida completa: fortaleza exterior y rectitud interior bajo un mismo estándar.',
  },
] as const;

const PROBLEM_OBSERVATIONS = [
  'Sabes qué deberías hacer, pero no tienes un plano.',
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

const FRAGMENT_LINKS = [
  {
    from: 'Mentalidad confusa',
    to: 'debilita decisiones, hábitos y relaciones',
  },
  {
    from: 'Cuerpo agotado',
    to: 'nubla la mente y reduce la ejecución',
  },
  {
    from: 'Finanzas en tensión',
    to: 'condicionan casi toda prioridad',
  },
  {
    from: 'Relaciones frágiles',
    to: 'vacían el propósito y la disciplina',
  },
] as const;

const TECH_CAPABILITIES = [
  {
    num: '01',
    title: 'Conecta',
    body: 'Junta pilares y ámbitos en una sola lectura. Lo que pasa en un territorio no queda aislado del resto.',
  },
  {
    num: '02',
    title: 'Recuerda',
    body: 'Guarda diagnósticos, prioridades y acciones. No vuelves a empezar cada vez que la motivación baja.',
  },
  {
    num: '03',
    title: 'Mide',
    body: 'Pasa de “algo falla” a señales concretas: dónde hay tensión y dónde hay alineación.',
  },
  {
    num: '04',
    title: 'Ajusta',
    body: 'Recalibra prioridades cuando cambia tu contexto o aparecen nuevas tensiones entre dimensiones.',
  },
] as const;

const ALTERNATIVES = [
  {
    label: 'Cursos',
    body: 'Entregan conocimiento. No observan cómo lo aplicas ni sostienen el día a día.',
  },
  {
    label: 'Coaching',
    body: 'Puede ofrecer un acompañamiento profundo. Su continuidad depende de lo que logra sostenerse entre sesiones.',
  },
  {
    label: 'Mentorías',
    body: 'Aportan dirección y experiencia. Suelen concentrarse en un ámbito y por un periodo limitado.',
  },
  {
    label: 'Apps de hábitos',
    body: 'Registran acciones. Casi nunca entienden qué dimensión profunda las origina o las bloquea.',
  },
] as const;

const JOURNEY = [
  {
    num: '01',
    title: 'Llegas fragmentado',
    body: 'Mentalidad, relaciones, finanzas y salud física avanzan por separado. Hay esfuerzo, pero no se acumula.',
  },
  {
    num: '02',
    title: 'Haces el diagnóstico',
    body: 'MK lee Espíritu, Mente y Cuerpo y muestra tu estado real antes de construir encima.',
  },
  {
    num: '03',
    title: 'Construyes tu arquitectura',
    body: 'Defines dirección, prioridades y criterios. Dejas de improvisar: cada decisión se sostiene en esa arquitectura.',
  },
  {
    num: '04',
    title: 'Ejecutas la Ruta',
    body: 'Esa arquitectura se convierte en acciones concretas. No otra lista de propósitos: trabajo diario con dirección.',
  },
  {
    num: '05',
    title: 'Mides y ajustas',
    body: 'El sistema conserva el proceso, muestra el progreso y corrige el rumbo. El cambio deja de depender del impulso.',
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

function HighlightedBody({
  body,
  highlight,
  className,
}: {
  body: string;
  highlight: string;
  className?: string;
}) {
  const index = body.indexOf(highlight);
  if (index < 0) {
    return <p className={className}>{body}</p>;
  }
  return (
    <p className={className}>
      {body.slice(0, index)}
      <span className="ag-about-define__em">{highlight}</span>
      {body.slice(index + highlight.length)}
    </p>
  );
}

export function ManifiestoContent() {
  return (
    <div className="ag-landing ag-page ag-about-page flex min-h-full flex-col antialiased">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
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
            <p className="hud-text text-action-red">MANIFIESTO</p>
            <h1 className="ag-about-hero__title ag-type-display text-white">
              Construimos sistemas,
              <br />
              no discursos.
            </h1>
            <p className="ag-about-hero__origin font-body-lg">
              Hay voluntad de cambiar, pero sin un sistema que sostenga ese cambio.
              Maximus Kratos nació para construir ese orden.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── DEL NOMBRE ───────────────────────────────────────────────── */}
      <section className="ag-section-inner ag-about-block" aria-labelledby="name-heading">
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal distance={14}>
            <AboutEyebrow>DEL NOMBRE</AboutEyebrow>
            <h2 id="name-heading" className="ag-about-block__title ag-type-section text-white">
              Maximus Kratos
            </h2>
            <p className="ag-about-block__lead font-body-md">
              Dos raíces clásicas. Una sola idea: soberanía máxima al servicio de lo que construyes.
            </p>
          </ScrollReveal>
          <ScrollReveal distance={12} delay={0.05}>
            <div className="ag-about-name">
              {NAME_ETIMOLOGY.map((item) => (
                <article key={item.term} className="ag-about-name__card">
                  <span className="ag-about-name__corner ag-about-name__corner--tl" aria-hidden />
                  <span className="ag-about-name__corner ag-about-name__corner--br" aria-hidden />
                  <p className="hud-text text-action-red">{item.origin}</p>
                  <h3 className="ag-about-name__term ag-type-item text-white">{item.term}</h3>
                  <p className="ag-about-name__meaning">{item.meaning}</p>
                  <p className="ag-about-name__body font-body-md">{item.body}</p>
                </article>
              ))}
            </div>
            <p className="ag-about-name__close font-body-lg">
              En combinación: <span className="ag-about-name__close-em">Soberanía máxima</span>.
              Una masculinidad que retoma el mando de su propia vida para servir a otros.
            </p>
          </ScrollReveal>

          <ScrollReveal className="ag-about-emblem" distance={12} delay={0.08}>
            <p className="hud-text text-action-red">EL EMBLEMA</p>
            <div className="ag-about-emblem__stage">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/mk-shield.png"
                alt="Emblema Maximus Kratos"
                className="ag-about-emblem__mark"
              />
              <ul className="ag-about-emblem__list">
                {LOGO_SYMBOLS.map((item) => (
                  <li key={item.part} className="ag-about-emblem__item">
                    <span className="ag-about-emblem__part">{item.part}</span>
                    <span className="ag-about-emblem__meaning font-body-md">{item.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── DEFINICIÓN (video: qué / por qué / cómo) ──────────────────── */}
      <section className="ag-section-inner ag-about-block ag-about-block--dark" aria-labelledby="define-heading">
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal distance={14}>
            <AboutEyebrow>LA DEFINICIÓN</AboutEyebrow>
            <h2 id="define-heading" className="ag-about-block__title ag-type-section text-white">
              Qué es. Por qué existe. Cómo opera.
            </h2>
          </ScrollReveal>

          <ScrollReveal className="ag-about-define" distance={12} delay={0.04}>
            <article className="ag-about-define__card">
              <p className="hud-text text-action-red">{MK_DEFINITION.what.label}</p>
              <HighlightedBody
                className="ag-about-define__body font-body-lg"
                body={MK_DEFINITION.what.body}
                highlight={MK_DEFINITION.what.highlight}
              />
            </article>

            <article className="ag-about-define__card">
              <p className="hud-text text-action-red">{MK_DEFINITION.why.label}</p>
              <HighlightedBody
                className="ag-about-define__body font-body-lg"
                body={MK_DEFINITION.why.body}
                highlight={MK_DEFINITION.why.highlight}
              />
            </article>

            <article className="ag-about-define__card ag-about-define__card--axes">
              <p className="hud-text text-action-red">{MK_DEFINITION.how.label}</p>
              <p className="ag-about-define__lead font-body-md">{MK_DEFINITION.how.lead}</p>
              <ol className="ag-about-define__axes">
                {MK_DEFINITION.how.axes.map((axis, index) => (
                  <li key={axis.title} className="ag-about-define__axis">
                    <span className="ag-about-define__axis-num hud-text">
                      {index === 0 ? 'I' : 'II'}
                    </span>
                    <div>
                      <h3 className="ag-about-define__axis-title">{axis.title}</h3>
                      <p className="ag-about-define__axis-body font-body-md">{axis.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </article>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FUNDAMENTO GRIEGO ────────────────────────────────────────── */}
      <section className="ag-section-inner ag-about-block">
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal distance={14}>
            <AboutEyebrow>EL FUNDAMENTO</AboutEyebrow>
            <h2 className="ag-about-block__title ag-type-section text-white">
              No inventamos la idea. La rescatamos.
            </h2>
            <p className="ag-about-block__lead font-body-md">
              Maximus Kratos recupera dos ideales griegos y los traduce en una arquitectura
              práctica: ordenar espíritu, mente y cuerpo bajo un mismo propósito.
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
              Así te conviertes en arquitecto de ti mismo y de tu mundo: constructor de
              orden, belleza y solidez para tu vida, tu familia y tu legado.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── PROBLEMA + CREENCIAS ─────────────────────────────────────── */}
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
            <ScrollReveal className="ag-about-contrast__col" distance={14}>
              <article className="ag-panel ag-about-contrast__panel h-full">
                <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
                <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
                <AboutEyebrow>EL PROBLEMA</AboutEyebrow>
                <h2 className="ag-about-contrast__title ag-type-item text-white">
                  Lo que observamos
                </h2>
                <p className="ag-about-contrast__lead font-body-md">
                  Patrones que se repiten cuando falta estructura, no voluntad.
                </p>
                <ul className="ag-about-beliefs-spine">
                  {PROBLEM_OBSERVATIONS.map((item) => (
                    <li key={item} className="ag-about-beliefs-spine__item font-body-md">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </ScrollReveal>

            <ScrollReveal className="ag-about-contrast__col" distance={14} delay={0.06}>
              <article className="ag-panel ag-about-contrast__panel h-full">
                <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
                <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
                <AboutEyebrow>LO QUE CREEMOS</AboutEyebrow>
                <h2 className="ag-about-contrast__title ag-type-item text-white">
                  Lo que sostenemos
                </h2>
                <p className="ag-about-contrast__lead font-body-md">
                  Principios que orientan el sistema antes que cualquier plan o herramienta.
                </p>
                <ul className="ag-about-beliefs-spine">
                  {BELIEFS.map((belief) => (
                    <li key={belief} className="ag-about-beliefs-spine__item font-body-md">
                      {belief}
                    </li>
                  ))}
                </ul>
              </article>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── 1. FRAGMENTACIÓN ─────────────────────────────────────────── */}
      <section
        className="ag-section-inner ag-about-block ag-about-block--dark ag-about-fragment"
        aria-labelledby="frag-heading"
      >
        <div className="ag-container">
          <div className="ag-about-block__shell">
            <ScrollReveal distance={14}>
              <AboutEyebrow>LA FRAGMENTACIÓN</AboutEyebrow>
              <h2 id="frag-heading" className="ag-about-block__title ag-type-section text-white">
                Una vida no puede ordenarse por partes.
              </h2>
              <p className="ag-about-block__lead ag-about-block__lead--emphasis font-body-lg">
                Mentalidad, relaciones, finanzas y salud física se tratan por separado.
                <span className="ag-about-block__lead-break">
                  Cada territorio recibe atención. Ninguno ve el sistema completo.
                </span>
              </p>
            </ScrollReveal>
          </div>

          <ScrollReveal className="ag-about-converge" distance={14}>
            <ul className="ag-about-converge__scatter">
              {DOMAINS.map((domain) => (
                <li key={domain.key} className="ag-about-converge__chip">
                  <span className="ag-about-converge__chip-icon" aria-hidden>
                    <AppIcon name={domain.icon} size={16} />
                  </span>
                  <span className="ag-about-converge__chip-label">{domain.label}</span>
                  <span className="ag-about-converge__chip-q font-body-sm">{domain.question}</span>
                </li>
              ))}
            </ul>

            <div className="ag-about-converge__core">
              <span className="ag-about-converge__arrow" aria-hidden />
              <div className="ag-about-converge__nucleus">
                <p className="hud-text text-action-red">LO QUE FALTA</p>
                <p className="ag-about-converge__title">Una sola lectura</p>
                <p className="ag-about-converge__body font-body-md">
                  Esos cuatro territorios necesitan observarse juntos. Si no, el esfuerzo en uno
                  se cancela en otro.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <div className="ag-about-block__shell">
            <ScrollReveal className="ag-about-cost" distance={12} delay={0.04}>
              <p className="hud-text text-action-red ag-about-cost__eyebrow">EL COSTO REAL</p>
              <p className="ag-about-cost__lead">
                <span className="ag-about-cost__lead-main">
                  El problema no es atender cada área.
                </span>
                <span className="ag-about-cost__lead-sub">
                  Es que una dimensión afecta a las demás y nadie mide esas tensiones juntas.
                </span>
              </p>
              <ul className="ag-about-crosslinks">
                {FRAGMENT_LINKS.map((link) => (
                  <li key={link.from} className="ag-about-crosslink">
                    <span className="ag-about-crosslink__from">{link.from}</span>
                    <span className="ag-about-crosslink__sep" aria-hidden>
                      →
                    </span>
                    <span className="ag-about-crosslink__to">{link.to}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            <ScrollReveal className="ag-about-cost__link" distance={10} delay={0.06}>
              <Link href="/marco-central" className="ag-marco-more__link font-label-lg">
                Así se observa: el modelo completo
                <AppIcon name="arrow-right" size={14} />
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── 2. POR QUÉ TECNOLOGÍA ─────────────────────────────────────── */}
      <section
        className="ag-section-inner ag-about-block ag-about-block--dark ag-about-tech-section"
        aria-labelledby="tech-heading"
      >
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal distance={14}>
            <AboutEyebrow>POR QUÉ TECNOLOGÍA</AboutEyebrow>
            <h2 id="tech-heading" className="ag-about-block__title ag-type-section text-white">
              El método necesita algo que no olvide.
            </h2>
            <p className="ag-about-block__lead font-body-lg">
              Un diagnóstico en papel se pierde. Una sesión termina. La tecnología existe para
              conectar lo que descubres, conservarlo, medirlo y actualizarlo con el tiempo.
            </p>
          </ScrollReveal>

          <ScrollStaggerContainer className="ag-about-capabilities" stagger={0.06}>
            {TECH_CAPABILITIES.map((item) => (
              <StaggerItem key={item.title} className="ag-about-capabilities__item" distance={10}>
                <article className="ag-about-capability">
                  <span className="ag-about-capability__num hud-text">{item.num}</span>
                  <h3 className="ag-about-capability__title">{item.title}</h3>
                  <p className="ag-about-capability__body font-body-md">{item.body}</p>
                </article>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>

      {/* ── 4. NO ES OTRA HERRAMIENTA ─────────────────────────────────── */}
      <section
        className="ag-section-inner ag-about-block ag-about-context-section"
        aria-labelledby="alt-heading"
      >
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal distance={14}>
            <AboutEyebrow>CONTEXTO</AboutEyebrow>
            <h2 id="alt-heading" className="ag-about-block__title ag-type-section text-white">
              No compite con lo que ya usas.
            </h2>
            <p className="ag-about-block__lead font-body-lg">
              Un curso enseña. Un coach o mentor acompaña. Una app registra. Cada uno hace su
              parte. Lo que falta es la capa que mantiene unido lo que aprendes, lo que decides y
              lo que ejecutas después.
            </p>
          </ScrollReveal>

          <ScrollReveal className="ag-about-alts-wrap" distance={12} delay={0.04}>
            <ul className="ag-about-alts">
              {ALTERNATIVES.map((item) => (
                <li key={item.label} className="ag-about-alt">
                  <span className="ag-about-alt__label font-label-lg">{item.label}</span>
                  <p className="ag-about-alt__body font-body-md">{item.body}</p>
                </li>
              ))}
            </ul>

            <div className="ag-about-alt-mk">
              <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
              <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
              <p className="hud-text text-action-red">MAXIMUS KRATOS</p>
              <p className="ag-about-alt-mk__title">
                Esa capa es el sistema.
              </p>
              <p className="ag-about-alt-mk__body font-body-md">
                No reemplaza un curso ni un coach. Les da continuidad: diagnóstico, dirección y
                ejecución quedan conectados en un solo proceso.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 6. RECORRIDO ─────────────────────────────────────────────── */}
      <section
        className="ag-section-inner ag-about-block ag-about-block--dark ag-about-journey-section"
        aria-labelledby="journey-heading"
      >
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal distance={14}>
            <AboutEyebrow>EL RECORRIDO</AboutEyebrow>
            <h2 id="journey-heading" className="ag-about-block__title ag-type-section text-white">
              Así opera Maximus Kratos contigo.
            </h2>
            <p className="ag-about-block__lead font-body-lg">
              Del esfuerzo fragmentado a un proceso con diagnóstico, dirección, ejecución y
              seguimiento.
            </p>
          </ScrollReveal>

          <ol className="ag-about-journey">
            {JOURNEY.map((stage, index) => (
              <ScrollReveal
                key={stage.num}
                className={`ag-about-journey__step ag-about-journey__step--${index + 1}`}
                distance={10}
              >
                <div className="ag-about-journey__rail" aria-hidden>
                  <span className="ag-about-journey__pip" />
                </div>
                <div className="ag-about-journey__copy">
                  <span className="ag-about-journey__num hud-text">{stage.num}</span>
                  <h3 className="ag-about-journey__title">{stage.title}</h3>
                  <p className="ag-about-journey__body font-body-md">{stage.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <PublicFaqSection
        idPrefix="manifiesto"
        title="Preguntas sobre Maximus Kratos."
        lead="Lo esencial sobre qué es MK, para quién es y por qué existe."
        items={MANIFIESTO_FAQ_ITEMS}
      />

      {/* ── 8. PRIMER PASO ───────────────────────────────────────────── */}
      <SubpageCta className="ag-about-cta">
        <Link href="/sistema" className="ag-marco-more__link font-label-lg">
          Ver la plataforma
          <AppIcon name="arrow-right" size={14} />
        </Link>
      </SubpageCta>
    </div>
  );
}
