'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { APP_MOTION, MOTION_EASE, MOTION_SESSION } from './tokens';

/**
 * Webapp first-session entrance. Once per session via sessionStorage.
 * Returning visits render children statically.
 */
export function useAppEntranceOnce(key: string = MOTION_SESSION.dashboardEntrance) {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(key)) {
        setShouldAnimate(false);
      } else {
        sessionStorage.setItem(key, '1');
        setShouldAnimate(true);
      }
    } catch {
      setShouldAnimate(false);
    }
    setReady(true);
  }, [key]);

  return { shouldAnimate, ready };
}

export function AppReveal({
  children,
  className,
  delay = 0,
  active = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** When false, render statically. */
  active?: boolean;
}) {
  const reduced = useReducedMotion();

  if (!active || reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: APP_MOTION.distance.sm }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'tween',
        duration: APP_MOTION.duration.reveal,
        ease: MOTION_EASE.enter,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
