'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiLogout, apiMe, apiRefresh } from '@/lib/api';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/lib/auth-storage';

export default function AppPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        let token = getAccessToken();
        if (!token) {
          const refreshed = await apiRefresh();
          token = refreshed.accessToken;
          setAccessToken(token);
        }
        const me = await apiMe(token);
        if (!cancelled) {
          setEmail(me.email);
          setRole(me.role);
        }
      } catch {
        if (!cancelled) {
          clearAccessToken();
          router.replace('/login');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    try {
      await apiLogout();
    } finally {
      clearAccessToken();
      router.push('/login');
    }
  }

  if (loading) {
    return (
      <main>
        <p className="subtitle">Cargando sesión…</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Mi cuenta</h1>
      <p className="subtitle">Maximus Kratos</p>
      <div className="card">
        <p>
          <strong>Email:</strong> {email}
        </p>
        <p>
          <strong>Rol:</strong> {role}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="secondary" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  );
}
