'use client';

import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import type { HTMLMotionProps } from 'motion/react';

const PREMIUM_EASE = [0.2, 0.8, 0.2, 1] as const;

interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  stagger?: number;
  delayChildren?: number;
}

export function StaggerContainer({
  children,
  stagger = 0.07,
  delayChildren = 0,
  ...props
}: StaggerContainerProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduced ? 0 : stagger,
            delayChildren: reduced ? 0 : delayChildren,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps extends HTMLMotionProps<'div'> {
  distance?: number;
}

export function StaggerItem({ children, distance = 20, ...props }: StaggerItemProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: reduced ? 0 : distance },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: reduced ? 0 : 0.38, ease: PREMIUM_EASE },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface ScrollStaggerContainerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  once?: boolean;
}

export function ScrollStaggerContainer({
  children,
  className,
  stagger = 0.08,
  once = true,
}: ScrollStaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once, margin: '-72px 0px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduced ? 0 : stagger,
            delayChildren: reduced ? 0 : 0.04,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
