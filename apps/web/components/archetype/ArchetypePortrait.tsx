'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getArchetype } from '@/lib/archetypes';

type Props = {
  slug: string;
  size?: 'sm' | 'md' | 'lg';
  priority?: boolean;
  className?: string;
};

const SIZE_PX = { sm: 96, md: 160, lg: 280 } as const;

export function ArchetypePortrait({ slug, size = 'md', priority = false, className = '' }: Props) {
  const meta = getArchetype(slug);
  const [imageError, setImageError] = useState(false);
  const px = SIZE_PX[size];

  if (!meta) {
    return (
      <div
        className={`archetype-portrait archetype-portrait--${size} archetype-portrait--fallback ${className}`.trim()}
        aria-hidden
      >
        <span className="archetype-portrait__symbol">?</span>
      </div>
    );
  }

  const showFallback = imageError;

  return (
    <div
      className={`archetype-portrait archetype-portrait--${size}${showFallback ? ' archetype-portrait--fallback' : ''} ${className}`.trim()}
    >
      {!showFallback && (
        <Image
          src={meta.image}
          alt={meta.label}
          width={px}
          height={px}
          priority={priority}
          className="archetype-portrait__img"
          onError={() => setImageError(true)}
        />
      )}
      {showFallback && (
        <span className="archetype-portrait__symbol" aria-hidden>
          {meta.symbol}
        </span>
      )}
    </div>
  );
}
