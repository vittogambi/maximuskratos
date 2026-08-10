'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { AppIcon } from '@/components/app-icon';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { MOTION_DURATION, MOTION_EASE } from '@/components/motion/tokens';
import { LANDING_IMAGES } from '@/lib/assets';
import {
  LANDING_HOW_IT_WORKS,
  LANDING_HOW_IT_WORKS_CLOSE,
  LANDING_HOW_IT_WORKS_INTRO,
} from '@/lib/landing-copy';

const PHASE_IMAGES = {
  phase01: LANDING_IMAGES.phase01,
  phase02: LANDING_IMAGES.phase02,
  phase03: LANDING_IMAGES.phase03,
  phase05: LANDING_IMAGES.phase05,
} as const;

/** Bloque 2 de la home: los cuatro actos del lema, ligados a pantallas reales del producto. */
export function LandingHowItWorks() {
  const reduced = useReducedMotion();

  return (
    <section id="funcionamiento" className="ag-section-inner ag-os-section">
      <div className="ag-container relative z-10 mx-auto">
        <ScrollReveal className="ag-landing-method-head text-center" density="default">
          <p className="hud-text text-action-red">{LANDING_HOW_IT_WORKS_INTRO.eyebrow}</p>
          <h2 className="ag-type-section text-white">{LANDING_HOW_IT_WORKS_INTRO.title}</h2>
        </ScrollReveal>

        <div className="ag-os-phases">
          {LANDING_HOW_IT_WORKS.map((step, index) => {
            const reverse = index % 2 === 1;
            return (
              <ScrollReveal key={step.num} className="ag-phase-row" density="spacious">
                {/* Mobile: always image → text. Desktop: zigzag via lg:order. */}
                <div className={`ag-phase-media relative${reverse ? ' lg:order-2' : ''}`}>
                  <div className="absolute -inset-4 hidden border border-white/10 lg:block" />
                  <motion.div
                    className="ag-phase-media__scale"
                    initial={reduced ? false : { scale: 1.02 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{
                      type: 'tween',
                      duration: MOTION_DURATION.reveal,
                      ease: MOTION_EASE.enter,
                    }}
                  >
                    <Image
                      src={PHASE_IMAGES[step.imageKey]}
                      alt={step.title}
                      width={1280}
                      height={800}
                      sizes="(max-width: 1023px) 100vw, 50vw"
                      className="h-auto w-full border border-white/5 object-cover opacity-85 mix-blend-lighten grayscale-[0.2]"
                    />
                  </motion.div>
                </div>
                <div className={`ag-panel ag-panel--phase${reverse ? ' lg:order-1' : ''}`}>
                  <div className="hud-text mb-4 text-action-red">
                    {step.num} · {step.eyebrow}
                  </div>
                  <h3 className="ag-panel__title font-headline-md">{step.title}</h3>
                  <p className="ag-panel__body font-body-md">{step.body}</p>
                  <p className="ag-phase-platform hud-text">{step.platform}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal className="ag-landing-method-close text-center" density="tight">
          <p className="font-body-lg text-white/80">{LANDING_HOW_IT_WORKS_CLOSE.body}</p>
          <Link href={LANDING_HOW_IT_WORKS_CLOSE.link.href} className="ag-inline-link font-label-lg">
            {LANDING_HOW_IT_WORKS_CLOSE.link.label}
            <AppIcon name="arrow-right" size={14} />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
