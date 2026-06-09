'use client';

import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  distance = 20,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once, margin: '-80px 0px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : distance }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : distance }}
      transition={{
        duration: reduced ? 0 : 0.4,
        delay: reduced ? 0 : delay,
        ease: [0.2, 0.8, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
