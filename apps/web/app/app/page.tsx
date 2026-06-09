'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { apiMe, apiRefresh } from '@/lib/api';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/lib/auth-storage';

/** Legacy route — redirects to admin or home. */
export default function AppRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function redirect() {
      try {
        let token = getAccessToken();
        if (!token) {
          const refreshed = await apiRefresh();
          token = refreshed.accessToken;
          setAccessToken(token);
        }
        const me = await apiMe(token);
        if (!cancelled) router.replace(getPostAuthPath(me.role));
      } catch {
        if (!cancelled) {
          clearAccessToken();
          router.replace('/login');
        }
      }
    }

    redirect();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <AuthShell title="Redirigiendo" description="Un momento…">
      <div className="auth-loading">
        <span className="auth-spinner" aria-hidden />
        <p>Preparando tu sesión</p>
      </div>
    </AuthShell>
  );
}
