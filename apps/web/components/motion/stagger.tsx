'use client';

import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import type { HTMLMotionProps } from 'motion/react';
import {
  MOTION_DISTANCE,
  MOTION_EASE,
  MOTION_STAGGER,
  MOTION_VIEWPORT,
  getBoundedStagger,
  staggerItemTransition,
} from './tokens';

interface StaggerItemProps extends Omit<HTMLMotionProps<'div'>, 'children' | 'variants'> {
  children: ReactNode;
  distance?: number;
  /** Optional initial x offset that settles to 0 (fragmentation → order). */
  offsetX?: number;
}

export function StaggerItem({
  children,
  distance = MOTION_DISTANCE.sm,
  offsetX = 0,
  className,
  ...props
}: StaggerItemProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: distance, x: offsetX },
        show: {
          opacity: 1,
          y: 0,
          x: 0,
          transition: { ...staggerItemTransition, ease: MOTION_EASE.enter },
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
  itemCount?: number;
  once?: boolean;
}

export function ScrollStaggerContainer({
  children,
  className,
  stagger = MOTION_STAGGER.base,
  itemCount,
  once = MOTION_VIEWPORT.once,
}: ScrollStaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, {
    once,
    amount: MOTION_VIEWPORT.amount,
    margin: MOTION_VIEWPORT.margin,
  });
  const interval =
    itemCount !== undefined ? getBoundedStagger(itemCount, stagger) : stagger;

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

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
            staggerChildren: interval,
            delayChildren: MOTION_STAGGER.delayChildren,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
