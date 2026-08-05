'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppIcon } from '@/components/app-icon';
import { handleLandingHashClick } from '@/components/landing-hash-link';
import { Logo } from './logo';
import { PublicAuthActions } from '@/components/public-auth-actions';
import {
  drawerConoceMkNav,
  drawerPlataformaNav,
  drawerSitioNav,
  landingSections,
  publicNavLanding,
  publicNavPages,
  type NavItem,
} from '@/lib/design';
import {
  applyLandingHashFromLocation,
  clearPendingLandingHash,
  hashFromHref,
  normalizeLandingHash,
  peekPendingLandingHash,
  writeLandingHash,
} from '@/lib/landing-nav';

const LANDING_SECTION_IDS = landingSections.map((section) => section.id);

function isActiveLink(href: string, pathname: string, activeHash: string): boolean {
  const linkHash = hashFromHref(href);
  if (linkHash) {
    return pathname === '/' && activeHash === linkHash;
  }
  return pathname === href;
}

function isPageReload(): boolean {
  if (typeof performance === 'undefined') return false;
  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return entry?.type === 'reload';
}

function useActiveSection(pathname: string) {
  const [activeHash, setActiveHash] = useState('');
  const clickedRef = useRef(false);
  const sectionNavLockRef = useRef(false);

  const runSectionNavigation = useCallback((hash: string) => {
    const normalized = normalizeLandingHash(hash);
    clickedRef.current = true;
    sectionNavLockRef.current = true;
    setActiveHash(normalized);
    writeLandingHash(normalized);
    applyLandingHashFromLocation((found) => {
      window.setTimeout(() => {
        clickedRef.current = false;
        if (found) sectionNavLockRef.current = false;
      }, found ? 1200 : 150);
      if (!found) sectionNavLockRef.current = false;
    });
  }, []);

  const setActiveHashFromNav = useCallback((hash: string) => {
    if (pathname === '/') {
      runSectionNavigation(hash);
      return;
    }
    clickedRef.current = true;
    sectionNavLockRef.current = true;
    setActiveHash(hash);
  }, [pathname, runSectionNavigation]);

  useEffect(() => {
    if (pathname !== '/') {
      setActiveHash('');
      return;
    }

    if (isPageReload()) {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      clearPendingLandingHash();
      if (window.location.hash) writeLandingHash('');
      window.scrollTo({ top: 0, behavior: 'auto' });
      setActiveHash('');
    } else {
      const pending = peekPendingLandingHash();
      const locationHash =
        typeof window !== 'undefined' && window.location.hash
          ? normalizeLandingHash(window.location.hash)
          : null;
      const hash = pending ?? locationHash;
      if (hash) {
        runSectionNavigation(hash);
      } else {
        setActiveHash('');
      }
    }

    const activationLine = () => Math.round(window.innerHeight * 0.18);

    const updateActiveSection = () => {
      if (clickedRef.current || sectionNavLockRef.current) return;
      if (peekPendingLandingHash()) return;

      if (window.scrollY < 200) {
        setActiveHash('');
        if (window.location.hash) writeLandingHash('');
        return;
      }

      const line = activationLine();
      let activeId = '';

      for (const id of LANDING_SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) {
          activeId = id;
        }
      }

      const next = activeId ? `#${activeId}` : '';
      setActiveHash(next);
      if (next) {
        if (window.location.hash !== next) writeLandingHash(next);
      } else if (window.location.hash) {
        writeLandingHash('');
      }
    };

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection, { passive: true });
    updateActiveSection();
    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [pathname, runSectionNavigation]);

  useEffect(() => {
    const onHashChange = () => {
      let hash = window.location.hash;
      if (pathname === '/' && hash) {
        const normalized = normalizeLandingHash(hash);
        if (normalized !== hash) {
          writeLandingHash(normalized);
          hash = normalized;
        }
      }
      setActiveHash(pathname === '/' ? hash : '');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [pathname]);

  const clearHomeNav = useCallback(() => {
    clickedRef.current = true;
    sectionNavLockRef.current = false;
    clearPendingLandingHash();
    setActiveHash('');
    writeLandingHash('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.setTimeout(() => {
      clickedRef.current = false;
    }, 1200);
  }, []);

  return { activeHash, setActiveHashFromNav, clearHomeNav };
}

function handleHashClick(
  e: MouseEvent<HTMLAnchorElement>,
  href: string,
  pathname: string,
  setActiveHashFromNav: (hash: string) => void,
  onNavigate?: () => void,
) {
  handleLandingHashClick(e, href, pathname, setActiveHashFromNav, onNavigate);
}

