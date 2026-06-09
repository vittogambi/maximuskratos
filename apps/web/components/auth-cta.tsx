'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';

type AuthCtaProps = {
  href?: string;
  className?: string;
  children: ReactNode;
};

/** Register/signup CTA — hidden once the user already has a session. */
export function AuthCta({ href = '/register', className, children }: AuthCtaProps) {
  const { status, user } = useAuthSession();

  if (status === 'loading') {
    return null;
  }

  if (status === 'authenticated' && user) {
    if (user.role === 'ADMIN') {
      return (
        <Link href="/admin" className={className}>
          Ir al panel
        </Link>
      );
    }
    return null;
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

type GuestAuthLinksProps = {
  registerClassName?: string;
  loginClassName?: string;
  registerLabel?: string;
  loginLabel?: string;
};

/** Pair of register + login links — omitted when a session is active. */
export function GuestAuthLinks({
  registerClassName,
  loginClassName,
  registerLabel = 'Crear cuenta gratis',
  loginLabel = 'Iniciar sesión',
}: GuestAuthLinksProps) {
  const { status, user } = useAuthSession();

  if (status === 'loading') {
    return null;
  }

  if (status === 'authenticated' && user) {
    if (user.role === 'ADMIN') {
      return (
        <Link href="/admin" className={registerClassName}>
          Ir al panel
        </Link>
      );
    }
    return (
      <p className="public-auth-session-note font-body-md">
        Sesión iniciada como {user.email}
      </p>
    );
  }

  return (
    <>
      <Link href="/register" className={registerClassName}>
        {registerLabel}
      </Link>
      <Link href="/login" className={loginClassName}>
        {loginLabel}
      </Link>
    </>
  );
}
