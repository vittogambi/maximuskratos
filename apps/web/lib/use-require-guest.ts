'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { getPostAuthPath } from '@/lib/auth-redirect';

/** Redirect authenticated users away from login/register (and similar guest-only routes). */
export function useRequireGuest() {
  const router = useRouter();
  const { status, user } = useAuthSession();

  useEffect(() => {
    // Run whenever status OR user changes — user may arrive in a separate render.
    if (status !== 'authenticated') return;
    // user may be null for one render if React batching splits the two setState calls.
    // In that case the effect fires again when user arrives (dependency array includes user).
    if (!user) return;
    router.replace(getPostAuthPath(user.role, user.onboardingStep));
  }, [status, user, router]);

  return status;
}
