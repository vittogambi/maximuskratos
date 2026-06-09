'use client';

import Link from 'next/link';
import { AppIcon } from '@/components/app-icon';
import { useAuthSession } from '@/components/auth-session-provider';
import { publicNavAuth } from '@/lib/design';

type PublicAuthActionsProps = {
  variant?: 'nav' | 'drawer';
  onNavigate?: () => void;
  pathname?: string;
};

export function PublicAuthActions({
  variant = 'nav',
  onNavigate,
  pathname = '',
}: PublicAuthActionsProps) {
  const { status, user, logout } = useAuthSession();

  if (status === 'loading') {
    return null;
  }

  if (status === 'authenticated' && user) {
    const isAdmin = user.role === 'ADMIN';

    if (variant === 'drawer') {
      return (
        <div className="mobile-drawer__actions mobile-drawer__actions--session">
          <p className="mobile-drawer__session-email" title={user.email}>
            {user.email}
          </p>
          {isAdmin ? (
            <Link
              href="/admin"
              className="public-nav__cta public-nav__cta--block public-nav__action-with-icon"
              onClick={onNavigate}
            >
              <AppIcon name="layout-dashboard" size={16} aria-hidden />
              Panel Admin
            </Link>
          ) : null}
          <button
            type="button"
            className="mobile-drawer__login public-nav__action-with-icon"
            onClick={() => {
              void logout();
              onNavigate?.();
            }}
          >
            <AppIcon name="log-out" size={16} aria-hidden />
            Cerrar sesión
          </button>
        </div>
      );
    }

    return (
      <>
        {isAdmin ? (
          <Link href="/admin" className="public-nav__login public-nav__action-with-icon">
            <AppIcon name="layout-dashboard" size={15} aria-hidden />
            <span className="public-nav__label public-nav__label--full">Panel Admin</span>
            <span className="public-nav__label public-nav__label--short">Admin</span>
          </Link>
        ) : (
          <span className="public-nav__session" title={user.email}>
            <span className="public-nav__label public-nav__label--full">Sesión activa</span>
            <span className="public-nav__label public-nav__label--short">Activo</span>
          </span>
        )}
        <button
          type="button"
          className="public-nav__cta public-nav__cta--ghost public-nav__action-with-icon"
          onClick={() => void logout()}
        >
          <AppIcon name="log-out" size={15} aria-hidden />
          Salir
        </button>
      </>
    );
  }

  if (variant === 'drawer') {
    return (
      <div className="mobile-drawer__actions">
        <Link
          href={publicNavAuth.register.href}
          className="public-nav__cta public-nav__cta--block"
          onClick={onNavigate}
        >
          {publicNavAuth.register.label}
        </Link>
        <Link
          href={publicNavAuth.login.href}
          className="mobile-drawer__login"
          onClick={onNavigate}
        >
          {publicNavAuth.login.label}
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href={publicNavAuth.login.href}
        className={`public-nav__login${pathname === publicNavAuth.login.href ? ' is-active' : ''}`}
      >
        <span className="public-nav__label public-nav__label--full">
          {publicNavAuth.login.label}
        </span>
        <span className="public-nav__label public-nav__label--short">Acceder</span>
      </Link>
      <Link
        href={publicNavAuth.register.href}
        className={`public-nav__cta${pathname === publicNavAuth.register.href ? ' is-active' : ''}`}
      >
        {publicNavAuth.register.label}
      </Link>
    </>
  );
}
