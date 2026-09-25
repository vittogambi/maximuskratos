'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { MOTION_DISTANCE, MOTION_STAGGER } from '@/components/motion/tokens';
import { SectionIntro } from '@/components/pages/section-intro';
import { SubpageCta } from '@/components/pages/subpage-cta';
import { LANDING_IMAGES } from '@/lib/assets';

const WHY_POINTS = [
  'La disciplina se convierte en repetición.',
  'El trabajo se convierte únicamente en obligación.',
  'Las metas se acumulan sin construir una vida coherente.',
  'Las capacidades se utilizan sin una dirección común.',
  'Las decisiones dependen del impulso o de la presión del entorno.',
] as const;

const MK_PILLAR_PATH = [
  'Linaje',
  'Visión',
  'Valores',
  'Estándares',
  'Identidad',
  'Dificultades',
  'Personalidad',
  'IKIGAI',
  'Huella',
] as const;

const IKIGAI_FIELDS: ReadonlyArray<{
  num: string;
  label: string;
  icon: AppIconName;
  question: string;
  body: string;
}> = [
  {
    num: '01',
    label: 'Lo que amas',
    icon: 'heart',
    question: '¿Qué actividades te hacen sentir interesado, energizado o con ganas de seguir mejorando?',
    body: 'Piensa en cosas que haces por iniciativa propia, que despiertan tu curiosidad o en las que disfrutas progresar.',
  },
  {
    num: '02',
    label: 'En lo que eres bueno',
    icon: 'medal',
    question: '¿Qué capacidades tienes hoy o has demostrado que puedes desarrollar bien?',
    body: 'Piensa en resultados que ya has conseguido, experiencia que has acumulado o cosas que aprendes con especial facilidad.',
  },
  {
    num: '03',
    label: 'Lo que el mundo necesita',
    icon: 'world',
    question: '¿Qué problemas, necesidades o personas sientes que vale la pena ayudar?',
    body: 'Piensa en situaciones que te importaría mejorar, aunque todavía no tengas claro cómo hacerlo.',
  },
  {
    num: '04',
    label: 'Por lo que te pueden pagar',
    icon: 'coins',
    question: '¿Qué resultados podrías generar que alguien valoraría lo suficiente como para sostenerlos?',
    body: 'Puede ser mediante dinero, intercambio, un producto, un servicio, un oficio o una responsabilidad que otros necesiten.',
  },
];

const TENSIONS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: 'Significado sin capacidad',
    body: 'Algo puede importarte profundamente, pero todavía requerir aprendizaje, práctica o formación antes de convertirse en una dirección real.',
  },
  {
    title: 'Capacidad sin significado',
    body: 'Puedes destacar en algo que ya no representa quién eres ni la vida que quieres construir.',
  },
  {
    title: 'Contribución sin sostenibilidad',
    body: 'Puedes generar valor para otros mientras agotas tus recursos, tu tiempo o tu estabilidad.',
  },
  {
    title: 'Sostenibilidad sin dirección',
    body: 'Puedes construir una vida económicamente funcional que, sin embargo, se siente desconectada de tus valores y de hacia dónde quieres ir.',
  },
];

const IKIGAI_NOT: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: 'No es un cargo',
    body: 'Tu IKIGAI no tiene que coincidir con el nombre de una profesión ni permanecer igual durante toda tu vida.',
  },
  {
    title: 'No es una frase inspiracional',
    body: 'Una declaración sin decisiones, experiencia ni evidencia no puede orientar una vida.',
  },
  {
    title: 'No es un test de personalidad',
    body: 'MK no asigna una etiqueta definitiva. Organiza información que debe ser interpretada y contrastada.',
  },
  {
    title: 'No es una fórmula perfecta',
    body: 'Las cuatro dimensiones pueden mostrar tensión, incertidumbre y alternativas. Esa información también forma parte del resultado.',
  },
  {
    title: 'No es exclusivamente trabajo',
    body: 'Puede expresarse en una profesión, una empresa, una familia, una obra, un servicio o una combinación de ámbitos.',
  },
];

const IKIGAI_PROCESS: ReadonlyArray<{ num: string; title: string; body: string }> = [
  {
    num: '01',
    title: 'Exploras',
    body: 'Recorres los cuatro círculos y anotas material propio. Puedes usar un banco de ideas, pero cada sugerencia se personaliza antes de entrar a tu mapa.',
  },
  {
    num: '02',
    title: 'Relacionas',
    body: 'Miras los cuatro grupos juntos y decides qué piezas parecen pertenecer a una misma dirección. No hay cruce automático ni fórmula 4/4.',
  },
  {
    num: '03',
    title: 'Formulas',
    body: 'Escribes una hipótesis de dirección con tus palabras. Puedes construir hasta tres. Una es suficiente para continuar.',
  },
  {
    num: '04',
    title: 'Contrastas',
    body: 'Pones a prueba una dirección con seis criterios: disfrute, capacidad, utilidad, sustento, coherencia y factibilidad. Sin score.',
  },
  {
    num: '05',
    title: 'Pruebas',
    body: 'Diseñas un experimento de 30, 60 o 90 días para obtener evidencia real y recalibrar la dirección.',
  },
];

