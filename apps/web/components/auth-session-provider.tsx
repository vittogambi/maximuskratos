'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiLogout, type MeResponse } from '@/lib/api';
import { clearAccessToken } from '@/lib/auth-storage';
import { resolveSession } from '@/lib/resolve-session';

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

  const refresh = useCallback(async (options?: { force?: boolean }) => {
    const me = await resolveSession(options);
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
      clearAccessToken();
      setUser(null);
      setStatus('guest');
      router.refresh();
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
