'use client';

import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import { MOTION_DURATION, MOTION_EASE, MOTION_VIEWPORT } from './tokens';

interface ProgressRevealProps {
  /** Progress 0–100. */
  value: number;
  className?: string;
  fillClassName?: string;
  fillStyle?: React.CSSProperties;
  delay?: number;
  /** Once in view (default). */
  once?: boolean;
  /** When false, skip inView and animate on mount. */
  startWhen?: 'inView' | 'mount';
}

/**
 * Bar fill that draws once when visible.
 * Final width is the exact value — never implies unfinished progress.
 */
export function ProgressReveal({
  value,
  className,
  fillClassName,
  fillStyle,
  delay = 0,
  once = true,
  startWhen = 'inView',
}: ProgressRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, {
    once,
    amount: 0.3,
    margin: MOTION_VIEWPORT.margin,
  });
  const pct = Math.max(0, Math.min(100, value));
  const shouldShow = startWhen === 'mount' || inView || reduced;

  return (
    <div ref={ref} className={className} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className={fillClassName}
        style={fillStyle}
        initial={reduced ? false : { width: '0%' }}
        animate={shouldShow ? { width: `${pct}%` } : { width: '0%' }}
        transition={
          reduced
            ? { duration: 0 }
            : {
                type: 'tween',
                duration: MOTION_DURATION.reveal,
                ease: MOTION_EASE.enter,
                delay,
              }
        }
      />
    </div>
  );
}
