'use client';

import { useInView, useReducedMotion, animate } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface NumberCounterProps {
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function NumberCounter({
  to,
  duration = 1.5,
  className,
  suffix = '',
  prefix = '',
}: NumberCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '-40px 0px' });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!inView || started) return;
    setStarted(true);

    if (reduced) {
      if (ref.current) ref.current.textContent = `${prefix}${to}${suffix}`;
      return;
    }

    const controls = animate(0, to, {
      duration,
      ease: [0.2, 0, 0.2, 1],
      onUpdate(v) {
        if (ref.current) {
          ref.current.textContent = `${prefix}${Math.round(v)}${suffix}`;
        }
      },
    });

    return () => controls.stop();
  }, [inView, started, to, duration, reduced, suffix, prefix]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