const RESULT_ITEMS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: 'Tu hipótesis de dirección',
    body: 'Una frase que tú escribes. No es una definición de quién eres ni un propósito calculado.',
  },
  {
    title: 'Cómo se construye',
    body: 'Las piezas de los cuatro círculos que tú relacionaste para esa dirección.',
  },
  {
    title: 'Cómo se ve hoy',
    body: 'Tus respuestas a los seis criterios. Sin promedio y sin porcentaje.',
  },
  {
    title: 'Qué falta descubrir',
    body: 'Círculos vacíos o criterios que todavía no respondiste.',
  },
  {
    title: 'Un experimento',
    body: 'Qué vas a hacer en 30, 60 o 90 días y qué contarás como evidencia nueva.',
  },
];

const DECISION_AREAS = [
  'Proyectos',
  'Formación',
  'Trabajo',
  'Uso del tiempo',
  'Decisiones económicas',
  'Contribución',
] as const;

export function IkigaiContent() {
  return (
    <div className="ag-landing ag-page ag-ikigai-page flex min-h-full flex-col antialiased">
      {/* 1. HERO */}
      <section className="ag-about-hero ag-ikigai-hero relative overflow-hidden">
        <div className="ag-about-hero__bg-wrap" aria-hidden>
          <Image
            src={LANDING_IMAGES.ikigaiHero}
            alt=""
            fill
            sizes="100vw"
            priority
            className="ag-about-hero__bg ag-ikigai-hero__bg"
          />
        </div>
        <div className="ag-about-hero__scrim" aria-hidden />
        <div className="ag-about-hero__content ag-container relative z-10">
          <ScrollReveal className="ag-about-hero__intro text-center" density="spacious">
            <p className="hud-text text-action-red">ESPÍRITU</p>
            <h1 className="ag-about-hero__title ag-type-display text-white">IKIGAI · Tu mapa de dirección</h1>
            <p className="ag-about-hero__origin font-body-lg">Empieza por ordenar las piezas.</p>
            <p className="font-body-md ag-ikigai-hero__lead">
              Explora lo que amas, en lo que eres bueno, lo que el mundo necesita y por lo que te
              pueden pagar. Después conéctalo y dale forma a una dirección para explorar.
            </p>
            <div className="ag-ikigai-hero__cta">
              <Link href="/ikigai/empezar" className="ag-btn-cta font-label-lg">
                Empezar mi mapa
              </Link>
              <p className="font-body-md ag-ikigai-hero__note">
                Versión en revisión. No buscamos definir tu propósito por ti.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 2. POR QUÉ IMPORTA */}
      <section className="ag-section-inner ag-about-block" aria-labelledby="why-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="DIRECCIÓN"
            title="Puedes avanzar durante años en la dirección equivocada."
            lead="Una persona puede ser disciplinada, productiva y competente sin saber hacia qué está dirigiendo esa capacidad."
            headingId="why-heading"
          />
          <ScrollReveal className="ag-ikigai-why" density="default">
            <p className="hud-text text-action-red ag-ikigai-why__lead">Cuando falta un eje de propósito</p>
            <ol className="ag-ikigai-why__list">
              {WHY_POINTS.map((point, index) => (
                <li key={point} className="ag-ikigai-why__item">
                  <span className="ag-ikigai-why__num hud-text" aria-hidden>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="ag-ikigai-why__text font-body-md">{point}</p>
                </li>
              ))}
            </ol>
            <div className="ag-panel ag-panel--marco ag-ikigai-why__close">
              <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
              <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
              <p className="font-body-lg">
                El IKIGAI no reemplaza la acción ni entrega una respuesta mágica. Su función es
                proporcionar un criterio para orientar esfuerzo, capacidades y decisiones.
              </p>
            </div>
            <p className="ag-ikigai-why__quote font-headline-sm">
              No basta con poder ejecutar.
              <br />
              Debes comprender qué merece ser construido.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 3. LA INTERSECCIÓN */}
      <section className="ag-section-inner ag-about-block" aria-labelledby="campos-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="CUATRO CÍRCULOS"
            title="Cuatro formas de mirar. Una dirección que tú formulas."
            lead="El producto ordena la reflexión. No exige completar perfectamente cuatro círculos. No calcula tu propósito."
            leadMobile="Cuatro círculos para ordenar. Tú formulas la dirección."
            headingId="campos-heading"
          />
          <ScrollReveal className="ag-ikigai-diagram-wrap" density="default">
            <figure className="ag-ikigai-diagram">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LANDING_IMAGES.ikigaiDiagram}
                alt="Diagrama clásico de IKIGAI con cuatro círculos. En MK sirve como referencia histórica, no como mecánica del producto."
                className="ag-ikigai-diagram__img"
                width={1024}
                height={1024}
              />
              <figcaption className="ag-ikigai-diagram__caption hud-text">
                El diagrama clásico organiza ideas. No es un test que debas completar.
              </figcaption>
            </figure>
          </ScrollReveal>
          <ScrollStaggerContainer
            className="ag-ikigai-fields"
            stagger={MOTION_STAGGER.base}
            itemCount={IKIGAI_FIELDS.length}
          >
            {IKIGAI_FIELDS.map((field) => (
              <StaggerItem key={field.num} distance={MOTION_DISTANCE.sm + 2}>
                <article className="ag-ikigai-field">
                  <div className="ag-ikigai-field__head">
                    <span className="ag-ikigai-field__num font-display-xl" aria-hidden>
                      {field.num}
                    </span>
                    <div className="ag-ikigai-field__icon" aria-hidden>
                      <AppIcon name={field.icon} size={18} />
                    </div>
                  </div>
                  <h3 className="ag-ikigai-field__label font-headline-sm">{field.label}</h3>
                  <p className="ag-ikigai-field__question font-body-md">{field.question}</p>
                  <p className="ag-ikigai-field__body font-body-md">{field.body}</p>
                </article>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
          <ScrollReveal className="ag-ikigai-section-close" density="tight">
            <p className="font-body-lg">
              No necesitas completar perfectamente cuatro círculos. El resultado es una hipótesis de
              dirección que puedes contrastar.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 4. SU LUGAR DENTRO DE MK — después del modelo, antes de las fracturas */}
      <section className="ag-section-inner ag-about-block ag-about-block--dark" aria-labelledby="place-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="DENTRO DE MK"
            title="Una pieza del Marco Central."
            lead="El IKIGAI pertenece al pilar Espíritu. Responde a la pregunta que da sentido a las demás capacidades: ¿por qué vale la pena utilizar tu mente, tu cuerpo, tu tiempo y tus recursos?"
            headingId="place-heading"
          />
          <ScrollReveal className="ag-ikigai-place" density="default">
            <p className="font-body-md ag-ikigai-place__intro">
              <span className="ag-ikigai-place__intro--full">
                En el Marco Central pertenece al pilar Espíritu, junto al linaje, la visión, los
                valores y la huella. Este ejercicio todavía no escribe en el resto del sistema.
              </span>
              <span className="ag-ikigai-place__intro--short">
                En el Marco Central pertenece al pilar Espíritu. Este ejercicio todavía no escribe en
                el resto del sistema.
              </span>
            </p>
            <ol className="ag-ikigai-place__path" aria-label="Orden de los pilares del Marco Central">
              {MK_PILLAR_PATH.map((name) => (
                <li
                  key={name}
                  className={`ag-ikigai-place__chip${name === 'IKIGAI' ? ' ag-ikigai-place__chip--focus' : ''}`}
                >
                  <span className="font-label-lg">{name}</span>
                </li>
              ))}
            </ol>
            <div className="ag-ikigai-place__cta">
              <Link href="/marco-central" className="ag-inline-link font-label-lg">
                Ver el Marco Central
                <AppIcon name="arrow-right" size={14} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. FORMAS DE DESALINEACIÓN */}
      <section className="ag-section-inner ag-about-block ag-about-block--dark" aria-labelledby="tension-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="DESALINEACIÓN"
            title="Cuatro círculos desequilibrados dejan una dirección incompleta."
            lead="Estos son ejemplos de desequilibrio. El ejercicio no diagnostica fracturas automáticas."
            headingId="tension-heading"
          />
          <ScrollReveal className="ag-ikigai-tensions" density="default">
            <ol className="ag-ikigai-tensions__list">
              {TENSIONS.map((item, index) => (
                <li key={item.title} className="ag-ikigai-tensions__item">
                  <span className="ag-ikigai-tensions__index" aria-hidden>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="ag-ikigai-tensions__copy">
                    <h3 className="ag-ikigai-tensions__title font-headline-sm">{item.title}</h3>
                    <p className="ag-ikigai-tensions__body font-body-md">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="font-body-lg ag-ikigai-tensions__close">
              Sirven para pensar. El mapa no convierte estos ejemplos en un diagnóstico automático.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 6. QUÉ NO ES */}
      <section className="ag-section-inner ag-about-block" aria-labelledby="no-es-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="CLARIFICACIONES"
            title="Antes de construirlo, conviene eliminar algunas confusiones."
            headingId="no-es-heading"
          />
          <ScrollReveal className="ag-ikigai-not" density="default">
            <ul className="ag-ikigai-not__list">
              {IKIGAI_NOT.map((item) => (
                <li key={item.title} className="ag-ikigai-not__item">
                  <h3 className="ag-ikigai-not__title font-headline-sm">{item.title}</h3>
                  <p className="ag-ikigai-not__body font-body-md">{item.body}</p>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* 7. CÓMO SE TRABAJA */}
      <section className="ag-section-inner ag-about-block ag-about-block--dark" aria-labelledby="proceso-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="CÓMO SE TRABAJA"
            title="Del concepto a una hipótesis que puede ponerse a prueba."
            lead="El ejercicio ayuda a ordenar, conectar, formular y contrastar una dirección. No entrega una revelación instantánea."
            headingId="proceso-heading"
          />
          <ScrollStaggerContainer
            className="ag-about-journey ag-ikigai-process"
            stagger={MOTION_STAGGER.base}
            itemCount={IKIGAI_PROCESS.length}
          >
            {IKIGAI_PROCESS.map((step) => (
              <StaggerItem key={step.num} className="ag-about-journey__step" distance={MOTION_DISTANCE.sm + 2}>
                <span className="ag-about-journey__num hud-text">{step.num}</span>
                <div className="ag-ikigai-process__copy">
                  <h3 className="ag-about-journey__title">{step.title}</h3>
                  <p className="ag-about-journey__body font-body-md">{step.body}</p>
                </div>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>

      {/* 8. QUÉ RESULTADO OBTIENES */}
      <section className="ag-section-inner ag-about-block" aria-labelledby="result-heading">
        <div className="ag-container">
          <SectionIntro
            eyebrow="RESULTADO"
            title="No recibes una etiqueta. Obtienes un mapa de dirección."
            headingId="result-heading"
          />
          <ScrollStaggerContainer
            className="ag-ikigai-result"
            stagger={MOTION_STAGGER.base}
            itemCount={RESULT_ITEMS.length}
          >
            {RESULT_ITEMS.map((item, index) => (
              <StaggerItem key={item.title} distance={MOTION_DISTANCE.sm}>
                <article className="ag-ikigai-result__item">
                  <span className="ag-ikigai-result__index" aria-hidden>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="ag-ikigai-result__copy">
                    <h3 className="ag-ikigai-result__title font-headline-sm">{item.title}</h3>
                    <p className="ag-ikigai-result__body font-body-md">{item.body}</p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
          <ScrollReveal className="ag-ikigai-result__integration" density="tight">
            <p className="font-body-lg">
              Sales con un mapa para pensar y con un experimento escrito por ti. El resto del sistema
              MK no se actualiza con este ejercicio.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 9. NO TERMINA EN EL EJERCICIO */}
      <section className="ag-section-inner ag-about-block ag-about-block--dark" aria-labelledby="decisions-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="DESPUÉS DEL EJERCICIO"
            title="Una dirección debe modificar decisiones."
            lead="Puedes usar este mapa para pensar en:"
            headingId="decisions-heading"
          />
          <ScrollReveal className="ag-ikigai-decisions" density="default">
            <ul className="ag-ikigai-decisions__list">
              {DECISION_AREAS.map((area) => (
                <li key={area} className="font-label-lg">
                  {area}
                </li>
              ))}
            </ul>
            <p className="font-body-lg ag-ikigai-decisions__close">
              Cuando aparece una oportunidad, puedes mirar si desarrolla tus capacidades, contribuye
              a algo necesario, puede sostenerse y se aproxima a la vida que quieres construir.
            </p>
            <p className="font-body-md ag-ikigai-decisions__note">
              No toma decisiones por ti. Te deja un criterio más claro para tomarlas.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 10. PRIMER PASO */}
      <SubpageCta
        eyebrow="MK · MAPA"
        title="Construye tu mapa de dirección."
        lead="Empieza por ordenar las piezas. Explora lo que amas, en lo que eres bueno, lo que el mundo necesita y por lo que te pueden pagar."
        ctaLabel="Empezar mi mapa"
        ctaHref="/ikigai/empezar"
      />
    </div>
  );
}
