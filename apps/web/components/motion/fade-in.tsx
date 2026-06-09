'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';

interface FadeInProps extends HTMLMotionProps<'div'> {
  delay?: number;
  duration?: number;
}

export function FadeIn({ children, delay = 0, duration = 0.4, style, ...props }: FadeInProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: reduced ? 0 : duration,
        delay: reduced ? 0 : delay,
        ease: [0.2, 0, 0, 1],
      }}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  );
}
