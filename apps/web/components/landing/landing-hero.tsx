import { AuthCta } from '@/components/auth-cta';
import { DeviceShowcase } from '@/components/device-showcase';
import { LandingHashLink } from '@/components/landing-hash-link';
import { HeroBeamMedia } from '@/components/landing/hero-beam-media';
import { AnimatedDivider } from '@/components/motion/animated-divider';
import { HeroReveal, HeroRevealItem } from '@/components/motion/hero-reveal';
import { TextReveal } from '@/components/motion/text-reveal';
import {
  LANDING_FOUNDER_CTA_NOTE,
  LANDING_HERO,
  LANDING_HERO_STATUS_PILLS,
  LANDING_PRIMARY_CTA,
} from '@/lib/landing-copy';

/**
 * Home hero: categoría de producto, promesa y prueba visual (DeviceShowcase)
 * sobre la atmósfera de la estatua (`HeroBeamMedia`, sin cambios).
 */
export function LandingHero() {
  return (
    <section className="ag-hero-section relative">
      <HeroBeamMedia />
      <HeroReveal className="ag-hero-content pointer-events-none relative z-10">
        <div className="ag-hero-content__intro">
          <HeroRevealItem group="eyebrow">
            <p className="hud-text ag-hero-title__eyebrow text-center text-action-red">
              {LANDING_HERO.eyebrow}
            </p>
            <AnimatedDivider
              className="ag-hero-title__rule"
              origin="center"
              startWhen="mount"
              delay={0.22}
            />
          </HeroRevealItem>
          <HeroRevealItem group="title" lcpSafe>
            <TextReveal
              as="h1"
              className="ag-hero-title cinematic-shadow"
              lineClassName="ag-hero-title__line"
              lines={[...LANDING_HERO.lines]}
              variant="epic"
              lcpSafe
              startWhen="mount"
              delay={0.48}
              duration={1.1}
              stagger={0.06}
            />
          </HeroRevealItem>
          {/*
            lcpSafe: support copy must paint under the intro veil. Leaving it at
            opacity 0 until delay 1.72s made this span the mobile LCP at ~6s on 4G
            after the intro lifted. Intro still owns the entrance; cascade of
            eyebrow/title/actions is unchanged.
          */}
          <HeroRevealItem group="support" lcpSafe>
            <p className="ag-hero-signature font-brand-tagline cinematic-shadow text-center text-action-red">
              {LANDING_HERO.signatureLines.map((line) => (
                <span key={line} className="ag-hero-signature__line">
                  {line}
                </span>
              ))}
            </p>
            <p className="ag-hero-title__lead ag-hero-title__lead--full font-body-lg cinematic-shadow mx-auto max-w-xl text-center text-white/85">
              {LANDING_HERO.lead}
            </p>
            <p className="ag-hero-title__lead ag-hero-title__lead--short font-body-md cinematic-shadow mx-auto text-center text-white/85">
              {LANDING_HERO.leadMobile}
            </p>
          </HeroRevealItem>
        </div>

        <HeroRevealItem group="actions" className="ag-hero-actions-group pointer-events-auto">
          <ul className="ag-hero-status" aria-label="Estado de la plataforma">
            {LANDING_HERO_STATUS_PILLS.map((item) => (
              <li key={item} className="ag-hero-status__pill hud-text">
                {item}
              </li>
            ))}
          </ul>
          <div className="ag-hero-actions">
            <AuthCta href={LANDING_PRIMARY_CTA.href} className="btn-primary font-label-lg">
              {LANDING_PRIMARY_CTA.label}
            </AuthCta>
            <LandingHashLink href={LANDING_HERO.secondaryCta.href} className="ag-inline-link font-label-lg">
              {LANDING_HERO.secondaryCta.label}
            </LandingHashLink>
          </div>
          <p className="ag-hero-cta-note font-body-sm text-center">
            {LANDING_FOUNDER_CTA_NOTE}
          </p>
        </HeroRevealItem>

        <HeroRevealItem group="preview" className="ag-hero-preview pointer-events-auto">
          <p className="ag-hero-preview__label hud-text">{LANDING_HERO.previewLabel}</p>
          <DeviceShowcase focus="perfil" layout="hero" />
        </HeroRevealItem>
      </HeroReveal>
    </section>
  );
}
