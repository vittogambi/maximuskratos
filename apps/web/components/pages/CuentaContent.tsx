'use client';

import Link from 'next/link';
import { useAuthSession } from '@/components/auth-session-provider';
import { formatAdminDate } from '@/lib/admin-format';
import { isEarlyAccessMode } from '@/lib/product-phase';
import { useTrialDays } from '@/lib/use-trial-days';

const STATUS_LABEL: Record<string, string> = {
  TRIAL: 'Período de prueba',
  ACTIVE: 'Activa',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
};

const STATUS_COLOR: Record<string, string> = {
  TRIAL: 'rgba(255,255,255,0.7)',
  ACTIVE: '#22c060',
  EXPIRED: 'rgba(255,90,90,0.75)',
  CANCELLED: 'rgba(255,255,255,0.4)',
};

export function CuentaContent() {
  const { user, logout } = useAuthSession();
  const trialDays = useTrialDays();
  const subscription = user?.subscription;
  const status = subscription?.status;
  const earlyAccess = isEarlyAccessMode();
  /** Trial clock only runs after launch; until then there is no end date to show. */
  const trialPending = status === 'TRIAL' && (earlyAccess || !subscription?.trialEnd);

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
            <span
              style={{
                color: status
                  ? (STATUS_COLOR[status] ?? 'rgba(255,255,255,0.4)')
                  : 'rgba(255,255,255,0.4)',
              }}
            >
              {trialPending
                ? 'Acceso anticipado'
                : status
                  ? (STATUS_LABEL[status] ?? status)
                  : 'Sin plan activo'}
            </span>
          </div>
          {trialPending ? (
            <div className="mk-cuenta-info-row">
              <span>Prueba</span>
              <span>
                {trialDays} días al lanzamiento
              </span>
            </div>
          ) : null}
          {status === 'TRIAL' && !trialPending && subscription?.trialEnd ? (
            <div className="mk-cuenta-info-row">
              <span>Prueba hasta</span>
              <span>{formatAdminDate(subscription.trialEnd)}</span>
            </div>
          ) : null}
          {status === 'ACTIVE' && subscription?.currentPeriodEnd ? (
            <div className="mk-cuenta-info-row">
              <span>Renovación</span>
              <span>{formatAdminDate(subscription.currentPeriodEnd)}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Links */}
      <div className="mk-cuenta-section">
        <p className="mk-section-eyebrow">ACCESOS</p>
        <div className="mk-cuenta-link-list">
          <Link href="/precios" className="mk-cuenta-link">
            Ver planes y precios
            <span aria-hidden>›</span>
          </Link>
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
      <button onClick={() => logout()} className="mk-btn-danger">
        Cerrar sesión
      </button>

      <p
        style={{
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.15)',
          textAlign: 'center',
          fontFamily: 'var(--font-hanken,system-ui)',
        }}
      >
        Maximus Kratos · {new Date().getFullYear()}
      </p>
    </div>
  );
}
