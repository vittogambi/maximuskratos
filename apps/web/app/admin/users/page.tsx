'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminFilterChip, AdminToolbar } from '@/components/admin/admin-toolbar';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { FadeIn } from '@/components/motion';
import { Badge } from '@/components/ui/badge';
import { apiAdminUsers, type AdminUser } from '@/lib/api';
import { formatAdminDate, formatOnboarding } from '@/lib/admin-format';
import { getAccessToken } from '@/lib/auth-storage';

type RoleFilter = 'ALL' | 'ADMIN' | 'USER';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    apiAdminUsers(token)
      .then(setUsers)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        u.onboardingStep.toLowerCase().includes(q) ||
        (u.subscriptionStatus ?? '').toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  if (loading) {
    return (
      <div className="admin-loading">
        <span className="auth-spinner" aria-hidden />
        <p>Cargando usuarios…</p>
      </div>
    );
  }

  return (
    <FadeIn>
      <AdminPageHeader
        title="Usuarios"
        description="Cuentas registradas con rol, onboarding y estado de suscripción."
      />

      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}

      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">{filtered.length} de {users.length}</h2>
            <p className="admin-card__subtitle">Resultados según búsqueda y filtros</p>
          </div>
        </div>

        <AdminToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Buscar por correo, plan u onboarding…"
        >
          <div className="admin-filter-row" role="group" aria-label="Filtrar por rol">
            {(['ALL', 'ADMIN', 'USER'] as const).map((role) => (
              <AdminFilterChip
                key={role}
                label={role === 'ALL' ? 'Todos' : role}
                active={roleFilter === role}
                onClick={() => setRoleFilter(role)}
              />
            ))}
          </div>
        </AdminToolbar>

        <div className="admin-table-wrap">
          <table className="admin-table admin-table--wide">
            <thead>
              <tr>
                <th>Correo</th>
                <th>Rol</th>
                <th>Onboarding</th>
                <th>Suscripción</th>
                <th>Trial hasta</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="admin-table__email">{u.email}</td>
                  <td>
                    <Badge variant={u.role === 'ADMIN' ? 'admin' : 'user'}>{u.role}</Badge>
                  </td>
                  <td>
                    <Badge variant="muted">{formatOnboarding(u.onboardingStep)}</Badge>
                  </td>
                  <td className="admin-table__muted">{u.subscriptionStatus ?? '—'}</td>
                  <td className="admin-table__muted">{formatAdminDate(u.trialEnd)}</td>
                  <td className="admin-table__muted">{formatAdminDate(u.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table__empty">
                    {users.length === 0
                      ? 'Sin usuarios registrados'
                      : 'Ningún usuario coincide con la búsqueda'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </FadeIn>
  );
}
