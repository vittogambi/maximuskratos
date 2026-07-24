'use client';

import { AppIcon } from '@/components/app-icon';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { SubpageCta } from '@/components/pages/subpage-cta';
import { LANDING_IMAGES } from '@/lib/assets';
import { DOMAINS, PILLARS } from '@/lib/mk-system';

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
    body: 'El ideal del hombre completo: fortaleza exterior y rectitud interior bajo un mismo estándar.',
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

const FRAGMENT_TOOLS = [
  'Hábitos',
  'Entrenamiento',
  'Finanzas',
  'Notas',
  'Cursos',
  'Coach',
  'Mentor',
  'Diario',
] as const;

const FRAGMENT_LINKS = [
  {
    from: 'Identidad incierta',
    to: 'se manifiesta como falta de disciplina',
  },
  {
    from: 'Cuerpo desordenado',
    to: 'reduce la claridad mental',
  },
  {
    from: 'Trabajo sin dirección',
    to: 'debilita hábitos y relaciones',
  },
  {
    from: 'Presión financiera',
    to: 'condiciona casi todas las decisiones',
  },
] as const;

const TECH_CAPABILITIES = [
  {
    title: 'Conecta',
    body: 'Relaciona pilares, ámbitos y comportamientos dentro de una sola arquitectura. Nada se observa aislado.',
  },
  {
    title: 'Recuerda',
    body: 'Conserva diagnósticos, prioridades, acciones y evolución. El proceso no vuelve a empezar de cero.',
  },
  {
    title: 'Mide',
    body: 'Convierte “algo falla” en señales concretas sobre el estado de cada dimensión.',
  },
  {
    title: 'Reordena',
    body: 'Reordena las prioridades cuando cambian la persona, su contexto o las tensiones entre sus dimensiones.',
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

const OPERATING_CYCLE = [
  {
    num: '01',
    title: 'Observa',
    body: 'Reúne información de los pilares y de los ámbitos donde se manifiestan.',
  },
  {
    num: '02',
    title: 'Relaciona',
    body: 'Detecta tensiones y patrones entre áreas que normalmente se miran por separado.',
  },
  {
    num: '03',
    title: 'Prioriza',
    body: 'Define qué necesita atención primero y qué puede esperar.',
  },
  {
    num: '04',
    title: 'Convierte',
    body: 'Transforma el diagnóstico en plano de trabajo, acciones y misiones concretas.',
  },
  {
    num: '05',
    title: 'Sigue',
    body: 'Registra progreso, conserva contexto y ajusta cuando la realidad cambia.',
  },
] as const;

const JOURNEY = [
  {
    num: '01',
    title: 'Fragmentación',
    body: 'Problemas aislados. Esfuerzos que compiten entre sí y no se acumulan.',
  },
  {
    num: '02',
    title: 'Lectura',
    body: 'Una lectura honesta del estado actual del sistema completo.',
  },
  {
    num: '03',
    title: 'Arquitectura',
    body: 'Las áreas se ordenan bajo un plano común y aparecen prioridades claras.',
  },
  {
    num: '04',
    title: 'Ejecución',
    body: 'Las prioridades se vuelven decisiones, acciones y prácticas concretas.',
  },
  {
    num: '05',
    title: 'Evolución',
    body: 'El progreso se mide, el plano se ajusta y el cambio deja de depender de impulsos.',
  },
] as const;

const MEMORY_TRACKS = [
  'Qué detectó el diagnóstico',
  'Qué dimensiones estaban más comprometidas',
  'Qué prioridades se definieron',
  'Qué acciones se completaron',
  'Qué obstáculos se repiten',
  'Qué áreas mejoran y cuáles se estancan',
  'Cómo cambia el sistema completo con el tiempo',
] as const;

const FOUNDER_POINTS = [
  'Primero el método. Después la plataforma.',
  'La metodología nació antes que el producto digital y se refina mediante uso, observación y prueba.',
  'Cada decisión se evalúa por una pregunta: ¿ayuda a comprender mejor el sistema, priorizar con claridad y actuar de manera consistente?',
  'Seguimos refinándolo mediante observación, pruebas y aprendizaje obtenido del uso real.',
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
            <p className="hud-text text-action-red">QUIÉNES SOMOS</p>
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
              Así, el hombre se convierte en arquitecto de sí mismo y de su mundo: constructor de
              orden, belleza y solidez para su vida, su familia y su legado.
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
      <section className="ag-section-inner ag-about-block ag-about-block--dark" aria-labelledby="frag-heading">
        <div className="ag-container">
          <div className="ag-about-block__shell">
            <ScrollReveal distance={14}>
              <AboutEyebrow>LA FRAGMENTACIÓN</AboutEyebrow>
              <h2 id="frag-heading" className="ag-about-block__title ag-type-section text-white">
                Una vida no puede ordenarse por partes.
              </h2>
              <p className="ag-about-block__lead ag-about-block__lead--emphasis font-body-lg">
                Hoy cada área vive en una herramienta distinta.
                <span className="ag-about-block__lead-break">
                  Cada una ayuda en algo. Ninguna entiende al hombre completo.
                </span>
              </p>
            </ScrollReveal>
          </div>

          <ScrollReveal className="ag-about-converge" distance={14}>
            <div className="ag-about-converge__scatter" aria-hidden>
              {FRAGMENT_TOOLS.map((tool) => (
                <span key={tool} className="ag-about-converge__chip">
                  {tool}
                </span>
              ))}
            </div>
            <div className="ag-about-converge__core">
              <span className="ag-about-converge__arrow" aria-hidden />
              <div className="ag-about-converge__nucleus">
                <p className="hud-text text-action-red">NÚCLEO</p>
                <p className="ag-about-converge__title">Sistema MK</p>
                <p className="ag-about-converge__body font-body-md">
                  Lo que hoy está separado necesita operar como un solo sistema.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <div className="ag-about-block__shell">
            <ScrollReveal className="ag-about-cost" distance={12} delay={0.04}>
              <p className="hud-text text-action-red ag-about-cost__eyebrow">EL COSTO REAL</p>
              <p className="ag-about-cost__lead">
                <span className="ag-about-cost__lead-main">
                  El problema no es solo la cantidad de herramientas.
                </span>
                <span className="ag-about-cost__lead-sub">
                  Es que ninguna detecta cómo una dimensión está afectando a las demás.
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
          </div>
        </div>
      </section>

      {/* ── 2. POR QUÉ TECNOLOGÍA ─────────────────────────────────────── */}
      <section className="ag-section-inner ag-about-block" aria-labelledby="tech-heading">
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal distance={14}>
            <AboutEyebrow>POR QUÉ TECNOLOGÍA</AboutEyebrow>
            <h2 id="tech-heading" className="ag-about-block__title ag-type-section text-white">
              Un sistema humano necesita memoria.
            </h2>
            <p className="ag-about-block__lead font-body-lg">
              Los consejos desaparecen. La motivación fluctúa. La plataforma existe para que cada
              diagnóstico, decisión y acción forme parte de un proceso que continúa.
            </p>
          </ScrollReveal>

          <ScrollStaggerContainer className="ag-about-capabilities" stagger={0.06}>
            {TECH_CAPABILITIES.map((item) => (
              <StaggerItem key={item.title} className="ag-about-capabilities__item" distance={10}>
                <article className="ag-panel ag-panel--marco ag-about-capability h-full">
                  <span className="ag-panel__corner ag-panel__corner--hover" aria-hidden />
                  <h3 className="ag-panel__card-title">{item.title}</h3>
                  <p className="ag-panel__card-body font-body-md">{item.body}</p>
                </article>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>

          <ScrollReveal className="ag-about-memory" distance={12} delay={0.05}>
            <p className="hud-text text-action-red">QUÉ RECUERDA MK</p>
            <p className="ag-about-memory__intro font-body-md">
              La plataforma conserva el hilo de tu proceso, no solo el último consejo.
            </p>
            <ul className="ag-about-memory__list">
              {MEMORY_TRACKS.map((item) => (
                <li key={item} className="font-body-md">
                  {item}
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 3. TODO EL HOMBRE ─────────────────────────────────────────── */}
      <section className="ag-section-inner ag-about-block ag-about-block--dark" aria-labelledby="arch-heading">
        <div className="ag-container">
          <div className="ag-about-block__shell">
            <ScrollReveal distance={14}>
              <AboutEyebrow>LA ARQUITECTURA</AboutEyebrow>
              <h2 id="arch-heading" className="ag-about-block__title ag-type-section text-white">
                Todo el hombre. Un solo sistema.
              </h2>
              <p className="ag-about-block__lead font-body-lg">
                MK reúne en una misma plataforma lo que normalmente se trabaja por separado. No
                trata los hábitos, el cuerpo, el propósito o las finanzas como problemas aislados.
                Analiza cómo se relacionan y qué orden necesita el conjunto.
              </p>
            </ScrollReveal>
          </div>

          <ScrollReveal className="ag-about-architecture" distance={14}>
            <div className="ag-about-architecture__layer">
              <p className="hud-text text-action-red">PILARES INTERNOS</p>
              <p className="ag-about-architecture__hint font-body-md">
                Dimensiones que sostienen al individuo.
              </p>
              <div className="ag-about-architecture__nodes">
                {PILLARS.map((pillar) => (
                  <div key={pillar.key} className="ag-about-architecture__node">
                    <AppIcon name={pillar.icon} size={18} aria-hidden />
                    <span>{pillar.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ag-about-architecture__bridge" aria-hidden>
              <span className="ag-about-architecture__bridge-line" />
              <span className="ag-about-architecture__bridge-label">se manifiestan en</span>
              <span className="ag-about-architecture__bridge-line" />
            </div>

            <div className="ag-about-architecture__layer">
              <p className="hud-text text-action-red">ÁMBITOS DE LA VIDA</p>
              <p className="ag-about-architecture__hint font-body-md">
                Espacios reales donde esos pilares se ponen a prueba.
              </p>
              <div className="ag-about-architecture__nodes ag-about-architecture__nodes--domains">
                {DOMAINS.map((domain) => (
                  <div key={domain.key} className="ag-about-architecture__node ag-about-architecture__node--domain">
                    <AppIcon name={domain.icon} size={18} aria-hidden />
                    <span>{domain.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal className="ag-about-block__shell" distance={12} delay={0.04}>
            <ol className="ag-about-layers">
              <li>
                <span>01</span> Quién eres
              </li>
              <li>
                <span>02</span> Cómo funciona tu sistema
              </li>
              <li>
                <span>03</span> Dónde se manifiesta
              </li>
              <li>
                <span>04</span> Qué haces
              </li>
              <li>
                <span>05</span> Qué resultado produce
              </li>
            </ol>
            <p className="ag-about-architecture__close font-body-md">
              No son módulos independientes. Son capas de un mismo modelo conectado.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 4. NO ES OTRA HERRAMIENTA ─────────────────────────────────── */}
      <section className="ag-section-inner ag-about-block" aria-labelledby="alt-heading">
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal distance={14}>
            <AboutEyebrow>CONTEXTO</AboutEyebrow>
            <h2 id="alt-heading" className="ag-about-block__title ag-type-section text-white">
              No es otra herramienta aislada.
            </h2>
            <p className="ag-about-block__lead font-body-lg">
              Cursos, coaching, mentorías y apps de hábitos sirven. Operando solos, les falta la
              infraestructura que une conocimiento, acompañamiento y acción cotidiana.
            </p>
          </ScrollReveal>

          <ScrollStaggerContainer className="ag-about-alts" stagger={0.05}>
            {ALTERNATIVES.map((item) => (
              <StaggerItem key={item.label} className="ag-about-alt" distance={10}>
                <h3 className="ag-about-alt__label font-label-lg">{item.label}</h3>
                <p className="ag-about-alt__body font-body-md">{item.body}</p>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>

          <ScrollReveal className="ag-panel ag-about-alt-mk" distance={12} delay={0.05}>
            <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
            <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
            <p className="hud-text text-action-red">MAXIMUS KRATOS</p>
            <p className="ag-about-alt-mk__title">
              Integra diagnóstico, arquitectura, prioridades, ejecución y seguimiento en un
              sistema que permanece activo.
            </p>
            <p className="ag-about-alt-mk__body font-body-md">
              No pretende reemplazarlos. Crea la infraestructura que normalmente falta entre el
              conocimiento, el acompañamiento y la acción cotidiana.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 5. CÓMO OPERA ────────────────────────────────────────────── */}
      <section className="ag-section-inner ag-about-block ag-about-block--dark" aria-labelledby="ops-heading">
        <div className="ag-container">
          <div className="ag-about-block__shell">
            <ScrollReveal distance={14}>
              <AboutEyebrow>CÓMO OPERA</AboutEyebrow>
              <h2 id="ops-heading" className="ag-about-block__title ag-type-section text-white">
                No motiva. Organiza.
              </h2>
              <p className="ag-about-block__lead font-body-lg">
                MK no decide quién debes ser ni promete transformar tu vida con frases. Construye
                una lectura estructurada de tu estado actual y la convierte en una secuencia de
                decisiones y acciones.
              </p>
            </ScrollReveal>
          </div>

          <ScrollReveal className="ag-about-cycle" distance={14}>
            <div className="ag-about-cycle__ring">
              <svg className="ag-about-cycle__orbit" viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="38" fill="none" pathLength="100" />
                <polygon points="50,8 47.2,13.5 52.8,13.5" className="ag-about-cycle__orbit-arrow" />
              </svg>

              <div className="ag-about-cycle__hub" aria-hidden>
                <p className="hud-text text-action-red">CICLO</p>
                <p className="ag-about-cycle__hub-title">MK</p>
                <p className="ag-about-cycle__hub-sub">observa → ajusta</p>
              </div>

              <ol className="ag-about-cycle__list">
                {OPERATING_CYCLE.map((step, index) => (
                  <li
                    key={step.num}
                    className={`ag-about-cycle__step ag-about-cycle__step--${index + 1}`}
                  >
                    <span className="ag-about-cycle__num hud-text">{step.num}</span>
                    <h3 className="ag-about-cycle__title">{step.title}</h3>
                    <p className="ag-about-cycle__body font-body-md">{step.body}</p>
                  </li>
                ))}
              </ol>
            </div>
            <p className="ag-about-cycle__note font-body-md">
              No es un proceso que termina. Es un ciclo de observación, ejecución, medición y
              ajuste.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 6. RECORRIDO ─────────────────────────────────────────────── */}
      <section className="ag-section-inner ag-about-block" aria-labelledby="journey-heading">
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal distance={14}>
            <AboutEyebrow>EL RECORRIDO</AboutEyebrow>
            <h2 id="journey-heading" className="ag-about-block__title ag-type-section text-white">
              Del esfuerzo disperso a la transformación sostenida.
            </h2>
            <p className="ag-about-block__lead font-body-lg">
              El cambio real no nace de un impulso. Nace cuando el desorden se convierte en un
              plano que se ejecuta y se mide.
            </p>
          </ScrollReveal>

          <ol className="ag-about-journey">
            {JOURNEY.map((stage) => (
              <ScrollReveal key={stage.num} className="ag-about-journey__step" distance={10}>
                <span className="ag-about-journey__num hud-text">{stage.num}</span>
                <div>
                  <h3 className="ag-about-journey__title">{stage.title}</h3>
                  <p className="ag-about-journey__body font-body-md">{stage.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 7. QUIÉN LO CONSTRUYE ─────────────────────────────────────── */}
      <section className="ag-section-inner ag-about-block ag-about-block--dark">
        <div className="ag-container ag-about-block__shell">
          <ScrollReveal className="ag-about-founder" distance={14}>
            <AboutEyebrow>QUIÉN LO CONSTRUYE</AboutEyebrow>
            <h2 className="ag-about-block__title ag-type-section text-white">
              Un equipo pequeño. Un sistema que se sigue afilando.
            </h2>
            <p className="ag-about-block__lead font-body-lg">
              Maximus Kratos lo construye un equipo reducido que combina método, producto y
              tecnología. No buscamos producir más contenido sobre desarrollo personal, sino
              construir la infraestructura que permite convertir claridad en acción sostenida.
            </p>
            <div className="ag-about-founder__card">
              <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
              <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
              <div className="ag-about-founder__grid">
                <div className="ag-about-founder__avatar" aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/mk-shield.png" alt="" className="ag-about-founder__mark" />
                </div>
                <div className="ag-about-founder__copy">
                  <p className="hud-text text-action-red">CÓMO TRABAJAMOS</p>
                  <p className="ag-about-founder__method-title font-body-md">
                    Primero el método. Después la plataforma.
                  </p>
                  <ul className="ag-about-founder__principles">
                    {FOUNDER_POINTS.slice(1).map((point) => (
                      <li key={point} className="font-body-md">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 8. PRIMER PASO ───────────────────────────────────────────── */}
      <SubpageCta className="ag-about-cta" />
    </div>
  );
}
