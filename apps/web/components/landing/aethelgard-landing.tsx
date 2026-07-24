'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { AppIcon } from '@/components/app-icon';
import { HeroReveal, HeroRevealItem } from '@/components/motion/hero-reveal';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { AuthCta } from '@/components/auth-cta';
import { PublicFooter } from '@/components/public-footer';
import { PublicNav } from '@/components/public-nav';
import { TrialBadge } from '@/components/trial-badge';
import { MkDomainsBridge } from '@/components/pages/mk-domains-bridge';
import { applyLandingHashFromLocation } from '@/lib/landing-nav';
import { LANDING_IMAGES } from '@/lib/assets';
import { LANDING_FAQ_ITEMS } from '@/lib/landing-faq';
import { DOMAINS } from '@/lib/mk-system';
import {
  LANDING_BENEFITS,
  LANDING_CLOSE,
  LANDING_DIAGNOSTIC_CTA,
  LANDING_DOMAINS_SECTION,
  LANDING_HERO,
  LANDING_HERO_STATUS,
  LANDING_METHOD_STEPS,
  LANDING_PROBLEM,
  LANDING_PROFILES,
  LANDING_PROFILES_CLOSE,
  LANDING_REALMS,
  LANDING_REALMS_CLOSE,
  LANDING_WHAT_IS,
} from '@/lib/landing-copy';

const PHASE_IMAGES = {
  phase01: LANDING_IMAGES.phase01,
  phase02: LANDING_IMAGES.phase02,
  phase03: LANDING_IMAGES.phase03,
  phase04: LANDING_IMAGES.phase04,
  phase05: LANDING_IMAGES.phase05,
} as const;

function FaqItem({
  id,
  question,
  answer,
  link,
  isOpen,
  onToggle,
  reduced,
}: {
  id: string;
  question: string;
  answer: string;
  link?: { href: string; label: string };
  isOpen: boolean;
  onToggle: () => void;
  reduced: boolean;
}) {
  const answerId = `faq-answer-${id}`;

  return (
    <article className={`ag-faq-item${isOpen ? ' ag-faq-item--open' : ''}`}>
      <h3 className="ag-faq-item__heading" id={`faq-q-${id}`}>
        <button
          type="button"
          className="ag-faq-item__trigger"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={answerId}
        >
          <span className="ag-faq-item__question font-headline-sm">{question}</span>
          <motion.span
            className="ag-faq-item__chevron-wrap"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            aria-hidden
          >
            <AppIcon name="chevron-down" size={18} className="ag-faq-item__chevron" />
          </motion.span>
        </button>
      </h3>
      <motion.div
        id={answerId}
        className="ag-faq-item__answer-wrap"
        aria-labelledby={`faq-q-${id}`}
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          duration: reduced ? 0 : 0.32,
          ease: [0.2, 0.8, 0.2, 1],
        }}
        style={{ overflow: 'hidden' }}
      >
        <p className="ag-faq-item__answer-text font-body-md">{answer}</p>
        {link && (
          <Link href={link.href} className="ag-inline-link font-label-md">
            {link.label}
            <AppIcon name="arrow-right" size={14} />
          </Link>
        )}
      </motion.div>
    </article>
  );
}

type GradientDir = 'to-b' | 'to-t';

