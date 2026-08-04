'use client';

import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import { MOTION_DURATION, MOTION_EASE, MOTION_VIEWPORT, dividerPreset } from './tokens';

interface AnimatedDividerProps {
  className?: string;
  /** Transform origin for the scaleX draw. */
  origin?: 'left' | 'center' | 'right';
  delay?: number;
  /** Mount = animate on mount. inView = when scrolled into view. */
  startWhen?: 'mount' | 'inView';
}

/**
 * Architectural rule that draws once via scaleX.
 */
export function AnimatedDivider({
  className,
  origin = 'center',
  delay,
  startWhen = 'inView',
}: AnimatedDividerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, {
    once: MOTION_VIEWPORT.once,
    amount: 0.4,
    margin: MOTION_VIEWPORT.margin,
  });
  const shouldShow = startWhen === 'mount' || inView;

  const transformOrigin =
    origin === 'left' ? 'left center' : origin === 'right' ? 'right center' : 'center';

  if (reduced) {
    return <span ref={ref} className={className} aria-hidden />;
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      aria-hidden
      initial={dividerPreset.initial}
      animate={shouldShow ? dividerPreset.animate : dividerPreset.initial}
      transition={{
        type: 'tween',
        duration: MOTION_DURATION.divider,
        ease: MOTION_EASE.enter,
        delay: delay ?? dividerPreset.transition.delay,
      }}
      style={{ display: 'block', transformOrigin }}
    />
  );
}