function NavLink({
  link,
  pathname,
  activeHash,
  setActiveHashFromNav,
}: {
  link: NavItem;
  pathname: string;
  activeHash: string;
  setActiveHashFromNav: (hash: string) => void;
}) {
  const short = 'shortLabel' in link ? link.shortLabel : link.label;
  const linkHash = hashFromHref(link.href);

  return (
    <Link
      href={link.href}
      scroll={linkHash ? false : true}
      className={`public-nav__link${isActiveLink(link.href, pathname, activeHash) ? ' is-active' : ''}`}
      onClick={(e) => handleHashClick(e, link.href, pathname, setActiveHashFromNav)}
    >
      <span className="public-nav__label public-nav__label--full">{link.label}</span>
      <span className="public-nav__label public-nav__label--short">{short}</span>
    </Link>
  );
}

function handleHomeClick(
  e: MouseEvent<HTMLAnchorElement>,
  pathname: string,
  clearHomeNav: () => void,
  onAfter?: () => void,
) {
  clearHomeNav();
  onAfter?.();
  if (pathname === '/') {
    e.preventDefault();
  }
}

export function PublicNav() {
  const pathname = usePathname();
  const { activeHash, setActiveHashFromNav, clearHomeNav } = useActiveSection(pathname);
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const landingLinks = publicNavLanding;
  const pageLinks = publicNavPages;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = drawerRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])',
    );
    focusable[0]?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
      if (e.key !== 'Tab') return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const navClass = [
    'public-nav',
    isHome && !scrolled ? 'public-nav--transparent' : '',
    scrolled ? 'is-scrolled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <nav className={navClass} aria-label="Navegación principal">
        <div className="public-nav__inner">
          <div className="public-nav__brand">
            <Logo
              href="/"
              size="md"
              hideTagline
              mark="brand"
              className="public-nav__logo"
              onClick={(e) => handleHomeClick(e, pathname, clearHomeNav)}
            />
          </div>

          <div className="public-nav__center">
            <ul className="public-nav__links public-nav__links--landing" role="list">
              {landingLinks.map((link) => (
                <li key={link.href}>
                  <NavLink
                    link={link}
                    pathname={pathname}
                    activeHash={activeHash}
                    setActiveHashFromNav={setActiveHashFromNav}
                  />
                </li>
              ))}
            </ul>
            <span className="public-nav__divider" aria-hidden />
            <ul className="public-nav__links public-nav__links--pages" role="list">
              {pageLinks.map((link) => (
                <li key={link.href}>
                  <NavLink
                    link={link}
                    pathname={pathname}
                    activeHash={activeHash}
                    setActiveHashFromNav={setActiveHashFromNav}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className="public-nav__actions">
            <PublicAuthActions pathname={pathname} />
            <button
              type="button"
              className="public-nav__hamburger"
              aria-label="Abrir menú"
              aria-expanded={open}
              aria-controls="mobile-drawer"
              onClick={() => setOpen(true)}
            >
              <AppIcon name="menu" size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`mobile-drawer-backdrop${open ? ' is-open' : ''}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      <div
        ref={drawerRef}
        id="mobile-drawer"
        className={`mobile-drawer${open ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="mobile-drawer__header">
          <Logo
            href="/"
            size="sm"
            hideTagline
            mark="brand"
            onClick={(e) => handleHomeClick(e, pathname, clearHomeNav, () => setOpen(false))}
          />
          <button
            type="button"
            className="mobile-drawer__close"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            <AppIcon name="x" size={18} />
          </button>
        </div>

        <nav className="mobile-drawer__links" aria-label="Navegación móvil">
          <p className="mobile-drawer__group-label">Conoce MK</p>
          {drawerConoceMkNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              scroll={false}
              className={`mobile-drawer__link${isActiveLink(link.href, pathname, activeHash) ? ' is-active' : ''}`}
              onClick={(e) => handleHashClick(e, link.href, pathname, setActiveHashFromNav, () => setOpen(false))}
            >
              {link.label}
            </Link>
          ))}
          <p className="mobile-drawer__group-label">Explora</p>
          {drawerPlataformaNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`mobile-drawer__link${isActiveLink(link.href, pathname, activeHash) ? ' is-active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <p className="mobile-drawer__group-label">Más</p>
          {drawerSitioNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`mobile-drawer__link${isActiveLink(link.href, pathname, activeHash) ? ' is-active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <PublicAuthActions variant="drawer" onNavigate={() => setOpen(false)} />
      </div>
    </>
  );
}
