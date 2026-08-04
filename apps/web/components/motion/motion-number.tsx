'use client';

import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { MOTION_DURATION, MOTION_EASE } from './tokens';

interface MotionNumberProps {
  to: number;
  /** Animate from this value (default 0 on first reveal). */
  from?: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  /** inView = when scrolled into viewport (default). mount = as soon as rendered. */
  startWhen?: 'inView' | 'mount';
  /**
   * When false, skip animation and show `to` immediately.
   * Use for returning visits after a one-shot gate.
   */
  animate?: boolean;
}

/**
 * Interpolates previous → next only when first introduced or materially changed.
 * Does not re-animate on plain re-renders of the same value.
 */
export function MotionNumber({
  to,
  from,
  duration = MOTION_DURATION.reveal,
  className,
  suffix = '',
  prefix = '',
  startWhen = 'inView',
  animate: shouldAnimate = true,
}: MotionNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '-40px 0px' });
  const shouldStart = startWhen === 'mount' || inView;
  const lastTo = useRef<number | null>(null);
  const displayed = useRef(from ?? 0);

  useEffect(() => {
    if (!shouldStart) return;

    const format = (v: number) => `${prefix}${Math.round(v)}${suffix}`;

    if (reduced || !shouldAnimate) {
      if (ref.current) ref.current.textContent = format(to);
      displayed.current = to;
      lastTo.current = to;
      return;
    }

    // Same value already shown — do not re-animate.
    if (lastTo.current === to && ref.current?.textContent === format(to)) {
      return;
    }

    const start = lastTo.current === null ? (from ?? 0) : displayed.current;
    lastTo.current = to;

    const controls = animate(start, to, {
      duration,
      ease: MOTION_EASE.enter,
      onUpdate(v) {
        displayed.current = v;
        if (ref.current) ref.current.textContent = format(v);
      },
    });

    return () => controls.stop();
  }, [shouldStart, to, from, duration, reduced, suffix, prefix, shouldAnimate]);

  const fallback = reduced || !shouldAnimate ? to : (from ?? 0);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {fallback}
      {suffix}
    </span>
  );
}
