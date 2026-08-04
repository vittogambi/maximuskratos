'use client';

import { useInView, useReducedMotion, animate } from 'motion/react';
import { useEffect, useRef } from 'react';
import { MOTION_DURATION, MOTION_EASE } from './tokens';

interface NumberCounterProps {
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  /** inView = when scrolled into viewport (default). mount = as soon as rendered. */
  startWhen?: 'inView' | 'mount';
}

/** @deprecated Prefer MotionNumber for new call sites. */
export function NumberCounter({
  to,
  duration = MOTION_DURATION.heroMedia,
  className,
  suffix = '',
  prefix = '',
  startWhen = 'inView',
}: NumberCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '-40px 0px' });
  const shouldStart = startWhen === 'mount' || inView;

  useEffect(() => {
    if (!shouldStart) return;

    if (reduced) {
      if (ref.current) ref.current.textContent = `${prefix}${to}${suffix}`;
      return;
    }

    const controls = animate(0, to, {
      duration,
      ease: MOTION_EASE.enter,
      onUpdate(v) {
        if (ref.current) {
          ref.current.textContent = `${prefix}${Math.round(v)}${suffix}`;
        }
      },
    });

    return () => controls.stop();
  }, [shouldStart, to, duration, reduced, suffix, prefix]);

  return (
    <span ref={ref} className={className}>
      {prefix}{reduced ? to : 0}{suffix}
    </span>
  );
}
