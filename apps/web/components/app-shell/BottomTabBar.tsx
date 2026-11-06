'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import { APP_MOTION, MOTION_EASE } from '@/components/motion/tokens';

function TabBarIcon({ name }: { name: AppIconName }) {
  return <AppIcon name={name} size={22} />;
}

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
    href: '/semana',
    label: 'Semana',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: '/planes',
    label: 'Planes',
    icon: () => <TabBarIcon name="layout-grid" />,
  },
] as const;

const MORE_LINKS = [
  { href: '/memoria', label: 'Memoria', icon: 'fingerprint' },
  { href: '/disenar', label: 'Diseñar', icon: 'map' },
  { href: '/proposito', label: 'Propósito', icon: 'target' },
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
          (tab.href === '/planes' && pathname.startsWith('/planes')) ||
          (tab.href === '/panel' && pathname.startsWith('/ambito/')) ||
          (tab.href !== '/panel' && tab.href !== '/planes' && pathname.startsWith(tab.href));
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
            <TabBarIcon name={open ? 'x' : 'menu'} />
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
