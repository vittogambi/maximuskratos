'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

interface HeroRevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Orchestrated entrance for hero content.
 * Staggers children in using a parent/children variant pattern.
 */
export function HeroReveal({ children, className }: HeroRevealProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduced ? 0 : 0.12,
            delayChildren: reduced ? 0 : 0.15,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function HeroRevealItem({
  children,
  className,
  distance = 30,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduced ? 0 : distance },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: reduced ? 0 : 0.5, ease: [0.2, 0.8, 0.2, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
