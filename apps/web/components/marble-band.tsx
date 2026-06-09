import Image from 'next/image';
import type { ReactNode } from 'react';

interface MarbleBandProps {
  imageSrc: string | null;
  imageAlt?: string;
  children: ReactNode;
}

/**
 * Full-width atmospheric band with a background image (or a gradient placeholder).
 * Use for section dividers, pull-quotes, or CTA moments.
 */
export function MarbleBand({ imageSrc, imageAlt = '', children }: MarbleBandProps) {
  return (
    <div className="marble-band">
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="100vw"
          className="marble-band__bg"
          style={{ objectFit: 'cover' }}
        />
      ) : (
        /* Gradient placeholder until a real texture asset lands */
        <div
          className="marble-band__bg"
          style={{
            background: 'linear-gradient(135deg, #09090B 0%, #222228 40%, #111114 70%, #09090B 100%)',
          }}
          aria-hidden
        />
      )}
      <div className="marble-band__overlay" aria-hidden />
      <div className="marble-band__content">{children}</div>
    </div>
  );
}
