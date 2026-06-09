'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true when viewport width < 768px (mobile).
 * SSR-safe: returns false on the server.
 */
export function useMobile(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setMobile(mq.matches);

    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return mobile;
}
