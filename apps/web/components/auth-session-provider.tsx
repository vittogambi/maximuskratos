'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { apiLogout, type MeResponse } from '@/lib/api';
import { clearAccessToken } from '@/lib/auth-storage';
import { resetResolveSession, resolveSession } from '@/lib/resolve-session';

const LOGOUT_API_TIMEOUT_MS = 4_000;

/** Routes that should leave immediately after logout. */
function postLogoutPath(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  const protectedPrefixes = [
    '/panel',
    '/perfil',
    '/ruta',
    '/cuenta',
    '/diagnostico',
    '/admin',
  ];
  if (protectedPrefixes.some((p) => path.startsWith(p))) {
    return '/login';
  }
  return null;
}

function clearLocalSession(refreshIdRef: React.MutableRefObject<number>) {
  refreshIdRef.current++;
  clearAccessToken();
  resetResolveSession();
}

type AuthStatus = 'loading' | 'guest' | 'authenticated';

type AuthSessionContextValue = {
  status: AuthStatus;
  user: MeResponse | null;
  refresh: (options?: { force?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<MeResponse | null>(null);
  const refreshIdRef = useRef(0);

  const refresh = useCallback(async (options?: { force?: boolean }) => {
    const refreshId = ++refreshIdRef.current;
    const me = await resolveSession(options);
    if (refreshId !== refreshIdRef.current) return;
    if (me) {
      setUser(me);
      setStatus('authenticated');
    } else {
      setUser(null);
      setStatus('guest');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    const redirectTo = postLogoutPath();

    // Clear local session immediately — never block UI on the logout API.
    clearLocalSession(refreshIdRef);
    setUser(null);
    setStatus('guest');

    if (redirectTo) {
      router.replace(redirectTo);
    }

    try {
      await Promise.race([
        apiLogout(),
        new Promise<void>((_, reject) => {
          window.setTimeout(
            () => reject(new Error('logout_timeout')),
            LOGOUT_API_TIMEOUT_MS,
          );
        }),
      ]);
    } catch {
      // Best-effort: refresh cookie may already be cleared server-side.
    }
  }, [router]);

  const value = useMemo(
    () => ({ status, user, refresh, logout }),
    [status, user, refresh, logout],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return ctx;
}
