'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { AuthCta } from '@/components/auth-cta';
import { PublicFooter } from '@/components/public-footer';
import { PublicNav } from '@/components/public-nav';
import { FaqAccordionItem } from '@/components/pages/faq-accordion-item';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { MOTION_DISTANCE, MOTION_DURATION, MOTION_EASE, MOTION_STAGGER } from '@/components/motion/tokens';
import { LandingHero } from '@/components/landing/landing-hero';
import { LandingHowItWorks } from '@/components/landing/landing-how-it-works';
import { LandingInsideMk } from '@/components/landing/landing-inside-mk';
import { LandingDifferentiation } from '@/components/landing/landing-differentiation';
import { LandingMethodBrief } from '@/components/landing/landing-method-brief';
import { LandingGateways } from '@/components/landing/landing-gateways';
import { LandingProductStatus } from '@/components/landing/landing-product-status';
import { LandingPrecios } from '@/components/landing/landing-precios';
import { applyLandingHashFromLocation } from '@/lib/landing-nav';
import { LANDING_IMAGES } from '@/lib/assets';
import { LANDING_FAQ_ITEMS } from '@/lib/landing-faq';
import { LANDING_CLOSE, LANDING_PRIMARY_CTA } from '@/lib/landing-copy';

export function AethelgardLanding() {
  const reduced = useReducedMotion();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    applyLandingHashFromLocation();
  }, []);

  return (
    <div
      className="ag-landing flex min-h-screen flex-col overflow-x-hidden antialiased"
      style={{ background: '#0e0e0e', color: '#e5e2e1' }}
    >
      <PublicNav />

      <div
        className="ag-hud pointer-events-none fixed inset-0 z-40 overflow-hidden"
        style={{ mixBlendMode: 'screen', opacity: 0.5 }}
      >
        <motion.div
          className="hud-line hud-line--left top-0 h-screen w-px origin-top"
          initial={reduced ? false : { scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={
            reduced
              ? { duration: 0 }
              : {
                  type: 'tween',
                  duration: MOTION_DURATION.heroMedia,
                  ease: MOTION_EASE.enter,
                  delay: 0.15,
                }
          }
        />
        <motion.div
          className="hud-line hud-line--right top-0 h-screen w-px origin-top"
          initial={reduced ? false : { scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={
            reduced
              ? { duration: 0 }
              : {
                  type: 'tween',
                  duration: MOTION_DURATION.heroMedia,
                  ease: MOTION_EASE.enter,
                  delay: 0.28,
                }
          }
        />
      </div>

      <main className="grow">
        <div className="relative w-full">
          {/* ── 1. Hero product-first ─────────────────────────────────── */}
          <LandingHero />

          {/* ── 2. Funcionamiento en cuatro actos ─────────────────────── */}
          <LandingHowItWorks />

          {/* ── 3. Dentro de Maximus Kratos ───────────────────────────── */}
          <LandingInsideMk />

          {/* ── 4. Diferenciación sin copy defensivo ──────────────────── */}
          <LandingDifferentiation />

          {/* ── 5. Método condensado ──────────────────────────────────── */}
          <LandingMethodBrief />

          {/* ── 6. Puertas de entrada ─────────────────────────────────── */}
          <LandingGateways />

          {/* ── 7. Estado del producto ────────────────────────────────── */}
          <LandingProductStatus />

          {/* ── 8. Precios ────────────────────────────────────────────── */}
          <LandingPrecios />
        </div>

        {/* ── 9a. FAQ ──────────────────────────────────────────────────── */}
        <section
          id="preguntas-frecuentes"
          className="ag-faq-section ag-section-inner"
          aria-labelledby="faq-heading"
        >
          <div className="ag-container ag-container--narrow">
            <ScrollReveal className="ag-faq-header text-center" density="spacious">
              <p className="hud-text text-action-red">MK · PREGUNTAS FRECUENTES</p>
              <h2
                id="faq-heading"
                className="ag-faq-header__title ag-type-section text-white"
              >
                Antes de dar el paso
              </h2>
              <p className="ag-faq-header__lead font-body-lg">
                Respuestas claras sobre qué es MK, para quién es y cómo empezar.
              </p>
            </ScrollReveal>

            <ScrollStaggerContainer
              className="ag-faq-list"
              stagger={MOTION_STAGGER.base}
              itemCount={LANDING_FAQ_ITEMS.length}
            >
              {LANDING_FAQ_ITEMS.map((item, index) => (
                <StaggerItem key={item.id} distance={MOTION_DISTANCE.sm}>
                  <FaqAccordionItem
                    id={item.id}
                    question={item.question}
                    answer={item.answer}
                    link={'link' in item ? item.link : undefined}
                    isOpen={openFaqIndex === index}
                    reduced={reduced ?? false}
                    onToggle={() =>
                      setOpenFaqIndex((current) => (current === index ? null : index))
                    }
                  />
                </StaggerItem>
              ))}
            </ScrollStaggerContainer>

            <ScrollReveal className="ag-faq-footer text-center" density="tight">
              <p className="ag-faq-footer__text font-body-md">
                ¿Otra duda?{' '}
                <Link href="/contacto" className="ag-faq-cta__link">
                  Escríbenos
                </Link>
                {' · '}
                <Link href="/manifiesto" className="ag-faq-cta__link">
                  Manifiesto
                </Link>
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ── 9b. CTA final ────────────────────────────────────────────── */}
        <section className="ag-cta-section ag-section-inner relative flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LANDING_IMAGES.bgCtaGateway}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              maxWidth: 'none',
              objectFit: 'cover',
              objectPosition: 'center 40%',
              opacity: 0.75,
              mixBlendMode: 'lighten',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(to top, #0e0e0e, rgba(14,14,14,0.55), transparent)',
            }}
          />
          <ScrollReveal className="ag-panel ag-panel--wide relative z-10 ag-founder-close" density="spacious">
            <p className="hud-text mb-6">{LANDING_CLOSE.eyebrow}</p>
            <h2 className="ag-cta-title ag-type-section text-white">
              {LANDING_CLOSE.title}
              <br />
              {LANDING_CLOSE.titleLine2}
            </h2>
            <p className="ag-landing-close-body font-body-lg text-white/75">{LANDING_CLOSE.body}</p>
            <div className="ag-cta-step relative">
              <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
              <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
              <span className="ag-cta-step__num" aria-hidden>01</span>
              <div className="ag-landing-close-step">
                <p className="hud-text text-action-red">{LANDING_CLOSE.stepEyebrow}</p>
                <h3 className="ag-type-item text-white">{LANDING_CLOSE.stepTitle}</h3>
                {LANDING_CLOSE.stepBody ? (
                  <p className="font-body-md text-white/65">{LANDING_CLOSE.stepBody}</p>
                ) : null}
              </div>
              <div className="ag-founder-close__primary">
                <AuthCta href={LANDING_PRIMARY_CTA.href} className="ag-btn-cta ag-founder-close__cta font-label-lg">
                  {LANDING_PRIMARY_CTA.labelAlt}
                </AuthCta>
                {LANDING_CLOSE.platformNote ? (
                  <p className="ag-landing-close-platform font-body-sm">{LANDING_CLOSE.platformNote}</p>
                ) : null}
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
