'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { Logo } from '@/components/logo';
import { AppIcon } from '@/components/app-icon';
import { useAuthSession } from '@/components/auth-session-provider';

const NAV = [
  { href: '/admin', label: 'Resumen', icon: 'layout-dashboard', exact: true },
  { href: '/admin/users', label: 'Usuarios', icon: 'users' },
  { href: '/admin/leads', label: 'Leads', icon: 'mail' },
  { href: '/admin/planes', label: 'Planes', icon: 'layout-grid' },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, logout: sessionLogout } = useAuthSession();
  const [loggingOut, setLoggingOut] = useState(false);

  useLayoutEffect(() => {
    if (status === 'guest') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'guest') return;
    if (user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [status, user, router]);

  const ready = status === 'authenticated' && user?.role === 'ADMIN';
  const email = user?.email ?? '';

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await sessionLogout();
    } finally {
      setLoggingOut(false);
    }
  }

  if (status === 'guest') {
    return null;
  }

  if (!ready) {
    return (
      <div className="admin-shell">
        <div className="admin-body admin-body--centered">
          <div className="admin-loading">
            <span className="auth-spinner" aria-hidden />
            <p>Verificando acceso…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Navegación admin">
        <div className="admin-sidebar__brand">
          <Logo
            href="/admin"
            size="md"
            hideTagline
            mark="brand"
            className="admin-sidebar__logo"
          />
        </div>

        <nav className="admin-sidebar__nav">
          {NAV.map((item) => {
            const active =
              'exact' in item && item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-sidebar__link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <AppIcon name={item.icon} size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <p className="admin-sidebar__user" title={email}>
            {email}
          </p>
          <div className="admin-sidebar__footer-actions">
            <Link href="/" className="admin-sidebar__ghost">
              <AppIcon name="globe" size={14} />
              Sitio
            </Link>
            <button
              type="button"
              className="admin-sidebar__ghost"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <AppIcon name="log-out" size={14} />
              {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      </aside>

      <div className="admin-body">
        <header className="admin-mobile-bar">
          <Logo
            href="/admin"
            size="md"
            hideTagline
            mark="brand"
            className="admin-sidebar__logo"
          />
          <nav className="admin-mobile-bar__tabs" aria-label="Admin móvil">
            {NAV.map((item) => {
              const active =
                'exact' in item && item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? 'is-active' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
