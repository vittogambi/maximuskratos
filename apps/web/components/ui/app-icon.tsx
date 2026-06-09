'use client';

import React, { useEffect } from 'react';

/**
 * <AppIcon /> — the single standardized icon component for Maximus Kratos.
 *
 * Backed by Iconify (https://icones.js.org / icon-sets.iconify.design).
 * Primary icon set: lucide — usage: name="lucide:arrow-right"
 *
 * DO NOT use inline SVGs, emoji, or Unicode glyphs for UI icons.
 * Always use <AppIcon />.
 *
 * Size vocabulary: 12 | 14 | 16 | 18 | 20 | 22 | 24 | 28 | 32
 */

export interface AppIconProps {
  /** Iconify icon identifier. e.g. "lucide:arrow-right" */
  name: string;
  /** Icon size in px. Default 20. */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Provide for standalone icon buttons; omit for decorative icons. */
  'aria-label'?: string;
}

let iconifyLoaded = false;

export function AppIcon({ name, size = 20, className, style, 'aria-label': ariaLabel }: AppIconProps) {
  useEffect(() => {
    if (iconifyLoaded) return;
    iconifyLoaded = true;
    import('iconify-icon');
  }, []);

  const isDecorative = !ariaLabel;

  return (
    // @ts-expect-error — custom element declared in types/iconify.d.ts
    <iconify-icon
      icon={name}
      width={size}
      height={size}
      class={className}
      style={style}
      aria-hidden={isDecorative ? 'true' : undefined}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    />
  );
}
