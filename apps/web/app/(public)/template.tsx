'use client';

import { motion, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import {
  MOTION_DISTANCE,
  MOTION_DURATION,
  MOTION_EASE,
} from '@/components/motion/tokens';
import { peekPendingLandingHash } from '@/lib/landing-nav';

/**
 * Public route entrance: short fade + 8px rise.
 * Opacity-only when a pending landing hash is present so scroll targeting stays accurate.
 */
export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const hashPending = useMemo(() => {
    if (typeof window === 'undefined') return false;
    if (pathname !== '/') return false;
    try {
      return Boolean(peekPendingLandingHash() || window.location.hash);
    } catch {
      return false;
    }
  }, [pathname]);

  if (reduced) {
    return <>{children}</>;
  }

  const y = hashPending ? 0 : MOTION_DISTANCE.page;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'tween',
        duration: MOTION_DURATION.page,
        ease: MOTION_EASE.enter,
      }}
    >
      {children}
    </motion.div>
  );
}
