'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AppIcon } from '@/components/app-icon';
import { APP_MOTION, MOTION_EASE } from '@/components/motion/tokens';

const TABS = [
  {
    href: '/panel',
    label: 'Inicio',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <polyline points="9,21 9,12 15,12 15,21" />
      </svg>
    ),
  },
  {
    href: '/ruta',
    label: 'Ruta',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    href: '/perfil',
    label: 'Perfil',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
] as const;

const MORE_LINKS = [
  { href: '/espiritu', label: 'Espíritu', icon: 'flame' },
  { href: '/mente', label: 'Mente', icon: 'brain' },
  { href: '/cuerpo', label: 'Cuerpo', icon: 'dumbbell' },
  { href: '/calendario', label: 'Calendario', icon: 'calendar' },
  { href: '/planes', label: 'Planes', icon: 'map' },
  { href: '/proposito', label: 'Propósito', icon: 'target' },
  { href: '/asesores', label: 'Asesores', icon: 'handshake' },
  { href: '/cuenta', label: 'Cuenta', icon: 'user-check' },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const moreActive = MORE_LINKS.some((link) => pathname === link.href || pathname.startsWith(`${link.href}/`));

  function close(focusButton = true) {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  }

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector('a')?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close(true);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <nav className="mk-bottom-tabs" aria-label="Navegación principal">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href ||
          (tab.href === '/perfil' && pathname.startsWith('/diagnostico/resultado')) ||
          (tab.href !== '/panel' && tab.href !== '/perfil' && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`mk-tab${active ? ' mk-tab--active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {active && !reduced ? (
              <motion.span
                className="mk-tab__indicator"
                layoutId="mk-tab-indicator"
                transition={{
                  type: 'tween',
                  duration: APP_MOTION.duration.interaction,
                  ease: MOTION_EASE.standard,
                }}
              />
            ) : active ? (
              <span className="mk-tab__indicator" />
            ) : null}
            <span className="mk-tab__icon">{tab.icon(active)}</span>
            <span className="mk-tab__label">{tab.label}</span>
          </Link>
        );
      })}
      <div className="mk-more mk-more--bar">
        <button
          ref={buttonRef}
          type="button"
          className={`mk-tab mk-more__toggle${open || moreActive ? ' mk-tab--active' : ''}`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => (open ? close(false) : setOpen(true))}
        >
          <span className="mk-tab__icon" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={open || moreActive ? 2 : 1.5} strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </span>
          <span className="mk-tab__label">Más</span>
        </button>
        {open ? (
          <>
            <button type="button" className="mk-more__backdrop" aria-label="Cerrar menú" onClick={() => close(true)} />
            <motion.nav
              ref={panelRef}
              id={panelId}
              aria-label="Otras secciones"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : APP_MOTION.duration.panel, ease: MOTION_EASE.standard }}
            >
              {MORE_LINKS.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined} onClick={() => close(false)}>
                    <AppIcon name={link.icon} size={20} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </motion.nav>
          </>
        ) : null}
      </div>
    </nav>
  );
}
