'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from './logo';
import { PublicNav } from './public-nav';
import { AUTH_ATMOSPHERE, type AuthAtmosphereVariant } from '@/lib/assets';
import { cn } from '@/lib/cn';

type AuthShellProps = {
  title: string;
  description: string | ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Landing statue mood: broken for register, aligned for login */
  atmosphere?: AuthAtmosphereVariant;
  /** Show public site navbar (login, register, forgot password) */
  showNav?: boolean;
};

export function AuthShell({
  title,
  description,
  children,
  footer,
  atmosphere = 'default',
  showNav = false,
}: AuthShellProps) {
  const scene = AUTH_ATMOSPHERE[atmosphere];

  return (
    <div className={cn('auth-shell', showNav && 'auth-shell--with-nav')}>
      {showNav ? <PublicNav /> : null}
      <div className="auth-page">
      <div
        className={`auth-atmosphere auth-atmosphere--${atmosphere}`}
        aria-hidden
      >
        <div className="auth-atmosphere__image">
          {/* Native img — same as landing sticky scenes; avoids Next Image resize/compression */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scene.src}
            alt=""
            decoding="async"
            style={{ objectPosition: scene.objectPosition }}
          />
        </div>
        <div className="auth-atmosphere__scrim" />
        <div className="auth-atmosphere__vignette" />
        <div className="auth-atmosphere__glow auth-atmosphere__glow--gold" />
        <div className="auth-atmosphere__glow auth-atmosphere__glow--crimson" />
        <div className="auth-atmosphere__tagline">
          <p className="auth-atmosphere__eyebrow">Maximus Kratos</p>
          <p className="auth-atmosphere__quote">&ldquo;{scene.quote}&rdquo;</p>
        </div>
      </div>

      <div className="auth-page__form-col">
        <div className="auth-panel">
          <header className="auth-header">
            <Logo href="/" size="md" mark="brand" markOnly className="auth-header__logo" />
            <div className="gold-rule auth-header__rule" aria-hidden />
            <h1>{title}</h1>
            <p className="auth-description">{description}</p>
          </header>
          <div className="auth-card">{children}</div>
          {footer ? <footer className="auth-footer">{footer}</footer> : null}
        </div>
      </div>
    </div>
    </div>
  );
}

export function AuthFooterLink({
  text,
  linkText,
  href,
}: {
  text: string;
  linkText: string;
  href: string;
}) {
  return (
    <p className="auth-footer-text">
      {text}{' '}
      <Link href={href} className="auth-link">
        {linkText}
      </Link>
    </p>
  );
}
