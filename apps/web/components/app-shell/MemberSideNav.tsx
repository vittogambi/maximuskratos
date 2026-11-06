'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppIcon } from '@/components/app-icon';
import { Logo } from '@/components/logo';
import { isMemberNavActive } from '@/lib/member-nav';

const LINKS = [
  { href: '/panel', label: 'Inicio', icon: 'layout-dashboard' },
  { href: '/semana', label: 'Semana', icon: 'calendar' },
  { href: '/disenar', label: 'Diseñar', icon: 'map' },
  { href: '/planes', label: 'Planes', icon: 'layout-grid' },
  { href: '/proposito', label: 'Propósito', icon: 'target' },
  { href: '/memoria', label: 'Memoria', icon: 'fingerprint' },
  { href: '/cuenta', label: 'Cuenta', icon: 'user-check' },
] as const;

export function MemberSideNav() {
  const pathname = usePathname();
  return (
    <aside className="mk-side-nav">
      <Logo href="/panel" size="sm" mark="brand" markOnly />
      <nav aria-label="Navegación principal">
        {LINKS.map((link) => {
          const active = isMemberNavActive(pathname, link.href);
          return (
            <Link key={link.href} href={link.href} className={active ? 'is-active' : undefined} aria-current={active ? 'page' : undefined}>
              <AppIcon name={link.icon} size={16} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
