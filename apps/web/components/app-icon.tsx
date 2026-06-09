import type { SVGProps } from 'react';

import { cn } from '@/lib/cn';
import { ICON_REGISTRY, resolveIconName, type AppIconName } from '@/components/icons/registry';

export interface AppIconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /** Icons0 icon id, e.g. `arrow-right` or `lucide:arrow-right`. */
  name: AppIconName | `lucide:${AppIconName}` | 'lucide:check-circle' | 'lucide:x-circle' | string;
  size?: number;
}

export function AppIcon({
  name,
  size = 20,
  className,
  style,
  'aria-hidden': ariaHidden = true,
  ...rest
}: AppIconProps) {
  const key = resolveIconName(name);
  if (!key) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[AppIcon] Unknown icon: ${name}`);
    }
    return null;
  }

  const IconComponent = ICON_REGISTRY[key];

  return (
    <IconComponent
      className={cn('shrink-0', className)}
      style={{ width: size, height: size, ...style }}
      aria-hidden={ariaHidden}
      {...rest}
    />
  );
}
