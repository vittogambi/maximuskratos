'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import {
  HERO_GROUP_DELAY,
  MOTION_DISTANCE,
  MOTION_DURATION,
  MOTION_EASE,
} from './tokens';

type HeroGroup = keyof typeof HERO_GROUP_DELAY;

interface HeroRevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Orchestration root for hero content.
 * Children use absolute delays via `HeroRevealItem` group; nesting is allowed.
 */
export function HeroReveal({ children, className }: HeroRevealProps) {
  return <div className={className}>{children}</div>;
}

export function HeroRevealItem({
  children,
  className,
  distance = MOTION_DISTANCE.hero,
  group = 'support',
  lcpSafe = false,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
  group?: HeroGroup;
  /** Never hide probable LCP content at first paint. */
  lcpSafe?: boolean;
}) {
  const reduced = useReducedMotion();
  const delay = HERO_GROUP_DELAY[group];
  /** lcpSafe keeps content painted; travel defaults to 0 so child TextReveal owns the rise. */
  const travel = lcpSafe ? 0 : distance;
  const useScale = group === 'actions';

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  if (lcpSafe) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 1, y: travel }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'tween',
          duration: MOTION_DURATION.hero,
          ease: MOTION_EASE.enter,
          delay: 0,
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        y: travel,
        ...(useScale ? { scale: 0.975 } : null),
      }}
      animate={{ opacity: 1, y: 0, ...(useScale ? { scale: 1 } : null) }}
      transition={{
        type: 'tween',
        duration: MOTION_DURATION.hero,
        ease: MOTION_EASE.enter,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
