'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppIcon } from '@/components/app-icon';
import { Logo } from '@/components/logo';

const LINKS = [
  { href: '/panel', label: 'Inicio', icon: 'layout-dashboard' },
  { href: '/espiritu', label: 'Espíritu', icon: 'flame' },
  { href: '/mente', label: 'Mente', icon: 'brain' },
  { href: '/cuerpo', label: 'Cuerpo', icon: 'dumbbell' },
  { href: '/ruta', label: 'Ruta', icon: 'compass' },
  { href: '/calendario', label: 'Calendario', icon: 'calendar' },
  { href: '/planes', label: 'Planes', icon: 'map' },
  { href: '/proposito', label: 'Propósito', icon: 'target' },
  { href: '/perfil', label: 'Perfil', icon: 'fingerprint' },
  { href: '/asesores', label: 'Asesores', icon: 'handshake' },
  { href: '/cuenta', label: 'Cuenta', icon: 'user-check' },
] as const;

export function MemberSideNav() {
  const pathname = usePathname();
  return (
    <aside className="mk-side-nav">
      <Logo href="/panel" size="sm" mark="brand" markOnly />
      <nav aria-label="Secciones">
        {LINKS.map((link) => {
          const active = pathname === link.href
            || (link.href === '/perfil' && pathname.startsWith('/diagnostico/resultado'));
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
