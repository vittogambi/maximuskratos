'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';
import { MOTION_DURATION, MOTION_EASE } from './tokens';

interface FadeInProps extends HTMLMotionProps<'div'> {
  delay?: number;
  duration?: number;
}

export function FadeIn({
  children,
  delay = 0,
  duration = MOTION_DURATION.reveal,
  style,
  ...props
}: FadeInProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: reduced ? 0 : duration,
        delay: reduced ? 0 : delay,
        ease: MOTION_EASE.enter,
      }}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  );
}
