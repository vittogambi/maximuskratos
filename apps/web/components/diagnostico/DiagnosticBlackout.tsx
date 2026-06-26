'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

type Props = {
  visible: boolean;
};

/** Brief fade-to-black between question flow and module outro. */
export function DiagnosticBlackout({ visible }: Props) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="dk-blackout"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.35, ease: [0.4, 0, 0.2, 1] }}
          aria-hidden
        />
      )}
    </AnimatePresence>
  );
}
