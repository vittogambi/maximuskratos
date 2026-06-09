import Image from 'next/image';
import Link from 'next/link';
import type { MouseEventHandler } from 'react';
import { cn } from '@/lib/cn';

type LogoProps = {
  size?: 'sm' | 'md';
  href?: string;
  hideTagline?: boolean;
  /** Shield mark only — no wordmark */
  markOnly?: boolean;
  /** Official MK shield mark from brand assets */
  mark?: 'brand' | 'image';
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

const SHIELD_ASPECT = 123 / 131;

function brandMarkWidth(size: 'sm' | 'md') {
  return size === 'md' ? 44 : 36;
}

function MkBrandMark({ size }: { size: 'sm' | 'md' }) {
  const width = brandMarkWidth(size);
  const height = Math.round(width * SHIELD_ASPECT);

  return (
    <Image
      src="/brand/mk-shield.png"
      alt=""
      width={width}
      height={height}
      sizes={`${width}px`}
      className="mk-logo__mark-brand"
      aria-hidden
    />
  );
}

function MkMarkImage({ size }: { size: 'sm' | 'md' }) {
  const width = brandMarkWidth(size);
  const height = Math.round(width * SHIELD_ASPECT);

  return (
    <Image
      src="/brand/mk-mark.svg"
      alt=""
      width={width}
      height={height}
      className="mk-logo__mark-brand"
      aria-hidden
    />
  );
}

function MKMark({ size, mark }: { size: 'sm' | 'md'; mark: 'brand' | 'image' }) {
  if (mark === 'brand') {
    return <MkBrandMark size={size} />;
  }

  return <MkMarkImage size={size} />;
}

export function Logo({
  size = 'md',
  href,
  hideTagline = false,
  markOnly = false,
  mark = 'brand',
  className,
  onClick,
}: LogoProps) {
  const inner = (
    <span className={cn(`mk-logo mk-logo--${size}`, markOnly && 'mk-logo--mark-only', className)}>
      <span className="mk-logo__mark">
        <MKMark size={size} mark={mark} />
      </span>
      {!markOnly && (
        <span className="mk-logo__text">
          <span className="mk-logo__name">MAXIMUS KRATOS</span>
          {!hideTagline && <span className="mk-logo__tagline">Alíneate</span>}
        </span>
      )}
    </span>
  );

  if (!href) return inner;

  return (
    <Link href={href} className="mk-logo-link" aria-label="Maximus Kratos, inicio" onClick={onClick}>
      {inner}
    </Link>
  );
}
