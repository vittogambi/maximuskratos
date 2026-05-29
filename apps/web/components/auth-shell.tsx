import Link from 'next/link';
import type { ReactNode } from 'react';

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <header className="auth-header">
          <p className="auth-brand">Maximus Kratos</p>
          <h1>{title}</h1>
          <p className="auth-description">{description}</p>
        </header>
        <div className="auth-card">{children}</div>
        {footer ? <footer className="auth-footer">{footer}</footer> : null}
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
