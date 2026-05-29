'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthShell } from '@/components/auth-shell';
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
      <AuthShell title="Cargando" description="Verificando tu sesión…">
        <div className="auth-loading">
          <span className="auth-spinner" aria-hidden />
          <p>Un momento</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Tu espacio"
      description="Sesión iniciada correctamente."
      footer={
        <p className="auth-footer-text">
          <Link href="/login" className="auth-link">
            Volver al inicio de sesión
          </Link>
        </p>
      }
    >
      <div className="session-status">
        <span className="session-badge">Sesión activa</span>
      </div>
      <dl className="user-details">
        <div>
          <dt>Email</dt>
          <dd>{email}</dd>
        </div>
        <div>
          <dt>Perfil</dt>
          <dd>{role === 'ADMIN' ? 'Administrador' : 'Usuario'}</dd>
        </div>
      </dl>
      <ul className="session-checklist">
        <li>Cuenta verificada en el servidor</li>
        <li>Sesión segura con token de acceso</li>
        <li>La sesión se mantiene al recargar la página</li>
      </ul>
      <button type="button" className="auth-button secondary" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </AuthShell>
  );
}
