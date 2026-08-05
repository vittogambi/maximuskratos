'use client';

import { motion, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { APP_MOTION, MOTION_EASE } from '@/components/motion/tokens';

/** Authenticated webapp: opacity-only, ~160 ms. */
export default function MemberTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Avoid SSR/client tree mismatch from prefers-reduced-motion.
  if (!hydrated || reduced) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        type: 'tween',
        duration: APP_MOTION.duration.page,
        ease: MOTION_EASE.enter,
      }}
    >
      {children}
    </motion.div>
  );
}
