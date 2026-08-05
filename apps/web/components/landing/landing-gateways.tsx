'use client';

import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { MOTION_DISTANCE, MOTION_STAGGER } from '@/components/motion/tokens';
import { StickyStatue } from '@/components/landing/sticky-statue';
import { LANDING_IMAGES } from '@/lib/assets';
import { LANDING_GATEWAYS, LANDING_GATEWAYS_CLOSE, LANDING_GATEWAYS_INTRO } from '@/lib/landing-copy';

/**
 * Bloque 5: puertas de entrada (antes "Perfiles"). La estatua rota vuelve a ser
 * protagonista en el momento emocional de la home, después de que el producto ya es claro.
 */
export function LandingGateways() {
  return (
    <section id="perfiles" className="ag-crisis-section relative">
      <StickyStatue
        src={LANDING_IMAGES.statueBroken}
        alt="Estatua agrietada"
        imgOpacity={0.7}
        gradientDir="to-b"
        gradientFrom="#0e0e0e"
        gradientVia="transparent"
        gradientTo="#0e0e0e"
        variant="crisis"
      />
      <div className="ag-crisis-content relative z-10">
        <div className="ag-container mx-auto w-full max-w-6xl">
          <ScrollReveal className="ag-crisis-intro text-center" density="spacious">
            <p className="hud-text text-action-red">{LANDING_GATEWAYS_INTRO.eyebrow}</p>
            <h2 className="ag-crisis-title ag-type-section text-white">
              {LANDING_GATEWAYS_INTRO.title}
            </h2>
            <p className="ag-crisis-lead font-body-lg text-white/75">{LANDING_GATEWAYS_INTRO.lead}</p>
          </ScrollReveal>

          <ScrollStaggerContainer
            className="ag-profile-grid"
            stagger={MOTION_STAGGER.base}
            itemCount={LANDING_GATEWAYS.length}
          >
            {LANDING_GATEWAYS.map((card, index) => (
              <StaggerItem
                key={card.num}
                className="ag-profile-grid__item"
                distance={MOTION_DISTANCE.sm + 2}
                offsetX={index % 2 === 0 ? -10 : 10}
              >
                <article className="ag-panel ag-panel--marco ag-profile-card group h-full">
                  <span className="ag-panel__corner ag-panel__corner--hover" aria-hidden />
                  <p className="ag-profile-card__index hud-text text-action-red">{card.num}</p>
                  <h3 className="ag-profile-card__title ag-panel__card-title">{card.title}</h3>
                  <p className="ag-profile-card__body font-body-md">{card.body}</p>
                </article>
              </StaggerItem>
            ))}
          </ScrollStaggerContainer>

          <ScrollReveal className="ag-landing-profiles__close text-center" density="tight">
            <p className="font-body-lg text-white/80">{LANDING_GATEWAYS_CLOSE}</p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
