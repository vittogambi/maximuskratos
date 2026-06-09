'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type AuthSubmitButtonProps = {
  loading?: boolean;
  loadingLabel: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
  disabled?: boolean;
};

export function AuthSubmitButton({
  loading = false,
  loadingLabel,
  children,
  variant = 'primary',
  className,
  disabled = false,
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      className={cn(
        'auth-button',
        variant === 'secondary' && 'secondary',
        loading && 'auth-button--loading',
        className,
      )}
      disabled={loading || disabled}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <span className="auth-spinner auth-spinner--button" aria-hidden />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
