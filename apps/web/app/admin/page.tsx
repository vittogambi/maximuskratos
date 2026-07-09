'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AdminKpiCard } from '@/components/admin/admin-kpi-card';
import { AdminPageHeader, AdminStatusBadge } from '@/components/admin/admin-page-header';
import { AppIcon } from '@/components/app-icon';
import { FadeIn } from '@/components/motion';
import { Badge } from '@/components/ui/badge';
import {
  apiAdminLeads,
  apiAdminStats,
  apiAdminUsers,
  getApiBaseUrl,
  getApiDocsUrl,
  type AdminStats,
  type AdminUser,
  type Lead,
} from '@/lib/api';
import {
  formatAdminDateTime,
  formatOnboarding,
  formatRelativeAdmin,
} from '@/lib/admin-format';
import { getAccessToken } from '@/lib/auth-storage';

type LoadState = 'loading' | 'ready' | 'error';

export default function AdminDashboardPage() {
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setState('error');
      setError('Sesión no encontrada');
      return;
    }

    Promise.all([
      apiAdminStats(token),
      apiAdminUsers(token),
      apiAdminLeads(token),
      fetch(`${getApiBaseUrl()}/health`).then((r) => r.ok),
    ])
      .then(([statsData, usersData, leadsData, healthOk]) => {
        setStats(statsData);
        setUsers(usersData);
        setLeads(leadsData);
        setApiOnline(healthOk);
        setState('ready');
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Error al cargar el panel');
        setState('error');
      });
  }, []);

  const recentLeads = useMemo(() => leads.slice(0, 6), [leads]);
  const recentUsers = useMemo(() => users.slice(0, 6), [users]);

  const trialUsers = useMemo(
    () => users.filter((u) => u.subscriptionStatus === 'TRIAL').length,
    [users],
  );
  const activeUsers = useMemo(
    () => users.filter((u) => u.subscriptionStatus === 'ACTIVE').length,
    [users],
  );

  if (state === 'loading') {
    return (
      <div className="admin-loading">
        <span className="auth-spinner" aria-hidden />
        <p>Cargando panel…</p>
      </div>
    );
  }

  const totalUsers = stats?.users.total ?? 0;
  const totalLeads = stats?.leads.total ?? 0;

  return (
    <FadeIn className="admin-dashboard">
      <AdminPageHeader
        eyebrow="MK · Validación MVP"
        title="Resumen"
        description="Vista operativa de captación, registros y salud del sistema."
        actions={<AdminStatusBadge online={apiOnline} />}
      />

      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}

      <section className="admin-kpi-grid" aria-label="Indicadores clave">
        <AdminKpiCard
          icon="users"
          label="Usuarios totales"
          value={totalUsers}
          trend={stats?.users.last7Days}
        />
        <AdminKpiCard
          icon="mail"
          label="Leads totales"
          value={totalLeads}
          trend={stats?.leads.last7Days}
        />
        <AdminKpiCard
          icon="activity"
          label="En trial"
          value={trialUsers}
          hint="Suscripciones en período de prueba"
        />
        <AdminKpiCard
          icon="user-check"
          label="Cuentas activas"
          value={activeUsers}
          hint="Planes con estado ACTIVE"
        />
      </section>

      <div className="admin-dashboard__layout">
        <div className="admin-dashboard__primary">
          <section className="admin-card">
            <div className="admin-card__header">
              <div>
                <h2 className="admin-card__title">Leads recientes</h2>
                <p className="admin-card__subtitle">
                  Últimos contactos desde el sitio público
                </p>
              </div>
              <Link href="/admin/leads" className="admin-card__link">
                Ver todos
                <AppIcon name="arrow-right" size={14} />
              </Link>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Contacto</th>
                    <th>Origen</th>
                    <th>Mensaje</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="admin-table__primary">
                        <span className="admin-table__name">{lead.name ?? 'Sin nombre'}</span>
                        <span className="admin-table__meta">{lead.email}</span>
                      </td>
                      <td>
                        <Badge variant="muted">{lead.source ?? 'contact'}</Badge>
                      </td>
                      <td className="admin-table__truncate">{lead.message ?? '—'}</td>
                      <td className="admin-table__muted">{formatRelativeAdmin(lead.createdAt)}</td>
                    </tr>
                  ))}
                  {recentLeads.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="admin-table__empty">
                        Sin leads. El formulario de contacto alimenta esta vista.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card__header">
              <div>
                <h2 className="admin-card__title">Usuarios recientes</h2>
                <p className="admin-card__subtitle">Registros y estado de onboarding</p>
              </div>
              <Link href="/admin/users" className="admin-card__link">
                Ver todos
                <AppIcon name="arrow-right" size={14} />
              </Link>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Onboarding</th>
                    <th>Plan</th>
                    <th>Alta</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="admin-table__email">{user.email}</td>
                      <td>
                        <Badge variant={user.role === 'ADMIN' ? 'admin' : 'user'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant="muted">{formatOnboarding(user.onboardingStep)}</Badge>
                      </td>
                      <td className="admin-table__muted">{user.subscriptionStatus ?? '—'}</td>
                      <td className="admin-table__muted">
                        {formatAdminDateTime(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="admin-table__empty">
                        Sin usuarios registrados
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="admin-dashboard__rail">
          <section className="admin-card admin-card--accent">
            <h2 className="admin-card__title">Embudo Demo 2</h2>
            <ul className="admin-funnel">
              <li>
                <span>Leads capturados</span>
                <strong>{totalLeads}</strong>
              </li>
              <li>
                <span>Cuentas creadas</span>
                <strong>{totalUsers}</strong>
              </li>
              <li>
                <span>En trial</span>
                <strong>{trialUsers}</strong>
              </li>
              <li>
                <span>Activas</span>
                <strong>{activeUsers}</strong>
              </li>
            </ul>
            <p className="admin-card__note">
              Ratio registros/leads:{' '}
              <strong>
                {totalLeads > 0 ? `${totalUsers} / ${totalLeads}` : '—'}
              </strong>
            </p>
          </section>

          <section className="admin-card">
            <div className="admin-quick-link">
              <AppIcon name="book-open" size={18} />
              <div>
                <h3>API Swagger</h3>
                <p>Auth, leads y endpoints admin</p>
              </div>
            </div>
            <a
              href={getApiDocsUrl()}
              className="admin-btn admin-btn--secondary"
              target="_blank"
              rel="noreferrer"
            >
              <AppIcon name="external-link" size={14} />
              Abrir documentación
            </a>
          </section>

          <section className="admin-card">
            <div className="admin-quick-link">
              <AppIcon name="globe" size={18} />
              <div>
                <h3>Sitio público</h3>
                <p>Landing, sistema, eventos y contacto</p>
              </div>
            </div>
            <Link href="/" className="admin-btn admin-btn--secondary">
              <AppIcon name="external-link" size={14} />
              Ver sitio
            </Link>
          </section>
        </aside>
      </div>
    </FadeIn>
  );
}
