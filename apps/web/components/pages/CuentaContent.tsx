'use client';

import Link from 'next/link';
import { useAuthSession } from '@/components/auth-session-provider';

export function CuentaContent() {
  const { user, logout } = useAuthSession();

  return (
    <div className="mk-dashboard">
      {/* User info */}
      <div className="mk-cuenta-avatar-row">
        <div className="mk-cuenta-avatar">
          {user?.email?.[0]?.toUpperCase() ?? 'M'}
        </div>
        <div>
          <p className="mk-cuenta-email">{user?.email ?? '—'}</p>
          <p className="mk-cuenta-role">
            {user?.role === 'ADMIN' ? 'Administrador' : 'Miembro Fundador'}
          </p>
        </div>
      </div>

      {/* Subscription */}
      <div className="mk-cuenta-section">
        <p className="mk-section-eyebrow">SUSCRIPCIÓN</p>
        <div className="mk-cuenta-info-card">
          <div className="mk-cuenta-info-row">
            <span>Estado</span>
            <span style={{ color: user?.subscription?.status === 'active' ? '#22c060' : 'rgba(255,255,255,0.4)' }}>
              {user?.subscription?.status ?? 'Sin plan activo'}
            </span>
          </div>
          {user?.subscription?.currentPeriodEnd && (
            <div className="mk-cuenta-info-row">
              <span>Renovación</span>
              <span>{new Date(user.subscription.currentPeriodEnd).toLocaleDateString('es-CL')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="mk-cuenta-section">
        <p className="mk-section-eyebrow">ACCESOS</p>
        <div className="mk-cuenta-link-list">
          <Link href="/diagnostico/resultado" className="mk-cuenta-link">
            Ver resultado completo
            <span aria-hidden>›</span>
          </Link>
          <Link href="/" className="mk-cuenta-link">
            Sitio público
            <span aria-hidden>›</span>
          </Link>
          <Link href="/terminos" className="mk-cuenta-link">
            Términos y condiciones
            <span aria-hidden>›</span>
          </Link>
          <Link href="/privacidad" className="mk-cuenta-link">
            Política de privacidad
            <span aria-hidden>›</span>
          </Link>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="mk-btn-danger"
      >
        Cerrar sesión
      </button>

      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.15)', textAlign: 'center', fontFamily: 'var(--font-hanken,system-ui)' }}>
        Maximus Kratos · {new Date().getFullYear()}
      </p>
    </div>
  );
}
