'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MOTION_DURATION, MOTION_EASE, MOTION_SESSION } from './tokens';

/**
 * First-visit intro veil for public routes.
 * Emblem + architectural line, under ~1.2s. Session-gated.
 * Pre-hydration: root layout sets data-mk-intro on <html>.
 */
export function IntroGate() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(MOTION_SESSION.introSeen)) {
        document.documentElement.removeAttribute('data-mk-intro');
        return;
      }
    } catch {
      document.documentElement.removeAttribute('data-mk-intro');
      return;
    }

    if (reduced) {
      try {
        sessionStorage.setItem(MOTION_SESSION.introSeen, '1');
      } catch {
        /* ignore */
      }
      document.documentElement.removeAttribute('data-mk-intro');
      return;
    }

    setActive(true);

    const done = window.setTimeout(() => {
      setExiting(true);
      try {
        sessionStorage.setItem(MOTION_SESSION.introSeen, '1');
      } catch {
        /* ignore */
      }
      window.setTimeout(() => {
        setActive(false);
        document.documentElement.removeAttribute('data-mk-intro');
      }, MOTION_DURATION.interaction * 1000);
    }, 1000);

    return () => window.clearTimeout(done);
  }, [reduced]);

  if (!active) return null;

  return (
    <motion.div
      className="mk-intro-gate"
      aria-hidden
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{
        duration: MOTION_DURATION.interaction,
        ease: MOTION_EASE.exit,
      }}
    >
      <div className="mk-intro-gate__inner">
        <motion.img
          src="/brand/mk-mark.svg"
          alt=""
          className="mk-intro-gate__mark"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.45,
            ease: MOTION_EASE.enter,
            delay: 0.05,
          }}
        />
        <motion.span
          className="mk-intro-gate__line"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            ease: MOTION_EASE.enter,
            delay: 0.28,
          }}
        />
      </div>
    </motion.div>
  );
}
