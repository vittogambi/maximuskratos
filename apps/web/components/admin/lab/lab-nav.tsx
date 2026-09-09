'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUnsavedChanges } from '@/components/admin/unsaved-changes';

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  match?: (pathname: string) => boolean;
};

const PRIMARY: NavItem[] = [
  { href: '/admin/lab', label: 'Revisión', match: isReviewPath },
  { href: '/admin/lab/findings', label: 'Hallazgos', match: isHallazgosPath },
  { href: '/admin/lab/readiness', label: 'Estado' },
];

const TAB_HREFS = PRIMARY.map((item) => item.href);

function isReviewPath(pathname: string) {
  return (
    pathname === '/admin/lab' ||
    pathname.startsWith('/admin/lab/families') ||
    pathname.startsWith('/admin/lab/runs') ||
    pathname.startsWith('/admin/lab/cases') ||
    pathname.startsWith('/admin/lab/session') ||
    pathname.startsWith('/admin/lab/findings/migrations')
  );
}

function isHallazgosPath(pathname: string) {
  if (pathname.startsWith('/admin/lab/findings/migrations')) return false;
  return (
    pathname === '/admin/lab/findings' ||
    pathname.startsWith('/admin/lab/findings/questions') ||
    /^\/admin\/lab\/findings\/[^/]+$/.test(pathname)
  );
}

function NavLink({
  href,
  label,
  exact,
  match,
  pathname,
  tryNavigate,
}: {
  href: string;
  label: string;
  exact?: boolean;
  match?: (pathname: string) => boolean;
  pathname: string;
  tryNavigate: (href: string) => boolean;
}) {
  const active = match ? match(pathname) : exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={active ? 'lab-nav__link is-active' : 'lab-nav__link'}
      aria-current={active ? 'page' : undefined}
      onClick={(event) => {
        if (pathname === href) return;
        if (!tryNavigate(href)) event.preventDefault();
      }}
    >
      {label}
    </Link>
  );
}

export function LabNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { tryNavigate } = useUnsavedChanges();

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      for (const href of TAB_HREFS) {
        router.prefetch(href);
      }
      if (process.env.NODE_ENV !== 'development') return;
      void (async () => {
        for (const href of TAB_HREFS) {
          if (cancelled) return;
          try {
            await fetch(href, { credentials: 'same-origin' });
          } catch {
            /* A failed fetch still forces Next to compile the route. */
          }
        }
      })();
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [router]);
  return (
    <nav className="lab-nav" aria-label="Revisión de Matriz v2">
      {PRIMARY.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          exact={item.exact}
          match={item.match}
          pathname={pathname}
          tryNavigate={tryNavigate}
        />
      ))}
    </nav>
  );
}

export function DualStatus({
  matrixLabel,
  productLabel,
  purposeLabel,
}: {
  matrixLabel: string;
  productLabel: string;
  purposeLabel?: string;
}) {
  return (
    <div className="lab-dual">
      <div>
        <span className="lab-dual__k">Revisión de la Matriz</span>
        <span className="lab-dual__v">{matrixLabel}</span>
      </div>
      {purposeLabel ? (
        <div>
          <span className="lab-dual__k">Propósito y dirección</span>
          <span className="lab-dual__v">{purposeLabel}</span>
        </div>
      ) : null}
      <div>
        <span className="lab-dual__k">Producto / Ciclo</span>
        <span className="lab-dual__v">{productLabel}</span>
      </div>
    </div>
  );
}
