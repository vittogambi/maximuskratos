'use client';

import { useState } from 'react';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import { AuthCta } from '@/components/auth-cta';
import { ContactForm, type ContactReason } from '@/components/contact-form';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { LANDING_IMAGES } from '@/lib/assets';
import { LANDING_DIAGNOSTIC_CTA } from '@/lib/landing-copy';

const CONTACT_INTENTS: ReadonlyArray<{
  reason: ContactReason;
  icon: AppIconName;
  label: string;
  prompt: string;
}> = [
  {
    reason: 'consulta-general',
    icon: 'mail',
    label: 'Consulta general',
    prompt: '¿Tienes una pregunta sobre Maximus Kratos?',
  },
  {
    reason: 'seguimiento',
    icon: 'activity',
    label: 'Seguimiento del proyecto',
    prompt: '¿Quieres seguir de cerca el desarrollo de la plataforma?',
  },
  {
    reason: 'empresas',
    icon: 'building-2',
    label: 'Empresas y alianzas',
    prompt: '¿Representas una empresa o buscas una alianza?',
  },
  {
    reason: 'feedback',
    icon: 'crosshair',
    label: 'Feedback del producto',
    prompt: '¿Probaste el sistema y tienes observaciones?',
  },
];

const CONTACT_ASSURANCES: ReadonlyArray<{ icon: AppIconName; text: string }> = [
  { icon: 'mail', text: 'Respondemos en 24–48 horas hábiles.' },
  { icon: 'shield', text: 'Sin listas de spam. Tu correo solo se usa para responderte.' },
];

export function ContactoContent() {
  const [reason, setReason] = useState<ContactReason>(CONTACT_INTENTS[0].reason);

  return (
    <div className="ag-landing ag-page ag-contact-page flex min-h-full flex-col antialiased">
      <section className="ag-contact-section ag-section-inner">
        <div className="ag-contact-section__bg-wrap" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LANDING_IMAGES.contactoHero}
            alt=""
            className="ag-contact-section__bg"
          />
          <div className="ag-contact-section__scrim" />
        </div>

        <div className="ag-container ag-contact-layout relative z-10">
          <div className="ag-contact-info">
            <ScrollReveal distance={16}>
              <p className="hud-text text-action-red">MK · CONTACTO</p>
              <h1 className="ag-contact-info__title ag-type-display text-white">Hablemos.</h1>
              <p className="ag-contact-info__lead font-body-lg">
                Estamos construyendo la plataforma y respondemos en persona. Elige el motivo y
                cuéntanos en qué podemos ayudarte.
              </p>
            </ScrollReveal>

            <ScrollReveal distance={12} delay={0.06}>
              <p className="hud-text ag-contact-info__reasons-label">Motivos de contacto</p>
              <div
                className="ag-contact-intents"
                role="group"
                aria-label="Selecciona el motivo de contacto"
              >
                {CONTACT_INTENTS.map((intent) => {
                  const active = intent.reason === reason;
                  return (
                    <button
                      key={intent.reason}
                      type="button"
                      className={`ag-contact-intent${active ? ' is-active' : ''}`}
                      aria-pressed={active}
                      onClick={() => setReason(intent.reason)}
                    >
                      <span className="ag-contact-intent__icon" aria-hidden>
                        <AppIcon name={intent.icon} size={18} />
                      </span>
                      <span className="ag-contact-intent__copy">
                        <span className="ag-contact-intent__label font-label-lg">
                          {intent.label}
                        </span>
                        <span className="ag-contact-intent__prompt font-body-md">
                          {intent.prompt}
                        </span>
                      </span>
                      <span className="ag-contact-intent__mark" aria-hidden>
                        <AppIcon name="check" size={14} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </ScrollReveal>

            <ScrollReveal distance={10} delay={0.1}>
              <ul className="ag-contact-assurances">
                {CONTACT_ASSURANCES.map((item) => (
                  <li key={item.text} className="ag-contact-assurances__item font-body-md">
                    <AppIcon name={item.icon} size={15} aria-hidden />
                    {item.text}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>

          <ScrollReveal className="ag-contact-form-wrap" distance={14} delay={0.1}>
            <div className="ag-panel ag-contact-form-panel">
              <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
              <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
              <p className="hud-text mb-4 text-action-red">MENSAJE</p>
              <h2 className="ag-contact-form-panel__title font-headline-md text-white">
                Envíanos un mensaje
              </h2>
              <ContactForm
                className="ag-contact-form"
                submitClassName="ag-btn-primary font-label-lg"
                showReason
                reason={reason}
                onReasonChange={setReason}
              />
            </div>

            <div className="ag-contact-alt">
              <p className="ag-contact-alt__lead font-body-md">
                ¿Prefieres ir directo al sistema? El diagnóstico inicial es el primer paso.
              </p>
              <AuthCta href={LANDING_DIAGNOSTIC_CTA.href} className="ag-contact-alt__link font-label-lg">
                {LANDING_DIAGNOSTIC_CTA.label}
                <AppIcon name="arrow-right" size={14} aria-hidden />
              </AuthCta>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
