'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { canUseMemberProduct } from '@/lib/member-access';

/**
 * Navigation only. The API guard is what enforces access, so typing a
 * /diagnostico URL cannot bypass it.
 */
export function DiagnosticAccessGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, user } = useAuthSession();
  const allowed = status === 'authenticated' && canUseMemberProduct(user);

  useEffect(() => {
    if (status === 'guest') {
      router.replace('/login');
    } else if (status === 'authenticated' && user && !canUseMemberProduct(user)) {
      router.replace('/panel');
    }
  }, [status, user, router]);

  if (!allowed) {
    return (
      <main style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-loading">
          <span className="auth-spinner" aria-hidden />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
