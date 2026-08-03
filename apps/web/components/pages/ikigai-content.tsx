'use client';

import Link from 'next/link';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
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
    icon: 'flame',
    question: '¿Qué actividades te conectan profundamente con lo que haces?',
    body: 'No se limita a aquello que resulta fácil o entretenido. Incluye acciones que siguen teniendo significado incluso cuando demandan esfuerzo, paciencia o aprendizaje.',
  },
  {
    num: '02',
    label: 'En lo que eres bueno',
    icon: 'target',
    question: '¿Qué capacidades posees o podrías desarrollar hasta alcanzar excelencia?',
    body: 'Incluye competencias actuales, patrones de aprendizaje, fortalezas reconocidas y habilidades que muestran potencial real. El talento no se presenta aquí como algo exclusivamente innato.',
  },
  {
    num: '03',
    label: 'Lo que otros necesitan',
    icon: 'globe',
    question: '¿Dónde pueden tus capacidades producir valor más allá de ti mismo?',
    body: 'El propósito adquiere profundidad cuando lo que desarrollas puede resolver, construir, proteger, enseñar o mejorar algo para otras personas. Esa contribución puede comenzar en una familia, un equipo, una comunidad, una organización o un problema concreto.',
  },
  {
    num: '04',
    label: 'Lo que puede sostenerte',
    icon: 'briefcase',
    question: '¿De qué manera esa contribución puede formar parte de una vida sostenible?',
    body: 'El propósito no debe ignorar la realidad material. Esta dimensión analiza si una capacidad puede transformarse en trabajo, intercambio, estabilidad o recursos. No se reduce únicamente a “¿por qué te pagarían?”.',
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
    title: 'Sostenibilidad sin propósito',
    body: 'Puedes construir una vida económicamente funcional que, sin embargo, se siente desconectada de tus valores y tu dirección.',
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
    title: 'Registras',
    body: 'Identificas actividades y experiencias concretas relacionadas con cada campo. No se aceptan únicamente conceptos abstractos como “ayudar” o “crecer”. Deben convertirse en acciones observables: enseñar, construir, diseñar, dirigir, cuidar, investigar o entrenar.',
  },
  {
    num: '02',
    title: 'Evalúas',
    body: 'Analizas cada actividad según su nivel de significado, capacidad, contribución y sostenibilidad. Las escalas ayudan a comparar y ordenar información, pero no reemplazan tu reflexión.',
  },
  {
    num: '03',
    title: 'Relacionas',
    body: 'Contrastas actividades entre campos. El sistema te ayuda a ver coincidencias, campos débiles, contradicciones y patrones que se repiten. Aparecen desalineación, tensión, áreas poco desarrolladas e hipótesis todavía no comprobadas.',
  },
  {
    num: '04',
    title: 'Formulas',
    body: 'Construyes uno o varios ejes posibles de propósito. El resultado puede ser una dirección, un patrón o una combinación de actividades, no necesariamente una profesión única.',
  },
  {
    num: '05',
    title: 'Contrastas',
    body: 'La dirección se confronta con decisiones, proyectos y experiencia real. El propósito se fortalece cuando puede sostenerse fuera del ejercicio y modificar la forma en que actúas.',
  },
  {
    num: '06',
    title: 'Integras',
    body: 'El resultado se integra al Perfil Maestro junto al resto de pilares del Espíritu, del linaje a la huella.',
  },
];

const RESULT_ITEMS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: 'Actividades con mayor convergencia',
    body: 'Acciones que muestran una relación fuerte entre significado, capacidad, contribución y sostenibilidad.',
  },
  {
    title: 'Campos más desarrollados',
    body: 'Dimensiones que ya poseen evidencia y pueden funcionar como punto de apoyo.',
  },
  {
    title: 'Tensiones principales',
    body: 'Relaciones que todavía no están resueltas o que requieren exploración.',
  },
  {
    title: 'Hipótesis de propósito',
    body: 'Direcciones posibles que deben contrastarse mediante decisiones y experiencia.',
  },
  {
    title: 'Próximos movimientos',
    body: 'Acciones concretas para desarrollar una capacidad, validar una contribución o comprobar su sostenibilidad.',
  },
];

const DECISION_AREAS = [
  'Proyectos',
  'Formación',
  'Trabajo',
  'Uso del tiempo',
  'Decisiones económicas',
  'Contribución',
  'Prioridades de la Ruta MK',
] as const;

