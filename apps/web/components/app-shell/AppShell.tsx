'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { AppTopBar } from './AppTopBar';
import { BottomTabBar } from './BottomTabBar';

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, user } = useAuthSession();

  useLayoutEffect(() => {
    if (status === 'guest') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'guest') return;
    if (user?.role === 'ADMIN') router.replace('/admin');
  }, [status, user, router]);

  if (status === 'loading') {
    return (
      <div className="mk-app-shell">
        <div className="mk-app-loading">
          <span className="auth-spinner" aria-hidden />
        </div>
      </div>
    );
  }

  // Guest/admin are mid-redirect — avoid the full-shell spinner that felt "stuck".
  if (status === 'guest' || user?.role === 'ADMIN') {
    return null;
  }

  return (
    <div className="mk-app-shell">
      <AppTopBar />
      <main className="mk-app-content">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
