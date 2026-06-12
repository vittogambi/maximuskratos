'use client';

import { ContactForm } from '@/components/contact-form';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { LANDING_IMAGES } from '@/lib/assets';

const CONTACT_PROMPTS = [
  '¿Tienes una pregunta sobre Maximus Kratos?',
  '¿Quieres seguir de cerca el desarrollo?',
  '¿Representas una empresa o alianza?',
] as const;

export function ContactoContent() {
  return (
    <div className="ag-landing ag-page ag-contact-page flex min-h-full flex-col antialiased">
      <section className="ag-contact-section ag-section-inner">
        <div className="ag-contact-section__bg-wrap" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LANDING_IMAGES.statueSovereign}
            alt=""
            className="ag-contact-section__bg"
          />
          <div className="ag-contact-section__scrim" />
        </div>

        <div className="ag-container ag-contact-layout relative z-10">
          <div className="ag-contact-info">
            <ScrollReveal distance={16}>
              <p className="hud-text text-action-red">MK · CONTACTO</p>
              <h1
                className="ag-contact-info__title font-display-xl text-white"
                style={{ fontSize: 'clamp(2.25rem, 6vw, 4rem)' }}
              >
                Hablemos.
              </h1>
              <p className="ag-contact-info__lead font-body-lg">
                ¿Tienes preguntas sobre Maximus Kratos? Estamos construyendo la plataforma y
                queremos escucharte.
              </p>
            </ScrollReveal>

            <ScrollReveal distance={12} delay={0.06}>
              <p className="hud-text ag-contact-info__reasons-label">Motivos de contacto</p>
              <ul className="ag-about-problem ag-contact-prompts">
                {CONTACT_PROMPTS.map((item) => (
                  <li key={item} className="font-body-md">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="ag-contact-info__closing font-body-md">Escríbenos.</p>
            </ScrollReveal>
          </div>

          <ScrollReveal className="ag-contact-form-wrap" distance={14} delay={0.1}>
            <div className="ag-panel ag-contact-form-panel">
              <p className="hud-text mb-4 text-action-red">MENSAJE</p>
              <h2 className="ag-contact-form-panel__title font-headline-md text-white">
                Envíanos un mensaje
              </h2>
              <ContactForm
                className="ag-contact-form"
                submitClassName="ag-btn-primary font-label-lg"
                showReason
              />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
