'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { AppTopBar } from './AppTopBar';
import { BottomTabBar } from './BottomTabBar';
import { MemberSideNav } from './MemberSideNav';
import { canUseMemberProduct } from '@/lib/member-access';
import { enterPortal, exitPortal, isDomainPath, shouldExitPortal } from '@/lib/portal-transition';

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useAuthSession();
  const member = canUseMemberProduct(user);
  const stage = pathname === '/panel';

  useLayoutEffect(() => {
    if (status === 'guest') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor || anchor.getAttribute('target') === '_blank') return;
      let path = '';
      try {
        path = new URL(anchor.href, window.location.origin).pathname;
      } catch {
        return;
      }
      const metric = anchor.closest('a.mk-metric');
      if (metric instanceof HTMLElement && isDomainPath(path)) {
        event.preventDefault();
        enterPortal(path, metric, router);
        return;
      }
      if (path === '/panel' && isDomainPath(window.location.pathname) && shouldExitPortal(window.location.pathname)) {
        event.preventDefault();
        exitPortal(router);
      }
    }
    document.addEventListener('click', onClick, true);
    function onWarm(event: Event) {
      const metric = (event.target as Element | null)?.closest?.('a.mk-metric');
      if (!(metric instanceof HTMLAnchorElement)) return;
      try {
        const path = new URL(metric.href, window.location.origin).pathname;
        if (isDomainPath(path)) router.prefetch(path);
      } catch {
        /* ignore */
      }
    }
    document.addEventListener('pointerover', onWarm, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('pointerover', onWarm, true);
    };
  }, [router]);

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
    <div className={['mk-app-shell', member ? 'mk-app-shell--flat' : '', stage ? 'mk-app-shell--stage' : ''].filter(Boolean).join(' ')}>
      <MemberSideNav />
      <div className="mk-app-main">
        <AppTopBar />
        <main className="mk-app-content">
          {children}
        </main>
        <BottomTabBar />
      </div>
    </div>
  );
}
