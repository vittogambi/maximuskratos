'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthSession } from '@/components/auth-session-provider';
import { Logo } from '@/components/logo';

const PAGE_TITLES: Record<string, string> = {
  '/panel':  'Inicio',
  '/perfil': 'Mi Perfil',
  '/ruta':   'Ruta MK',
  '/cuenta': 'Cuenta',
  '/calendario': 'Calendario',
  '/planes': 'Planes',
  '/proposito': 'Hoja de ruta',
  '/asesores': 'Asesores',
  '/mente': 'Mente',
  '/espiritu': 'Espíritu',
  '/cuerpo': 'Cuerpo',
};

function resolvePageTitle(pathname: string): string {
  if (pathname.startsWith('/diagnostico/resultado')) return 'Mi Perfil';
  return PAGE_TITLES[pathname] ?? 'Maximus Kratos';
}

export function AppTopBar() {
  const pathname = usePathname();
  const { user } = useAuthSession();
  const title = resolvePageTitle(pathname);
  const initial = user?.email?.[0]?.toUpperCase() ?? 'M';

  return (
    <header className="mk-top-bar">
      <Logo href="/panel" size="sm" mark="brand" markOnly className="mk-top-bar__logo" />
      <p className="mk-top-bar__title">{title}</p>
      <div className="mk-top-bar__tools">
        <Link href="/cuenta" className="mk-top-bar__avatar" aria-label="Cuenta">
          {initial}
        </Link>
      </div>
    </header>
  );
}
