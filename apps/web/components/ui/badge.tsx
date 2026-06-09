import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import type { ComponentPropsWithRef } from 'react';

const badgeVariants = cva('badge', {
  variants: {
    variant: {
      admin: 'badge--admin',
      user:  'badge--user',
      muted: 'badge--muted',
    },
  },
  defaultVariants: {
    variant: 'muted',
  },
});

export interface BadgeProps
  extends ComponentPropsWithRef<'span'>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
