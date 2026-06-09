'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { useRef, type ReactNode } from 'react';

interface ParallaxProps {
  children: ReactNode;
  speed?: number; // 0.1–0.5 recommended
  className?: string;
}

export function Parallax({ children, speed = 0.2, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const yOutput: string[] = reduced
    ? ['0px', '0px']
    : [`${-speed * 100}px`, `${speed * 100}px`];

  const y = useTransform(scrollYProgress, [0, 1], yOutput);

  return (
    <div ref={ref} className={className} style={{ overflow: 'hidden' }}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
