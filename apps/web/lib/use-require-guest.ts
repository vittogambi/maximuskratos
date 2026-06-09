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
    if (status === 'authenticated' && user) {
      router.replace(getPostAuthPath(user.role));
    }
  }, [status, user, router]);

  return status;
}
