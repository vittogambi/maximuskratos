'use client';

import { type MouseEvent } from 'react';
import { AppIcon } from '@/components/app-icon';
import { socialLinks } from '@/lib/design';

let lastOpenedAt = 0;

function openExternalOnce(href: string) {
  const now = Date.now();
  if (now - lastOpenedAt < 600) return;
  lastOpenedAt = now;
  window.open(href, '_blank', 'noopener,noreferrer');
}

export function FooterSocialBar() {
  function handleClick(event: MouseEvent<HTMLUListElement>) {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-social-href]',
    );
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    const href = button.dataset.socialHref;
    if (!href) return;

    openExternalOnce(href);
  }

  return (
    <ul
      className="site-footer__social-list"
      role="list"
      aria-label="Redes sociales"
      onClick={handleClick}
    >
      {socialLinks.map((social) => (
        <li key={social.icon} className="site-footer__social-item">
          <button
            type="button"
            className="site-footer__social-link"
            data-social-href={social.href}
            aria-label={`${social.label} (abre en nueva pestaña)`}
          >
            <AppIcon name={social.icon} size={18} aria-hidden className="site-footer__social-icon" />
          </button>
        </li>
      ))}
    </ul>
  );
}
