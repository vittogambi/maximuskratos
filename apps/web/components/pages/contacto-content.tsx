'use client';

import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import { ContactForm } from '@/components/contact-form';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { LANDING_IMAGES } from '@/lib/assets';

const CONTACT_ITEMS: ReadonlyArray<{
  icon: AppIconName;
  label: string;
  desc: string;
}> = [
  {
    icon: 'stethoscope',
    label: 'Diagnóstico gratuito',
    desc: 'Acceso al diagnóstico completo sin costo de entrada.',
  },
  {
    icon: 'users',
    label: 'Acceso anticipado',
    desc: 'Forma parte del grupo fundador con beneficios exclusivos.',
  },
  {
    icon: 'briefcase',
    label: 'Empresas',
    desc: 'Programas para equipos directivos y líderes corporativos.',
  },
];

export function ContactoContent() {
  return (
    <div className="ag-landing ag-page flex min-h-full flex-col antialiased">
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
                Déjanos tu información y un miembro del equipo se pondrá en contacto contigo.
                También puedes registrarte directamente para acceder al diagnóstico gratuito.
              </p>
            </ScrollReveal>

            <ScrollStaggerContainer className="ag-contact-items" stagger={0.08}>
              {CONTACT_ITEMS.map((item) => (
                <StaggerItem key={item.label} distance={10}>
                  <div className="ag-panel ag-panel--marco ag-contact-item group">
                    <span className="ag-panel__corner ag-panel__corner--hover" aria-hidden />
                    <div className="ag-contact-item__head">
                      <div className="ag-marco-card__icon" aria-hidden>
                        <AppIcon name={item.icon} size={22} />
                      </div>
                      <div>
                        <p className="hud-text ag-contact-item__label">{item.label}</p>
                        <p className="ag-panel__card-body font-body-md">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </ScrollStaggerContainer>
          </div>

          <ScrollReveal className="ag-contact-form-wrap" distance={14} delay={0.1}>
            <div className="ag-panel ag-contact-form-panel">
              <p className="hud-text mb-4 text-action-red">MENSAJE</p>
              <h2 className="ag-contact-form-panel__title font-headline-md text-white">
                Envíanos un mensaje
              </h2>
              <ContactForm className="ag-contact-form" submitClassName="ag-btn-primary font-label-lg" />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
