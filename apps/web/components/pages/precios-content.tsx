'use client';

import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { MOTION_DISTANCE, MOTION_STAGGER } from '@/components/motion/tokens';
import { FaqAccordionItem } from '@/components/pages/faq-accordion-item';
import { SectionIntro } from '@/components/pages/section-intro';
import { SubpageCta } from '@/components/pages/subpage-cta';
import { PreciosOffer } from '@/components/precios/precios-offer';
import { apiBillingPlans } from '@/lib/api';
import { getPreciosFaqItems } from '@/lib/precios-faq';
import { DEFAULT_TRIAL_DAYS } from '@/lib/use-trial-days';

const TRIAL_STEPS: ReadonlyArray<{ num: string; title: string; body: (days: number) => string }> = [
  {
    num: '01',
    title: 'Te registras hoy',
    body: () => 'Creas tu cuenta de fundador y reservas tu acceso anticipado.',
  },
  {
    num: '02',
    title: 'Esperas el lanzamiento',
    body: () =>
      'Cuando abramos la plataforma, usas diagnóstico, Perfil Maestro y Ruta bajo la misma cuenta.',
  },
  {
    num: '03',
    title: 'Eliges cómo pagar',
    body: (days) =>
      `Al activarse la plataforma, dispones de ${days} días de prueba y eliges la frecuencia de cobro. Sin renovación sorpresa.`,
  },
];

export function PreciosContent() {
  const reduced = useReducedMotion();
  const [trialDays, setTrialDays] = useState(DEFAULT_TRIAL_DAYS);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    apiBillingPlans()
      .then((res) => setTrialDays(res.trialDays))
      .catch(() => {});
  }, []);

  const faqItems = useMemo(() => getPreciosFaqItems(trialDays), [trialDays]);

  return (
    <div className="ag-landing ag-page ag-precios-page flex min-h-full flex-col antialiased">
      <section className="ag-section-inner ag-precios-open" aria-labelledby="planes-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="PRECIOS"
            title="Acceso anticipado de fundador."
            lead="Reserva tu cuenta hoy sin cobro. Al lanzamiento eliges cada cuánto pagas; si adelantas, el precio por mes baja."
            headingId="planes-heading"
          />
          <PreciosOffer />
        </div>
      </section>

      <section
        className="ag-section-inner ag-about-block ag-about-block--dark"
        aria-labelledby="prueba-heading"
      >
        <div className="ag-container ag-container--narrow">
          <SectionIntro eyebrow="LA PRUEBA" title="Sin letra chica." headingId="prueba-heading" />
          <ScrollStaggerContainer
            className="ag-base-bridge__list"
            stagger={MOTION_STAGGER.base}
            itemCount={TRIAL_STEPS.length}
          >
            {TRIAL_STEPS.map((step, index) => (
              <StaggerItem
                key={step.num}
                className="ag-base-bridge__item"
                distance={MOTION_DISTANCE.sm + 2}
              >
                <span className="ag-base-bridge__node" aria-hidden />
                <p className="ag-base-bridge__step-num hud-text text-action-red">{step.num}</p>
                {index < TRIAL_STEPS.length - 1 ? (
                  <span className="ag-base-bridge__line" aria-hidden />
                ) : null}
                <div className="ag-base-bridge__detail">
                  <h3 className="ag-base-bridge__title ag-type-item text-white">{step.title}</h3>
                  <p className="ag-base-bridge__body font-body-md">{step.body(trialDays)}</p>
                </div>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>

      <section className="ag-faq-section ag-section-inner" aria-labelledby="precios-faq-heading">
        <div className="ag-container ag-container--narrow">
          <SectionIntro
            eyebrow="PREGUNTAS"
            title="Cobro, prueba y plazos."
            lead="Lo esencial antes de reservar tu acceso."
            headingId="precios-faq-heading"
          />
          <ScrollStaggerContainer
            className="ag-faq-list"
            stagger={MOTION_STAGGER.base}
            itemCount={faqItems.length}
          >
            {faqItems.map((item, index) => (
              <StaggerItem key={item.id} distance={MOTION_DISTANCE.sm}>
                <FaqAccordionItem
                  id={`precios-${item.id}`}
                  question={item.question}
                  answer={item.answer}
                  isOpen={openFaqIndex === index}
                  reduced={reduced ?? false}
                  onToggle={() =>
                    setOpenFaqIndex((current) => (current === index ? null : index))
                  }
                />
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>

      <SubpageCta
        title="Reserva tu acceso de fundador."
        lead="Crea tu cuenta hoy. El diagnóstico y el producto se activan en el lanzamiento."
      />
    </div>
  );
}
