'use client';

import Link from 'next/link';
import { AuthCta } from '@/components/auth-cta';
import { useAuthSession } from '@/components/auth-session-provider';
import { FooterSocialBar } from './footer-social-bar';
import { Logo } from './logo';
import {
  footerAccessNav,
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
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
  ariaLabel: string;
}) {
  return (
    <div className="site-footer__col">
      <p className="site-footer__col-title">{title}</p>
      <nav className="site-footer__col-links" aria-label={ariaLabel}>
        {links.map((link) => (
          <Link key={link.href + link.label} href={link.href} className="site-footer__link">
            {link.label}
          </Link>
        ))}
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
                Diagnóstico, plan estratégico y ejecución diaria para hombres que buscan
                alineación real.
              </p>
              <FooterSocialBar />
              <AuthCta href={publicNavAuth.register.href} className="site-footer__cta">
                {publicNavAuth.register.label}
              </AuthCta>
            </div>

            <div className="site-footer__nav">
              <FooterNavColumn
                title="Plataforma"
                links={footerPlatformNav}
                ariaLabel="Enlaces de plataforma"
              />
              <FooterNavColumn
                title="Sitio"
                links={footerSiteNav}
                ariaLabel="Enlaces del sitio"
              />
              {showGuestAccess ? (
                <FooterNavColumn
                  title="Acceso"
                  links={footerAccessNav}
                  ariaLabel="Enlaces de acceso"
                />
              ) : null}
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
