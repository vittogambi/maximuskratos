'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { PublicFooter } from '@/components/public-footer';
import { PublicNav } from '@/components/public-nav';
import { clearPendingLandingHash } from '@/lib/landing-nav';

export function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    if (isHome) return;
    clearPendingLandingHash();
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, isHome]);

  if (isHome) {
    return <>{children}</>;
  }

  return (
    <div className="public-shell">
      <PublicNav />
      <main className="public-main">{children}</main>
      <PublicFooter />
    </div>
  );
}
