'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';

interface SlideUpProps extends HTMLMotionProps<'div'> {
  delay?: number;
  duration?: number;
  distance?: number;
}

export function SlideUp({
  children,
  delay = 0,
  duration = 0.5,
  distance = 24,
  style,
  ...props
}: SlideUpProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : distance }}
      animate={{ opacity: 1, y: 0 }}
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
