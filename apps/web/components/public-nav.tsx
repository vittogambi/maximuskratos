'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppIcon } from '@/components/app-icon';
import { Logo } from './logo';
import { PublicAuthActions } from '@/components/public-auth-actions';
import { landingSections, publicNav, type NavItem } from '@/lib/design';

const LANDING_SECTION_IDS = landingSections.map((section) => section.id);

const LEGACY_HASH_MAP: Record<string, string> = {
  '#sistema': '#funcionamiento',
  '#marco': '#marco-central',
  '#faq': '#preguntas-frecuentes',
};

function normalizeHash(hash: string): string {
  return LEGACY_HASH_MAP[hash] ?? hash;
}

function hashFromHref(href: string): string | null {
  const i = href.indexOf('#');
  return i === -1 ? null : href.slice(i);
}

function isActiveLink(href: string, pathname: string, activeHash: string): boolean {
  const linkHash = hashFromHref(href);
  if (linkHash) {
    return pathname === '/' && activeHash === linkHash;
  }
  return pathname === href;
}

function scrollToSection(hash: string) {
  const id = hash.replace('#', '');
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function writeHash(hash: string) {
  window.history.replaceState(null, '', hash ? `/${hash}` : '/');
}

function isPageReload(): boolean {
  if (typeof performance === 'undefined') return false;
  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return entry?.type === 'reload';
}

function useActiveSection(pathname: string) {
  const [activeHash, setActiveHash] = useState('');
  const clickedRef = useRef(false);

  const setActiveHashFromNav = useCallback((hash: string) => {
    clickedRef.current = true;
    setActiveHash(hash);
    if (pathname === '/') {
      writeHash(hash);
      scrollToSection(hash);
    }
    window.setTimeout(() => {
      clickedRef.current = false;
    }, 800);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/') {
      setActiveHash('');
      return;
    }

    if (isPageReload()) {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      if (window.location.hash) writeHash('');
      window.scrollTo({ top: 0, behavior: 'auto' });
      setActiveHash('');
    } else {
      let hash = window.location.hash;
      if (hash) {
        const normalized = normalizeHash(hash);
        if (normalized !== hash) {
          writeHash(normalized);
          hash = normalized;
        }
        setActiveHash(hash);
        requestAnimationFrame(() => scrollToSection(hash));
      } else {
        setActiveHash('');
      }
    }

    const activationLine = () => Math.round(window.innerHeight * 0.18);

    const updateActiveSection = () => {
      if (clickedRef.current) return;

      if (window.scrollY < 200) {
        setActiveHash('');
        if (window.location.hash) writeHash('');
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
        if (window.location.hash !== next) writeHash(next);
      } else if (window.location.hash) {
        writeHash('');
      }
    };

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection, { passive: true });
    updateActiveSection();
    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [pathname]);

  useEffect(() => {
    const onHashChange = () => {
      let hash = window.location.hash;
      if (pathname === '/' && hash) {
        const normalized = normalizeHash(hash);
        if (normalized !== hash) {
          writeHash(normalized);
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
    setActiveHash('');
    writeHash('');
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
  const linkHash = hashFromHref(href);
  if (!linkHash) return;

  setActiveHashFromNav(linkHash);
  onNavigate?.();

  if (pathname === '/') {
    e.preventDefault();
  }
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

  return (
    <Link
      href={link.href}
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

  const landingLinks = publicNav.slice(0, 3);
  const pageLinks = publicNav.slice(3);

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
          <p className="mobile-drawer__group-label">Plataforma</p>
          {landingLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`mobile-drawer__link${isActiveLink(link.href, pathname, activeHash) ? ' is-active' : ''}`}
              onClick={(e) => handleHashClick(e, link.href, pathname, setActiveHashFromNav, () => setOpen(false))}
            >
              {link.label}
            </Link>
          ))}
          <p className="mobile-drawer__group-label">Sitio</p>
          {pageLinks.map((link) => (
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
