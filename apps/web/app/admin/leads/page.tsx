'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminToolbar } from '@/components/admin/admin-toolbar';
import { AppIcon } from '@/components/app-icon';
import { FadeIn } from '@/components/motion';
import { Badge } from '@/components/ui/badge';
import { apiAdminLeads, downloadAdminLeadsCsv, type Lead } from '@/lib/api';
import { formatAdminDateTime } from '@/lib/admin-format';
import { getAccessToken } from '@/lib/auth-storage';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    apiAdminLeads(token)
      .then(setLeads)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.email.toLowerCase().includes(q) ||
        (l.name ?? '').toLowerCase().includes(q) ||
        (l.message ?? '').toLowerCase().includes(q) ||
        (l.source ?? '').toLowerCase().includes(q),
    );
  }, [leads, search]);

  async function handleExport() {
    const token = getAccessToken();
    if (!token || exporting) return;
    setExporting(true);
    try {
      await downloadAdminLeadsCsv(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al exportar');
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <span className="auth-spinner" aria-hidden />
        <p>Cargando leads…</p>
      </div>
    );
  }

  return (
    <FadeIn>
      <AdminPageHeader
        title="Leads"
        description="Contactos capturados desde formularios del sitio público."
        actions={
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={handleExport}
            disabled={exporting || leads.length === 0}
          >
            <AppIcon name="download" size={14} />
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
        }
      />

      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}

      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">{filtered.length} de {leads.length}</h2>
            <p className="admin-card__subtitle">Inbox de captación · datos en tiempo real</p>
          </div>
        </div>

        <AdminToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Buscar por correo, nombre u origen…"
        />

        <div className="admin-table-wrap">
          <table className="admin-table admin-table--wide">
            <thead>
              <tr>
                <th>Contacto</th>
                <th>Mensaje</th>
                <th>Origen</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td className="admin-table__primary">
                    <span className="admin-table__name">{l.name ?? 'Sin nombre'}</span>
                    <span className="admin-table__meta">{l.email}</span>
                  </td>
                  <td className="admin-table__truncate">{l.message ?? '—'}</td>
                  <td>
                    <Badge variant="muted">{l.source ?? 'contact'}</Badge>
                  </td>
                  <td className="admin-table__muted">{formatAdminDateTime(l.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-table__empty">
                    {leads.length === 0
                      ? 'Sin leads aún'
                      : 'Ningún lead coincide con la búsqueda'}
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
