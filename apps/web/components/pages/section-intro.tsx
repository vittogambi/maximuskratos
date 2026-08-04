'use client';

import type { ReactNode } from 'react';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { MOTION_DISTANCE, MOTION_STAGGER } from '@/components/motion/tokens';
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
 * Cabecera de sección compartida: eyebrow → título → lead
 * como una sola composición con un viewport trigger.
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
  const itemCount = lead ? 3 : 2;

  return (
    <ScrollStaggerContainer
      className={cn('ag-intro', align === 'center' && 'text-center', className)}
      stagger={MOTION_STAGGER.base}
      itemCount={itemCount}
    >
      <StaggerItem distance={MOTION_DISTANCE.md}>
        <p className="hud-text text-action-red">{eyebrow}</p>
      </StaggerItem>
      <StaggerItem distance={MOTION_DISTANCE.md}>
        <Heading
          id={headingId}
          className={cn(
            'ag-intro__title text-white',
            size === 'display' ? 'ag-type-display' : 'ag-type-section',
          )}
        >
          {title}
        </Heading>
      </StaggerItem>
      {lead ? (
        <StaggerItem distance={MOTION_DISTANCE.sm}>
          <p
            className={cn(
              'ag-intro__lead font-body-lg',
              align === 'center' && 'ag-intro__lead--center',
            )}
          >
            {lead}
          </p>
        </StaggerItem>
      ) : null}
    </ScrollStaggerContainer>
  );
}
