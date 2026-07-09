'use client';

import type { ReactNode } from 'react';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { cn } from '@/lib/cn';

type SectionIntroProps = {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  as?: 'h1' | 'h2';
  size?: 'display' | 'section';
  align?: 'center' | 'start';
  headingId?: string;
  className?: string;
};

/**
 * Cabecera de sección compartida en páginas públicas:
 * eyebrow HUD + título display + lead opcional. Sustituye los
 * `style={{ fontSize: clamp(...) }}` inline repetidos por página.
 */
export function SectionIntro({
  eyebrow,
  title,
  lead,
  as: Heading = 'h2',
  size = 'section',
  align = 'center',
  headingId,
  className,
}: SectionIntroProps) {
  return (
    <ScrollReveal
      className={cn('ag-intro', align === 'center' && 'text-center', className)}
      distance={14}
    >
      <p className="hud-text text-action-red">{eyebrow}</p>
      <Heading
        id={headingId}
        className={cn(
          'ag-intro__title text-white',
          size === 'display' ? 'ag-type-display' : 'ag-type-section',
        )}
      >
        {title}
      </Heading>
      {lead ? (
        <p className={cn('ag-intro__lead font-body-lg', align === 'center' && 'ag-intro__lead--center')}>
          {lead}
        </p>
      ) : null}
    </ScrollReveal>
  );
}
