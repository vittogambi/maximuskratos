'use client';

import { cn } from '@/lib/cn';
import type { ComponentPropsWithRef, ReactNode } from 'react';

interface FieldProps extends ComponentPropsWithRef<'label'> {
  label: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, error, children, className, ...props }: FieldProps) {
  return (
    <label className={cn('flex flex-col gap-[0.4rem]', className)} {...props}>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: error ? 'var(--color-error)' : 'var(--color-text-muted)',
        }}
      >
        {label}
      </span>
      {children}
      {error && (
        <span
          role="alert"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            color: 'var(--color-error)',
          }}
        >
          {error}
        </span>
      )}
    </label>
  );
}

export interface InputProps extends ComponentPropsWithRef<'input'> {
  hasError?: boolean;
}

export function Input({ className, hasError, ...props }: InputProps) {
  return (
    <input
      className={cn(className)}
      style={{
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${hasError ? 'var(--color-crimson)' : 'var(--color-border)'}`,
        background: 'var(--color-obsidian)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.9375rem',
        width: '100%',
        transition: 'border-color var(--duration-base), box-shadow var(--duration-base)',
      }}
      {...props}
    />
  );
}
