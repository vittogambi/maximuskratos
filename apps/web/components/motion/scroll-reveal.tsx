'use client';

import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import {
  MOTION_EASE,
  MOTION_VIEWPORT,
  densityDistance,
  densityDuration,
  type RevealDensity,
} from './tokens';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Prefer density over raw delay/distance for page call sites. */
  density?: RevealDensity;
  delay?: number;
  distance?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  className,
  density = 'default',
  delay = 0,
  distance,
  once = MOTION_VIEWPORT.once,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, {
    once,
    amount: MOTION_VIEWPORT.amount,
    margin: MOTION_VIEWPORT.margin,
  });
  const travel = distance ?? densityDistance(density);
  const duration = densityDuration(density);

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: travel }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: travel }}
      transition={{
        type: 'tween',
        duration,
        delay,
        ease: MOTION_EASE.enter,
      }}
    >
      {children}
    </motion.div>
  );
}
