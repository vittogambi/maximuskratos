'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PublicFooter } from '@/components/public-footer';
import { PublicNav } from '@/components/public-nav';

export function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

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
