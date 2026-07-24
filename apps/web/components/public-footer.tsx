'use client';

import Link from 'next/link';
import { AuthCta } from '@/components/auth-cta';
import { LandingHashLink } from '@/components/landing-hash-link';
import { useAuthSession } from '@/components/auth-session-provider';
import { FooterSocialBar } from './footer-social-bar';
import { Logo } from './logo';
import {
  footerLegalNav,
  footerPlatformNav,
  footerSiteNav,
  publicNavAuth,
  siteConfig,
} from '@/lib/design';

function FooterNavColumn({
  title,
  links,
  ariaLabel,
  useLandingHash = false,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
  ariaLabel: string;
  useLandingHash?: boolean;
}) {
  return (
    <div className="site-footer__col">
      <p className="site-footer__col-title">{title}</p>
      <nav className="site-footer__col-links" aria-label={ariaLabel}>
        {links.map((link) =>
          useLandingHash ? (
            <LandingHashLink key={link.href + link.label} href={link.href} className="site-footer__link">
              {link.label}
            </LandingHashLink>
          ) : (
            <Link key={link.href + link.label} href={link.href} className="site-footer__link">
              {link.label}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}

export function PublicFooter() {
  const year = new Date().getFullYear();
  const { status } = useAuthSession();
  const showGuestAccess = status !== 'authenticated';

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__glow" aria-hidden />
      <div className="site-footer__inner">
        <div className="site-footer__panel">
          <div className="site-footer__main">
            <div className="site-footer__brand">
              <Logo href="/" size="md" mark="brand" hideTagline className="site-footer__logo" />
              <p className="site-footer__tagline">
                {siteConfig.tagline}
              </p>
              <p className="site-footer__desc">
                Sistema de reconstrucción personal para hombres que buscan alineación real.
              </p>
              <p className="site-footer__status">
                Acceso anticipado abierto. Diagnóstico y apps próximamente.
              </p>
              <FooterSocialBar />
              <AuthCta href={publicNavAuth.register.href} className="site-footer__cta">
                {publicNavAuth.register.label}
              </AuthCta>
              {showGuestAccess ? (
                <Link href={publicNavAuth.login.href} className="site-footer__login">
                  ¿Ya tienes cuenta? {publicNavAuth.login.label}
                </Link>
              ) : null}
            </div>

            <div className="site-footer__nav">
              <FooterNavColumn
                title="Explora"
                links={footerPlatformNav}
                ariaLabel="Secciones de la página principal"
                useLandingHash
              />
              <FooterNavColumn
                title="Sitio"
                links={footerSiteNav}
                ariaLabel="Enlaces del sitio"
              />
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <nav className="site-footer__legal" aria-label="Enlaces legales">
            {footerLegalNav.map((link) => (
              <Link key={link.href + link.label} href={link.href} className="site-footer__legal-link">
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="site-footer__copy">
            © {year} {siteConfig.name}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
