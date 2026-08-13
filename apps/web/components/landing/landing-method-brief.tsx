'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AppIcon } from '@/components/app-icon';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { MOTION_DISTANCE, MOTION_STAGGER } from '@/components/motion/tokens';
import { LANDING_IMAGES } from '@/lib/assets';
import { LANDING_DOMAINS_SECTION, LANDING_REALMS, LANDING_REALMS_CLOSE } from '@/lib/landing-copy';

/**
 * Bloque 4: mapa breve de la Arquitectura del Sentido (3 pilares + 4 ámbitos).
 * La matriz completa de doce celdas vive en /marco-central.
 */
export function LandingMethodBrief() {
  return (
    <section
      id="metodo"
      className="ag-section-inner ag-os-section ag-os-head relative overflow-hidden"
      aria-labelledby="metodo-heading"
    >
      <div className="ag-os-head__bg-wrap pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={LANDING_IMAGES.bgArquitecturaSentido}
          alt=""
          fill
          sizes="100vw"
          loading="lazy"
          className="ag-os-head__bg-img"
        />
      </div>
      <div className="ag-os-head__scrim pointer-events-none absolute inset-0" aria-hidden />
      <div className="ag-container relative z-10 mx-auto">
        <ScrollReveal className="ag-os-intro text-center" density="spacious">
          <p className="hud-text text-action-red">{LANDING_DOMAINS_SECTION.eyebrow}</p>
          <h2 id="metodo-heading" className="ag-type-display text-white">
            {LANDING_DOMAINS_SECTION.title}
          </h2>
        </ScrollReveal>

        <div className="ag-mk-alignment">
          <ScrollStaggerContainer
            className="ag-mk-realms"
            stagger={MOTION_STAGGER.base}
            itemCount={LANDING_REALMS.length}
          >
            {LANDING_REALMS.map((realm) => (
              <StaggerItem key={realm.label} className="ag-mk-realm" distance={MOTION_DISTANCE.sm + 2}>
                <div className="ag-mk-realm__node" aria-hidden />
                <span className="ag-mk-realm__index hud-text" aria-hidden>
                  {realm.num}
                </span>
                <div className="ag-mk-realm__icon" aria-hidden>
                  <AppIcon name={realm.icon} size={22} />
                </div>
                <span className="ag-mk-realm__label font-headline-sm">{realm.label}</span>
                <span className="ag-mk-realm__symbol hud-text">{realm.symbol}</span>
                <p className="ag-mk-realm__body font-body-md">{realm.body}</p>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>
          <ScrollReveal className="ag-landing-realms-close" density="tight">
            <p className="font-body-lg text-center text-white/75">{LANDING_REALMS_CLOSE}</p>
          </ScrollReveal>
        </div>

        <ScrollReveal className="ag-mk-domains-section" density="default">
          <div className="ag-mk-domains-section__head">
            <p className="hud-text text-action-red">{LANDING_DOMAINS_SECTION.territoriesLabel}</p>
          </div>
          <p className="ag-mk-territories font-headline-sm" aria-label="Cuatro territorios">
            {LANDING_DOMAINS_SECTION.territories.map((label, index) => (
              <span key={label} className="ag-mk-territories__item">
                {index > 0 ? <span className="ag-mk-territories__sep" aria-hidden> · </span> : null}
                {label}
              </span>
            ))}
          </p>
          <p className="ag-mk-domains-section__lead font-body-md">
            <span className="ag-mk-domains-section__lead--full">{LANDING_DOMAINS_SECTION.leadClose}</span>
            <span className="ag-mk-domains-section__lead--short">{LANDING_DOMAINS_SECTION.leadCloseMobile}</span>
          </p>
          <div className="ag-mk-domains-section__link">
            <Link href={LANDING_DOMAINS_SECTION.linkHref} className="ag-marco-more__link font-label-lg">
              {LANDING_DOMAINS_SECTION.linkLabel}
              <AppIcon name="arrow-right" size={16} />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
