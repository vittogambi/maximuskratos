'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';
import {
  applyLandingHashFromLocation,
  hashFromHref,
  navigateToLandingSection,
  normalizeLandingHash,
  writeLandingHash,
} from '@/lib/landing-nav';

type LandingHashLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
  onActivate?: (hash: string) => void;
};

export function LandingHashLink({
  href,
  className,
  children,
  onNavigate,
  onActivate,
}: LandingHashLinkProps) {
  const pathname = usePathname();
  const linkHash = hashFromHref(href);

  return (
    <Link
      href={href}
      scroll={false}
      className={className}
      onClick={(e) => {
        if (!linkHash) {
          onNavigate?.();
          return;
        }

        const normalized = normalizeLandingHash(linkHash);
        onActivate?.(normalized);
        onNavigate?.();
        e.preventDefault();

        if (pathname === '/') {
          writeLandingHash(normalized);
          applyLandingHashFromLocation();
          return;
        }

        navigateToLandingSection(normalized);
      }}
    >
      {children}
    </Link>
  );
}

export function handleLandingHashClick(
  e: MouseEvent<HTMLAnchorElement>,
  href: string,
  pathname: string,
  onActivate: (hash: string) => void,
  onNavigate?: () => void,
) {
  const linkHash = hashFromHref(href);
  if (!linkHash) return;

  const normalized = normalizeLandingHash(linkHash);
  onActivate(normalized);
  onNavigate?.();
  e.preventDefault();

  if (pathname === '/') {
    writeLandingHash(normalized);
    applyLandingHashFromLocation();
    return;
  }

  navigateToLandingSection(normalized);
}
