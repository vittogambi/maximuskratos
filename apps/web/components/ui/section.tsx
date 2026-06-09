import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import type { ComponentPropsWithRef } from 'react';

const sectionVariants = cva('section', {
  variants: {
    variant: {
      default: '',
      alt:     'section--alt',
      dark:    'section--dark',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface SectionProps
  extends ComponentPropsWithRef<'section'>,
    VariantProps<typeof sectionVariants> {}

export function Section({ className, variant, ...props }: SectionProps) {
  return <section className={cn(sectionVariants({ variant }), className)} {...props} />;
}

type ContainerWidth = 'max' | 'readable' | 'wide' | 'narrow';
type ContainerRail = 'center' | 'left' | 'right';

const widthClass: Record<ContainerWidth, string> = {
  max:      'container',
  readable: 'container-readable',
  wide:     'container-wide',
  narrow:   'container-narrow',
};

const railClass: Record<ContainerRail, string> = {
  center: '',
  left:   'container-rail--left',
  right:  'container-rail--right',
};

export function Container({
  className,
  narrow = false,
  width,
  rail = 'center',
  ...props
}: ComponentPropsWithRef<'div'> & {
  narrow?: boolean;
  width?: ContainerWidth;
  rail?: ContainerRail;
}) {
  const resolvedWidth = width ?? (narrow ? 'narrow' : 'max');

  return (
    <div
      className={cn(widthClass[resolvedWidth], railClass[rail], className)}
      {...props}
    />
  );
}

export function SectionHeader({
  center = false,
  className,
  ...props
}: ComponentPropsWithRef<'div'> & { center?: boolean }) {
  return (
    <div
      className={cn(
        center ? 'section__header--center' : 'section__header',
        className,
      )}
      {...props}
    />
  );
}
