import Image from 'next/image';
import type { ReactNode } from 'react';

interface StatueSectionProps {
  imageSrc: string | null;
  imageAlt?: string;
  reverse?: boolean;
  children: ReactNode;
}

/**
 * Two-column section: art on one side, text on the other.
 * When imageSrc is null, renders a styled gradient placeholder (drop-in slot).
 */
export function StatueSection({
  imageSrc,
  imageAlt = '',
  reverse = false,
  children,
}: StatueSectionProps) {
  return (
    <div className={`statue-section${reverse ? ' statue-section--reverse' : ''}`}>
      <div
        className={`statue-section__image${imageSrc ? '' : ' statue-section__image--placeholder'}`}
      >
        {imageSrc && (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
