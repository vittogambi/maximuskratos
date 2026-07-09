'use client';

import type { ReactNode } from 'react';
import { AuthCta } from '@/components/auth-cta';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { cn } from '@/lib/cn';
import { LANDING_DIAGNOSTIC_CTA, SUBPAGE_DIAGNOSTIC_CTA } from '@/lib/landing-copy';

type SubpageCtaProps = {
  eyebrow?: string;
  title?: string;
  lead?: string;
  ctaLabel?: string;
  className?: string;
  /** Contenido extra bajo el CTA (p. ej. link de retorno). */
  children?: ReactNode;
};

/**
 * Cierre compartido de subpáginas públicas: invitación al diagnóstico inicial.
 * Una sola implementación en lugar de cuatro copias divergentes.
 */
export function SubpageCta({
  eyebrow = 'MK · PRIMER PASO',
  title = SUBPAGE_DIAGNOSTIC_CTA.title,
  lead = SUBPAGE_DIAGNOSTIC_CTA.lead,
  ctaLabel = LANDING_DIAGNOSTIC_CTA.labelAlt,
  className,
  children,
}: SubpageCtaProps) {
  return (
    <section className={cn('ag-section-inner ag-sistema-cta', className)}>
      <div className="ag-container">
        <ScrollReveal className="ag-sistema-cta__inner text-center" distance={14}>
          <p className="hud-text text-action-red">{eyebrow}</p>
          <h2 className="ag-sistema-cta__title ag-type-section text-white">{title}</h2>
          <p className="ag-sistema-cta__lead font-body-md">{lead}</p>
          <AuthCta href={LANDING_DIAGNOSTIC_CTA.href} className="ag-btn-cta font-label-lg">
            {ctaLabel}
          </AuthCta>
          {children}
        </ScrollReveal>
      </div>
    </section>
  );
}
