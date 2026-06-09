import { cn } from '@/lib/cn';
import type { ComponentPropsWithRef } from 'react';

interface StatProps extends ComponentPropsWithRef<'article'> {
  label: string;
  value: string | number;
}

export function Stat({ label, value, className, ...props }: StatProps) {
  return (
    <article className={cn('stat-card', className)} {...props}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
    </article>
  );
}
