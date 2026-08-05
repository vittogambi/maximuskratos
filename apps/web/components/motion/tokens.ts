import type { Transition, Variants } from 'motion/react';

/**
 * Shared motion tokens for Maximus Kratos.
 * CSS mirrors (globals.css @theme):
 *   --duration-fast/base/slow/xslow  ↔ micro / interaction / reveal / hero
 *   --ease-standard / entrance / exit ↔ standard / enter / exit
 *   --stagger-sm / md                 ↔ tight / base (ms)
 */

/** Premium ease: decisive settle, not bouncy. */
export const MOTION_EASE = {
  enter: [0.16, 1, 0.3, 1],
  standard: [0.22, 1, 0.36, 1],
  exit: [0.7, 0, 0.84, 0],
} as const;

export const MOTION_DURATION = {
  instant: 0.11,
  micro: 0.2,
  interaction: 0.28,
  reveal: 0.55,
  staggerItem: 0.48,
  hero: 0.7,
  heroMedia: 0.9,
  divider: 0.7,
  page: 0.32,
  pageApp: 0.16,
  drawerIn: 0.28,
  drawerOut: 0.2,
  backdrop: 0.2,
} as const;

export const MOTION_DISTANCE = {
  micro: 6,
  sm: 14,
  md: 22,
  hero: 28,
  page: 8,
} as const;

export const MOTION_STAGGER = {
  tight: 0.05,
  base: 0.07,
  hero: 0.09,
  delayChildren: 0.06,
  maxTail: 0.36,
  drawerLink: 0.03,
} as const;

export const MOTION_VIEWPORT = {
  once: true,
  amount: 0.18,
  margin: '0px 0px 80px 0px',
} as const;

/**
 * Hero group delays — timed to the beam sequence.
 * Eyebrow/rule land first; title lines cascade as the beam builds; lead + CTA settle after.
 */
export const HERO_GROUP_DELAY = {
  eyebrow: 0.12,
  title: 0.42,
  /** After smoothed epic title (0.48 + 0.06 + 1.1 ≈ 1.64s). */
  support: 1.72,
  actions: 1.92,
  /** Product preview lands last — after the CTA has already settled. */
  preview: 2.12,
  media: 0.04,
} as const;

/**
 * Authenticated webapp motion: ~40–60% shorter, smaller travel.
 * Use for panel / perfil / ruta / cuenta — never cinematic during tasks.
 */
export const APP_MOTION = {
  duration: {
    micro: 0.12,
    interaction: 0.16,
    reveal: 0.28,
    page: 0.16,
    unlock: 0.6,
  },
  distance: {
    micro: 4,
    sm: 6,
    md: 10,
  },
  stagger: {
    tight: 0.03,
    base: 0.04,
    maxTail: 0.2,
  },
} as const;

export const INTERACTION_SPRING: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
  mass: 0.65,
};

/** Cap stagger so large grids never produce a near-second tail. */
export function getBoundedStagger(
  itemCount: number,
  preferred: number = MOTION_STAGGER.base,
  maxTail: number = MOTION_STAGGER.maxTail,
) {
  if (itemCount <= 1) return 0;
  return Math.min(preferred, maxTail / (itemCount - 1));
}

export type RevealDensity = 'tight' | 'default' | 'spacious';

export function densityDistance(density: RevealDensity = 'default') {
  if (density === 'tight') return MOTION_DISTANCE.sm;
  if (density === 'spacious') return MOTION_DISTANCE.hero;
  return MOTION_DISTANCE.md;
}

export function densityDuration(density: RevealDensity = 'default') {
  if (density === 'tight') return 0.42;
  if (density === 'spacious') return 0.62;
  return MOTION_DURATION.reveal;
}

export const revealTransition: Transition = {
  type: 'tween',
  duration: MOTION_DURATION.reveal,
  ease: MOTION_EASE.enter,
};

export const sectionIntroPreset = {
  distance: MOTION_DISTANCE.md,
  duration: MOTION_DURATION.reveal,
  ease: MOTION_EASE.enter,
} as const;

export const heroContainerPreset: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: MOTION_STAGGER.hero,
      delayChildren: 0,
    },
  },
};

export const heroItemTransition: Transition = {
  type: 'tween',
  duration: MOTION_DURATION.hero,
  ease: MOTION_EASE.enter,
};

export const heroMediaTransition: Transition = {
  type: 'tween',
  duration: MOTION_DURATION.heroMedia,
  ease: MOTION_EASE.enter,
  delay: 0.05,
};

export const staggerItemTransition: Transition = {
  type: 'tween',
  duration: MOTION_DURATION.staggerItem,
  ease: MOTION_EASE.enter,
};

export const interactionContentTransition: Transition = {
  type: 'tween',
  duration: MOTION_DURATION.interaction,
  ease: MOTION_EASE.standard,
};

export const dividerPreset = {
  initial: { scaleX: 0.35, opacity: 0 },
  animate: { scaleX: 1, opacity: 1 },
  transition: {
    type: 'tween' as const,
    duration: MOTION_DURATION.divider,
    ease: MOTION_EASE.enter,
    delay: 0.12,
  },
};

export const interactionChevronTransition: Transition = {
  type: 'tween',
  duration: MOTION_DURATION.micro,
  ease: MOTION_EASE.standard,
};

/** Hover lift: CSS-friendly values mirrored for motion where needed. */
export const HOVER_LIFT = {
  y: -3,
  duration: 0.22,
} as const;

/** Session keys for one-shot motion gates. */
export const MOTION_SESSION = {
  introSeen: 'mk_intro_seen',
  heroBeamSeen: 'mk_hero_beam_seen',
  dashboardEntrance: 'mk_dashboard_entrance',
} as const;
