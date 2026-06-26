/** Shared motion tokens for the diagnostic player — aligned with globals.css + UX spec. */
export const DIAGNOSTIC_EASE = [0.2, 0, 0, 1] as const;
export const DIAGNOSTIC_EASE_OUT = [0.4, 0, 1, 1] as const;
export const OPTION_STAGGER_S = 0.06;

export const questionScreenVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: DIAGNOSTIC_EASE },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.22, ease: DIAGNOSTIC_EASE_OUT },
  },
};

export const moduleIntroVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.4, ease: DIAGNOSTIC_EASE },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.28, ease: DIAGNOSTIC_EASE_OUT },
  },
};

export const introStaggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

export const introStaggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: DIAGNOSTIC_EASE },
  },
};

export const introIconItem = {
  hidden: { opacity: 0, scale: 0.82 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] as const },
  },
};

export const optionListContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: OPTION_STAGGER_S, delayChildren: 0.04 },
  },
};

export const optionListItem = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: DIAGNOSTIC_EASE },
  },
};

export const outroBodyVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: DIAGNOSTIC_EASE },
  },
};

export const outroStaggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

export const outroStaggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: DIAGNOSTIC_EASE },
  },
};

export const ctaRevealVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
};

export const reasonBoxVariants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    marginTop: '1.25rem',
    transition: { duration: 0.3, ease: DIAGNOSTIC_EASE },
  },
};