export function IkigaiContent() {
  return (
    <div className="ag-landing ag-page ag-ikigai-page flex min-h-full flex-col antialiased">
      {/* 1. HERO */}
      <section className="ag-about-hero ag-ikigai-hero relative overflow-hidden">
        <div className="ag-about-hero__bg-wrap" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LANDING_IMAGES.ikigaiHero} alt="" className="ag-about-hero__bg ag-ikigai-hero__bg" />
        </div>
        <div className="ag-about-hero__scrim" aria-hidden />
        <div className="ag-about-hero__content ag-container relative z-10">
          <ScrollReveal className="ag-about-hero__intro text-center" distance={16}>
            <p className="hud-text text-action-red">ESPÍRITU</p>
            <h1 className="ag-about-hero__title ag-type-display text-white">IKIGAI: tu razón de ser.</h1>
            <p className="ag-about-hero__origin font-body-lg">
              No es una vocación de revista ni una frase para redes. Es la intersección entre lo que
              amas, lo que sabes hacer, lo que el mundo necesita de ti y aquello que puede sostener
              tu vida.
            </p>
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
          <ScrollReveal className="ag-ikigai-why" distance={12}>
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
            eyebrow="LA INTERSECCIÓN"
            title="Cuatro campos. Un eje posible."
            lead="El IKIGAI se construye contrastando actividades reales desde cuatro perspectivas. No se trata de imaginar conceptos abstractos, sino de observar dónde tu experiencia comienza a mostrar coincidencias."
            headingId="campos-heading"
          />
          <ScrollReveal className="ag-ikigai-diagram-wrap" distance={14}>
            <figure className="ag-ikigai-diagram">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LANDING_IMAGES.ikigaiDiagram}
                alt="Diagrama IKIGAI: la intersección entre lo que amas, en lo que eres bueno, lo que otros necesitan y lo que puede sostenerte. En el centro: IKIGAI."
                className="ag-ikigai-diagram__img"
                width={1024}
                height={1024}
              />
              <figcaption className="ag-ikigai-diagram__caption hud-text">
                Cuatro campos. Un eje posible.
              </figcaption>
            </figure>
          </ScrollReveal>
          <ScrollStaggerContainer className="ag-ikigai-fields" stagger={0.07}>
            {IKIGAI_FIELDS.map((field) => (
              <StaggerItem key={field.num} distance={12}>
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
          <ScrollReveal className="ag-ikigai-section-close" distance={10}>
            <p className="font-body-lg">
              El centro no siempre aparece como una respuesta perfecta. A veces aparece como una
              dirección suficientemente sólida para comenzar a probar.
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
          <ScrollReveal className="ag-ikigai-place" distance={14}>
            <p className="font-body-md ag-ikigai-place__intro">
              No funciona solo. Se lee junto al resto de pilares del Espíritu: del linaje a la huella.
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
            title="Cuando falta un campo, aparece una fractura."
            lead="Las cuatro dimensiones deben observarse juntas. Una sola no basta para sostener una dirección."
            headingId="tension-heading"
          />
          <ScrollReveal className="ag-ikigai-tensions" distance={14}>
            <ol className="ag-ikigai-tensions__list">
              {TENSIONS.map((item, index) => (
                <li key={item.title} className="ag-ikigai-tensions__item">
                  <span className="ag-ikigai-tensions__index hud-text" aria-hidden>
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
              MK no busca una coincidencia perfecta. Busca mostrar qué relación está fuerte, cuál
              está ausente y qué debe ponerse a prueba.
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
          <ScrollReveal className="ag-ikigai-not" distance={12}>
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
            lead="El sistema ayuda a construir, ordenar, contrastar e integrar una dirección. No entrega una revelación instantánea."
            headingId="proceso-heading"
          />
          <ol className="ag-base-bridge__list">
            {IKIGAI_PROCESS.map((step, index) => (
              <ScrollReveal key={step.num} className="ag-base-bridge__item" distance={12}>
                <span className="ag-base-bridge__node" aria-hidden />
                <p className="ag-base-bridge__step-num hud-text text-action-red">{step.num}</p>
                {index < IKIGAI_PROCESS.length - 1 ? (
                  <span className="ag-base-bridge__line" aria-hidden />
                ) : null}
                <div className="ag-base-bridge__detail">
                  <h3 className="ag-base-bridge__title ag-type-item text-white">{step.title}</h3>
                  <p className="ag-base-bridge__body font-body-md">{step.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </ol>
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
          <ScrollStaggerContainer className="ag-ikigai-result" stagger={0.06}>
            {RESULT_ITEMS.map((item) => (
              <StaggerItem key={item.title} distance={10}>
                <article className="ag-ikigai-result__item">
                  <h3 className="ag-ikigai-result__title font-headline-sm">{item.title}</h3>
                  <p className="ag-ikigai-result__body font-body-md">{item.body}</p>
                </article>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
          <ScrollReveal className="ag-ikigai-result__integration" distance={12}>
            <p className="font-body-lg">
              Tu mapa de IKIGAI se integra al Perfil Maestro y deja de ser un ejercicio aislado.
              Se convierte en referencia para prioridades y decisiones.
            </p>
            <p className="font-body-md ag-ikigai-result__depth">
              Con el tiempo, ese trabajo también alimenta el Índice de profundidad de tu Perfil
              Maestro: evidencia del trabajo interior acumulado, no una calificación de tu propósito.
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
            lead="El sistema usa tu IKIGAI para ayudarte a evaluar:"
            headingId="decisions-heading"
          />
          <ScrollReveal className="ag-ikigai-decisions" distance={12}>
            <ul className="ag-ikigai-decisions__list">
              {DECISION_AREAS.map((area) => (
                <li key={area} className="font-label-lg">
                  {area}
                </li>
              ))}
            </ul>
            <p className="font-body-lg ag-ikigai-decisions__close">
              Cuando aparece una oportunidad, el sistema no pregunta únicamente si es atractiva o
              rentable. Permite observar si desarrolla tus capacidades, contribuye a algo necesario,
              puede sostenerse y se aproxima a la vida que declaraste construir.
            </p>
            <p className="font-body-md ag-ikigai-decisions__note">
              No toma decisiones por ti. Te da un criterio más sólido para tomarlas.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 10. PRIMER PASO */}
      <SubpageCta />
    </div>
  );
}
