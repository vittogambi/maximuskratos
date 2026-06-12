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

function postLogoutPath(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  if (path.startsWith('/panel') || path.startsWith('/admin')) {
    return '/login';
  }
  return null;
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
    try {
      await apiLogout();
    } finally {
      refreshIdRef.current++;
      clearAccessToken();
      resetResolveSession();
      setUser(null);
      setStatus('guest');
      const redirectTo = postLogoutPath();
      if (redirectTo) {
        router.replace(redirectTo);
      }
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