function StickyStatue({
  src,
  alt,
  imgOpacity,
  gradientDir,
  gradientFrom,
  gradientVia,
  gradientTo,
  hasBg,
  variant = 'default',
}: {
  src: string;
  alt: string;
  imgOpacity: number;
  gradientDir: GradientDir;
  gradientFrom: string;
  gradientVia?: string;
  gradientTo: string;
  hasBg?: boolean;
  variant?: 'default' | 'hero' | 'crisis';
}) {
  const gradientStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: gradientVia
      ? `linear-gradient(${gradientDir === 'to-b' ? 'to bottom' : 'to top'}, ${gradientFrom}, ${gradientVia}, ${gradientTo})`
      : `linear-gradient(${gradientDir === 'to-b' ? 'to bottom' : 'to top'}, ${gradientFrom}, ${gradientTo})`,
  };

  const isHero = variant === 'hero';
  const isCrisis = variant === 'crisis';

  return (
    <div
      className={
        isHero ? 'ag-sticky-bg ag-hero-bg' : isCrisis ? 'ag-sticky-bg ag-crisis-bg' : 'ag-sticky-bg'
      }
      style={hasBg ? { backgroundColor: '#0e0e0e' } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={isHero ? 'ag-hero-bg__img' : isCrisis ? 'ag-crisis-bg__img' : undefined}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          maxWidth: 'none',
          objectFit: 'cover',
          ...(isHero || isCrisis ? {} : { objectPosition: 'center' }),
          opacity: imgOpacity,
        }}
      />
      {isHero && <div className="ag-hero-bg__scrim" aria-hidden />}
      <div style={gradientStyle} />
    </div>
  );
}

