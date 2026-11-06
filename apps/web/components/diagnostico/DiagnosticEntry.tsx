'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { apiDiagnosticStart } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { routeDiagnosticFromState, settleModuleOutro } from '@/lib/diagnostic-continue';

/**
 * Entry point: starts or resumes the diagnostic session and redirects
 * to the correct route based on current state.
 */
export function DiagnosticEntry() {
  const router = useRouter();
  const { status } = useAuthSession();

  useEffect(() => {
    if (status === 'guest') {
      router.replace('/login');
      return;
    }

    const token = getAccessToken();

    if (status === 'loading' && !token) return;

    if (!token) {
      router.replace('/login');
      return;
    }

    let cancelled = false;

    const general = new URLSearchParams(window.location.search).get('alcance') === 'general';
    apiDiagnosticStart(token, { general })
      .then(async (state) => {
        if (cancelled) return;
        let settled = state;
        try {
          settled = await settleModuleOutro(token, state);
        } catch {
          settled = state;
        }
        if (cancelled) return;
        routeDiagnosticFromState(settled, router, 'replace');
      })
      .catch(() => {
        if (cancelled) return;
        router.replace('/diagnostico/bienvenida');
      });

    return () => {
      cancelled = true;
    };
  }, [status, router]);

  return (
    <main
      style={{
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="auth-loading">
        <span className="auth-spinner" aria-hidden />
      </div>
    </main>
  );
}
