import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import type { ComponentPropsWithRef } from 'react';

const cardVariants = cva('card', {
  variants: {
    variant: {
      solid:    '',
      glass:    'card--glass',
      elevated: 'card--elevated',
    },
  },
  defaultVariants: {
    variant: 'solid',
  },
});

export interface CardProps
  extends ComponentPropsWithRef<'div'>,
    VariantProps<typeof cardVariants> {
  accent?: boolean;
}

export function Card({ className, variant, accent = false, children, ...props }: CardProps) {
  return (
    <div className={cn(cardVariants({ variant }), className)} {...props}>
      {accent && <div className="card__accent-bar" aria-hidden />}
      {children}
    </div>
  );
}
