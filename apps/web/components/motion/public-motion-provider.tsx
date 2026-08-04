'use client';

import type { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';

/** Public-shell motion config. Mounted in `app/(public)/layout.tsx` so `/` is covered. */
export function PublicMotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
