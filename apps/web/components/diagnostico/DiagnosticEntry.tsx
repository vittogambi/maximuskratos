'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { apiDiagnosticStart, type DiagnosticState } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { isEarlyAccessMode } from '@/lib/product-phase';

function routeFromState(state: DiagnosticState, router: ReturnType<typeof useRouter>) {
  if (state.sessionState.showWelcomeScreen) {
    router.replace('/diagnostico/bienvenida');
    return;
  }

  const { nextStep, sessionState } = state;

  if (nextStep.type === 'question' && sessionState.currentModuleSlug) {
    router.replace(`/diagnostico/modulo/${sessionState.currentModuleSlug}/pregunta`);
    return;
  }
  if (nextStep.type === 'module_outro') {
    router.replace(`/diagnostico/outro/${nextStep.data.moduleSlug}`);
    return;
  }
  if (nextStep.type === 'diagnostic_complete') {
    router.replace('/diagnostico/resultado');
    return;
  }
  router.replace('/diagnostico/bienvenida');
}

/**
 * Entry point: starts or resumes the diagnostic session and redirects
 * to the correct route based on current state.
 */
export function DiagnosticEntry() {
  const router = useRouter();
  const { status } = useAuthSession();

  useEffect(() => {
    if (isEarlyAccessMode()) {
      router.replace('/panel');
      return;
    }

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

    apiDiagnosticStart(token)
      .then((state) => {
        if (cancelled) return;
        routeFromState(state, router);
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