export function AethelgardLanding() {
  const reduced = useReducedMotion();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [activeYield, setActiveYield] = useState<number | null>(null);
  const [canSpotlightYield, setCanSpotlightYield] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCanSpotlightYield(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

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
        <div className="hud-line hud-line--left top-0 h-screen w-px" />
        <div className="hud-line hud-line--right top-0 h-screen w-px" />
      </div>

      <main className="grow">
        <div className="relative w-full">
          {/* ── 1. Promesa ─────────────────────────────────────────────── */}
          <section className="ag-hero-section relative">
            <StickyStatue
              src={LANDING_IMAGES.statueClean}
              alt="Estatua"
              imgOpacity={0.8}
              gradientDir="to-b"
              gradientFrom="transparent"
              gradientVia="transparent"
              gradientTo="#0e0e0e"
              hasBg
              variant="hero"
            />
            <div className="ag-hero-overlay pointer-events-none relative z-10 flex flex-col justify-between">
              <HeroReveal className="ag-hero-title-zone">
                <HeroRevealItem distance={18}>
                  <p className="hud-text ag-hero-title__eyebrow text-center text-action-red">
                    MAXIMUS KRATOS
                  </p>
                  <h1 className="ag-hero-title cinematic-shadow">
                    {LANDING_HERO.lines.map((line) => (
                      <span key={line} className="ag-hero-title__line">
                        {line}
                      </span>
                    ))}
                  </h1>
                  <p className="ag-hero-title__lead font-body-lg cinematic-shadow max-w-xl text-center text-white/85">
                    {LANDING_HERO.lead}
                  </p>
                </HeroRevealItem>
              </HeroReveal>
              <HeroReveal className="ag-hero-cta-zone pointer-events-auto flex w-full items-center justify-center">
                <HeroRevealItem distance={16}>
                  <div className="ag-panel ag-panel--hero">
                    <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
                    <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
                    <p className="ag-panel__body font-body-lg">{LANDING_HERO.panel}</p>
                    <p className="ag-hero-status-badge hud-text" aria-label="Estado de la plataforma">
                      {LANDING_HERO_STATUS.badge}
                    </p>
                    <AuthCta href={LANDING_DIAGNOSTIC_CTA.href} className="btn-primary font-label-lg">
                      {LANDING_DIAGNOSTIC_CTA.label}
                    </AuthCta>
                    <p className="ag-hero-cta-note font-body-sm">
                      Acceso anticipado. Estatus de fundador permanente
                    </p>
                  </div>
                </HeroRevealItem>
              </HeroReveal>
            </div>
          </section>

          {/* ── 2. Espejo del problema ─────────────────────────────────── */}
          <section id="crisis" className="ag-crisis-section relative">
            <StickyStatue
              src={LANDING_IMAGES.statueBroken}
              alt="Estatua rota"
              imgOpacity={0.7}
              gradientDir="to-b"
              gradientFrom="#0e0e0e"
              gradientVia="transparent"
              gradientTo="#0e0e0e"
              variant="crisis"
            />
            <div className="ag-crisis-content relative z-10">
              <div className="ag-container mx-auto w-full max-w-6xl">
                <ScrollReveal className="ag-crisis-intro text-center" distance={16}>
                  <p className="hud-text text-action-red">{LANDING_PROBLEM.eyebrow}</p>
                  <h2 className="ag-crisis-title ag-type-section text-white">
                    {LANDING_PROBLEM.title}
                    <br />
                    {LANDING_PROBLEM.titleLine2}
                  </h2>
                  <p className="ag-crisis-lead font-body-lg cinematic-shadow text-white/80">
                    {LANDING_PROBLEM.lead}
                  </p>
                </ScrollReveal>

                <ScrollReveal className="ag-landing-problem-points" distance={14}>
                  <ul className="ag-landing-problem-list">
                    {LANDING_PROBLEM.points.map((point) => (
                      <li key={point} className="font-body-lg text-white/75">
                        {point}
                      </li>
                    ))}
                  </ul>
                  <p className="ag-landing-problem-close font-body-lg text-white/85">
                    {LANDING_PROBLEM.close}
                  </p>
                </ScrollReveal>
              </div>
            </div>
          </section>

          {/* ── 3. Perfiles ────────────────────────────────────────────── */}
          <section id="perfiles" className="ag-section-inner ag-landing-profiles">
            <div className="ag-container mx-auto w-full max-w-6xl">
              <ScrollReveal className="ag-landing-profiles__head text-center" distance={16}>
                <p className="hud-text text-action-red">¿TE RECONOCES?</p>
                <h2 className="ag-type-section text-white">
                  ¿Te reconoces en alguno de estos estados?
                </h2>
              </ScrollReveal>

              <ScrollStaggerContainer className="ag-profile-grid" stagger={0.08}>
                {LANDING_PROFILES.map((card) => (
                  <StaggerItem key={card.num} className="ag-profile-grid__item" distance={14}>
                    <article className="ag-panel ag-panel--marco ag-profile-card group h-full">
                      <span className="ag-panel__corner ag-panel__corner--hover" aria-hidden />
                      <p className="ag-profile-card__index hud-text text-action-red">{card.num}</p>
                      <h3 className="ag-profile-card__title ag-panel__card-title">{card.title}</h3>
                      <p className="ag-panel__card-body font-body-md">{card.body}</p>
                    </article>
                  </StaggerItem>
                ))}
              </ScrollStaggerContainer>

              <ScrollReveal className="ag-landing-profiles__close text-center" distance={12}>
                <p className="font-body-lg text-white/80">{LANDING_PROFILES_CLOSE}</p>
              </ScrollReveal>
            </div>
          </section>

          {/* ── 4. Qué es MK + método ──────────────────────────────────── */}
          <section id="funcionamiento" className="ag-section-inner ag-os-section">
            <div className="ag-os-head relative overflow-hidden">
              <div className="ag-os-head__bg-wrap pointer-events-none absolute inset-0" aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={LANDING_IMAGES.bgArquitecturaSentido}
                  alt=""
                  className="ag-os-head__bg-img"
                />
              </div>
              <div className="ag-os-head__scrim pointer-events-none absolute inset-0" aria-hidden />
              <div className="ag-container relative z-10 mx-auto">
                <ScrollReveal className="ag-os-intro text-center" distance={16}>
                  <p className="hud-text text-action-red">¿QUÉ ES MAXIMUS KRATOS?</p>
                  <h2 className="ag-type-display text-white">
                    {LANDING_WHAT_IS.titleLine1}
                    <br />
                    {LANDING_WHAT_IS.titleLine2}
                  </h2>
                  <p className="ag-os-lead font-body-lg text-xl text-white/70">
                    {LANDING_WHAT_IS.lead}
                  </p>
                </ScrollReveal>

                <ScrollReveal className="ag-mk-alignment" distance={14}>
                  <div className="ag-mk-realms">
                    <div className="ag-mk-realms__rail" aria-hidden>
                      <span className="ag-mk-realms__rail-line" />
                      <span className="ag-mk-realms__rail-core">Alinea</span>
                      <span className="ag-mk-realms__rail-line" />
                    </div>
                    {LANDING_REALMS.map((realm, index) => (
                      <div key={realm.label} className="ag-mk-realm">
                        <div className="ag-mk-realm__node" aria-hidden />
                        <span className="ag-mk-realm__index hud-text" aria-hidden>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="ag-mk-realm__icon" aria-hidden>
                          <AppIcon name={realm.icon} size={22} />
                        </div>
                        <span className="ag-mk-realm__label font-headline-sm">{realm.label}</span>
                        <span className="ag-mk-realm__symbol hud-text">{realm.symbol}</span>
                        <p className="ag-mk-realm__question font-body-md">{realm.question}</p>
                        <p className="ag-mk-realm__body font-body-md">{realm.body}</p>
                      </div>
                    ))}
                  </div>
                  <p className="ag-landing-realms-close font-body-lg text-center text-white/75">
                    {LANDING_REALMS_CLOSE}
                  </p>
                </ScrollReveal>

                {/* ── Los cuatro ámbitos (compacto) ──────────────────────── */}
                <ScrollReveal className="ag-mk-domains-section" distance={14}>
                    <div className="ag-mk-domains-section__head">
                    <p className="hud-text text-action-red">{LANDING_DOMAINS_SECTION.eyebrow}</p>
                    <h3 className="ag-type-item text-white">{LANDING_DOMAINS_SECTION.title}</h3>
                    <MkDomainsBridge />
                    <p className="ag-mk-domains-section__lead font-body-md">
                      {LANDING_DOMAINS_SECTION.leadClose}
                    </p>
                  </div>
                  <div className="ag-mk-domains">
                    {DOMAINS.map((domain) => (
                      <div key={domain.key} className="ag-mk-domain">
                        <div className="ag-mk-domain__icon" aria-hidden>
                          <AppIcon name={domain.icon} size={18} />
                        </div>
                        <span className="ag-mk-domain__label font-headline-sm">{domain.label}</span>
                        <p className="ag-mk-domain__question">{domain.question}</p>
                      </div>
                    ))}
                  </div>
                  <div className="ag-mk-domains-section__link">
                    <Link href={LANDING_DOMAINS_SECTION.linkHref} className="ag-marco-more__link font-label-lg">
                      {LANDING_DOMAINS_SECTION.linkLabel}
                      <AppIcon name="arrow-right" size={16} />
                    </Link>
                  </div>
                </ScrollReveal>
              </div>
            </div>

            <div className="ag-container relative z-10 mx-auto">
              <ScrollReveal className="ag-landing-method-head text-center" distance={14}>
                <p className="hud-text text-action-red">CÓMO FUNCIONA</p>
                <h2 className="ag-type-section text-white">
                  Cinco pasos. Un camino ordenado.
                </h2>
              </ScrollReveal>

              <div className="ag-os-phases">
                {LANDING_METHOD_STEPS.map((step, index) => {
                  const reverse = index % 2 === 1;
                  return (
                    <ScrollReveal key={step.num} className="ag-phase-row" distance={18}>
                      {/* Mobile: always image → text. Desktop: zigzag via lg:order. */}
                      <div
                        className={`ag-phase-media relative${reverse ? ' lg:order-2' : ''}`}
                      >
                        <div className="absolute -inset-4 hidden border border-white/10 lg:block" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={PHASE_IMAGES[step.imageKey]}
                          alt={step.title}
                          className="h-auto w-full border border-white/5 object-cover opacity-85 mix-blend-lighten grayscale-[0.2]"
                        />
                      </div>
                      <div
                        className={`ag-panel ag-panel--phase${reverse ? ' lg:order-1' : ''}`}
                      >
                        <div className="hud-text mb-4 text-action-red">
                          {step.num} · {step.eyebrow}
                        </div>
                        <h3 className="ag-panel__title font-headline-md">{step.title}</h3>
                        <p className="ag-panel__body font-body-md">{step.body}</p>
                        <p className="ag-phase-platform hud-text">{step.platform}</p>
                        {step.link && (
                          <Link href={step.link.href} className="ag-inline-link font-label-md">
                            {step.link.label}
                            <AppIcon name="arrow-right" size={14} />
                          </Link>
                        )}
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── 5. Beneficios ──────────────────────────────────────────── */}
          <section id="beneficios" className="ag-section-inner ag-landing-benefits">
            <div className="ag-container mx-auto w-full max-w-6xl">
              <ScrollReveal className="ag-yield-head" distance={16}>
                <p className="hud-text text-action-red">QUÉ OBTIENES</p>
                <h2 className="ag-yield-head__title ag-type-section text-white">
                  Qué obtienes al entrar en MK
                </h2>
              </ScrollReveal>

              <div onMouseLeave={canSpotlightYield ? () => setActiveYield(null) : undefined}>
                <ScrollStaggerContainer className="ag-yield">
                  {LANDING_BENEFITS.map((item, index) => (
                    <StaggerItem key={item.title} distance={18}>
                      <article
                        className={`ag-yield__row${
                          canSpotlightYield && activeYield === index ? ' ag-yield__row--active' : ''
                        }${
                          canSpotlightYield && activeYield !== null && activeYield !== index
                            ? ' ag-yield__row--dim'
                            : ''
                        }`}
                        onMouseEnter={canSpotlightYield ? () => setActiveYield(index) : undefined}
                        onFocus={canSpotlightYield ? () => setActiveYield(index) : undefined}
                        onBlur={canSpotlightYield ? () => setActiveYield(null) : undefined}
                        tabIndex={canSpotlightYield ? 0 : undefined}
                      >
                        <span className="ag-yield__index hud-text" aria-hidden>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="ag-yield__title ag-type-item">{item.title}</h3>
                        <p className="ag-yield__body font-body-lg">{item.body}</p>
                        <span className="ag-yield__bar" aria-hidden />
                      </article>
                    </StaggerItem>
                  ))}
                </ScrollStaggerContainer>
              </div>

              <ScrollReveal className="ag-marco-more" distance={12} delay={0.06}>
                <Link href="/marco-central" className="ag-marco-more__link font-label-lg">
                  Explorar el Marco Central completo
                  <AppIcon name="arrow-right" size={16} />
                </Link>
              </ScrollReveal>
            </div>
          </section>
        </div>

        {/* ── 6. CTA Diagnóstico ───────────────────────────────────────── */}
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
          <ScrollReveal className="ag-panel ag-panel--wide relative z-10 ag-founder-close" distance={16}>
            <p className="hud-text mb-6">
              {LANDING_CLOSE.eyebrow}
            </p>
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
                <p className="font-body-md text-white/65">{LANDING_CLOSE.stepBody}</p>
              </div>
              <div className="ag-founder-close__primary">
                <AuthCta href={LANDING_DIAGNOSTIC_CTA.href} className="ag-btn-cta ag-founder-close__cta font-label-lg">
                  {LANDING_DIAGNOSTIC_CTA.labelAlt}
                </AuthCta>
                <p className="ag-landing-close-platform font-body-sm">{LANDING_CLOSE.platformNote}</p>
                <TrialBadge className="ag-trial-note" />
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ── 7. FAQ ───────────────────────────────────────────────────── */}
        <section
          id="preguntas-frecuentes"
          className="ag-faq-section ag-section-inner"
          aria-labelledby="faq-heading"
        >
          <div className="ag-container ag-container--narrow">
            <ScrollReveal className="ag-faq-header text-center" distance={16}>
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

            <ScrollStaggerContainer className="ag-faq-list" stagger={0.06}>
              {LANDING_FAQ_ITEMS.map((item, index) => (
                <StaggerItem key={item.id} distance={10}>
                  <FaqItem
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

            <ScrollReveal className="ag-faq-footer text-center" distance={10}>
              <p className="ag-faq-footer__text font-body-md">
                ¿Otra duda?{' '}
                <Link href="/contacto" className="ag-faq-cta__link">
                  Escríbenos
                </Link>
                {' · '}
                <Link href="/base-conceptual" className="ag-faq-cta__link">
                  Base conceptual
                </Link>
              </p>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
