'use client';

import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import {
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_STAGGER,
  MOTION_VIEWPORT,
  getBoundedStagger,
} from './tokens';

/** Soft continuous settle — less punchy than a hard title-card snap. */
const EPIC_EASE = [0.22, 1, 0.36, 1] as const;

interface TextRevealProps {
  /** One string per visual line. */
  lines: string[];
  className?: string;
  lineClassName?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div';
  /** Never hide probable LCP content at first paint. */
  lcpSafe?: boolean;
  delay?: number;
  /** Per-line duration override (seconds). */
  duration?: number;
  /** Per-line stagger override (seconds). */
  stagger?: number;
  /**
   * default = masked rise.
   * epic = title-card: deep mask, scale settle, letter-spacing compress.
   */
  variant?: 'default' | 'epic';
  once?: boolean;
  /** Mount = animate on mount. inView = when scrolled into view. */
  startWhen?: 'mount' | 'inView';
}

/**
 * Masked line-by-line heading reveal.
 * Overflow-hidden wrappers + y travel — not character bounce.
 */
export function TextReveal({
  lines,
  className,
  lineClassName,
  as: Tag = 'h2',
  lcpSafe = false,
  delay = 0,
  duration,
  stagger: staggerProp,
  variant = 'default',
  once = MOTION_VIEWPORT.once,
  startWhen = 'inView',
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, {
    once,
    amount: MOTION_VIEWPORT.amount,
    margin: MOTION_VIEWPORT.margin,
  });
  const shouldShow = startWhen === 'mount' || inView || reduced;
  const isEpic = variant === 'epic';
  const lineDuration =
    duration ?? (isEpic ? 1.05 : MOTION_DURATION.reveal);
  const stagger =
    staggerProp ??
    getBoundedStagger(lines.length, isEpic ? 0.07 : MOTION_STAGGER.tight);

  if (reduced) {
    return (
      <Tag ref={ref as never} className={className}>
        {lines.map((line) => (
          <span key={line} className={lineClassName} style={{ display: 'block' }}>
            {line}
          </span>
        ))}
      </Tag>
    );
  }

  // Epic: percentage y clears the overflow mask even when a "line" wraps on
  // mobile (em-travel left wrapped glyphs visible). Opacity starts at 0 so the
  // title is never readable before the reveal — same as desktop.
  // Never animate letter-spacing: it reflows wrapped lines mid-reveal.
  const initial = isEpic
    ? {
        opacity: 0,
        y: '100%',
        scale: 0.985,
      }
    : lcpSafe
      ? { opacity: 0.92, y: '0.55em' }
      : { opacity: 0, y: '105%' };

  const rest = isEpic
    ? {
        opacity: 1,
        y: 0,
        scale: 1,
      }
    : { opacity: 1, y: 0 };

  return (
    <Tag ref={ref as never} className={className}>
      {lines.map((line, i) => (
        <span
          key={`${line}-${i}`}
          className={lineClassName}
          style={{
            display: 'block',
            overflow: 'hidden',
            paddingBottom: isEpic ? '0.1em' : '0.06em',
          }}
        >
          <motion.span
            style={{
              display: 'block',
              willChange: 'transform, opacity',
              transformOrigin: 'center bottom',
            }}
            initial={initial}
            animate={shouldShow ? rest : initial}
            transition={
              isEpic
                ? {
                    // One shared curve for y / scale / opacity so lines feel like
                    // a continuous wave instead of discrete section hits.
                    type: 'tween',
                    duration: lineDuration,
                    ease: EPIC_EASE,
                    delay: delay + i * stagger,
                  }
                : {
                    type: 'tween',
                    duration: lineDuration,
                    ease: MOTION_EASE.enter,
                    delay: delay + i * stagger,
                  }
            }
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Single-line mask reveal for short editorial statements. */
export function TextRevealLine({
  children,
  className,
  delay = 0,
  startWhen = 'inView',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  startWhen?: 'mount' | 'inView';
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, {
    once: true,
    amount: 0.4,
    margin: MOTION_VIEWPORT.margin,
  });
  const shouldShow = startWhen === 'mount' || inView || reduced;

  if (reduced) {
    return (
      <span ref={ref} className={className} style={{ display: 'block' }}>
        {children}
      </span>
    );
  }

  return (
    <span ref={ref} className={className} style={{ display: 'block', overflow: 'hidden' }}>
      <motion.span
        style={{ display: 'block' }}
        initial={{ opacity: 0, y: '100%' }}
        animate={shouldShow ? { opacity: 1, y: 0 } : { opacity: 0, y: '100%' }}
        transition={{
          type: 'tween',
          duration: MOTION_DURATION.reveal,
          ease: MOTION_EASE.enter,
          delay,
        }}
      >
        {children}
      </motion.span>
    </span>
  );
}
