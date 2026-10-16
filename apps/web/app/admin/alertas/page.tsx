'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import styles from '@/components/admin/recorrido.module.css';
import { apiAdminAlerts, type AdminAlertPage } from '@/lib/api';
import { formatAlignmentDate } from '@/lib/journey-api';
import { getAccessToken } from '@/lib/auth-storage';

const PAGE_SIZE = 30;

function responseHref(item: AdminAlertPage['items'][number]) {
  const query = new URLSearchParams({ vista: 'respuestas' });
  if (item.sessionId) query.set('sessionId', item.sessionId);
  if (item.moduleSlug) query.set('modulo', item.moduleSlug);
  return `/admin/users/${encodeURIComponent(item.userId)}/recorrido?${query.toString()}`;
}

export default function AlertasPage() {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState({ module: '', rule: '' });
  const [filters, setFilters] = useState({ module: '', rule: '' });
  const [data, setData] = useState<AdminAlertPage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const token = getAccessToken();
    setData(null);
    setError('');
    setLoading(true);
    if (!token) {
      setError('Vuelve a iniciar sesión para consultar las alertas.');
      setLoading(false);
      return;
    }
    let cancel = false;
    apiAdminAlerts(token, { page, module: filters.module || undefined, rule: filters.rule || undefined })
      .then((next) => { if (!cancel) { setData(next); setLoading(false); } })
      .catch(() => { if (!cancel) { setError('No se pudo consultar las alertas.'); setLoading(false); } });
    return () => { cancel = true; };
  }, [page, filters.module, filters.rule, tick]);

  function applyFilters() {
    setData(null);
    setError('');
    setLoading(true);
    setPage(1);
    setFilters({ module: draft.module.trim(), rule: draft.rule.trim() });
    setTick((value) => value + 1);
  }

  function clearFilters() {
    setDraft({ module: '', rule: '' });
    setFilters({ module: '', rule: '' });
    setPage(1);
    setData(null);
    setError('');
    setLoading(true);
    setTick((value) => value + 1);
  }

  function changePage(next: number) {
    setData(null);
    setError('');
    setLoading(true);
    setPage(next);
  }

  const failed = Boolean(error) || data?.state === 'ERROR';
  const ready = !failed && !loading && data?.state === 'READY';
  const from = data && data.items.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = data ? Math.min(page * PAGE_SIZE, data.total) : 0;
  return (
    <div className={styles.page}>
      <AdminPageHeader title="Alertas registradas" description="Historial de reglas del cuestionario. Consulta exclusiva de administración." />
      <section className={styles.panel}>
        <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); applyFilters(); }}>
          <label className={styles.field}><span className={styles.label}>Módulo</span><input className={styles.select} value={draft.module} onChange={(event) => setDraft((value) => ({ ...value, module: event.target.value }))} placeholder="Identificador del módulo" /></label>
          <label className={styles.field}><span className={styles.label}>Regla</span><input className={styles.select} value={draft.rule} onChange={(event) => setDraft((value) => ({ ...value, rule: event.target.value }))} placeholder="Versión o identificador" /></label>
          <div className={styles.filterActions}><button type="submit" className={styles.retry}>Aplicar filtros</button><button type="button" className={styles.linkish} onClick={clearFilters}>Limpiar</button></div>
        </form>
        <p className={styles.note}>Vigente indica que la evidencia coincide con la respuesta actual. No equivale a una alerta resuelta. Los cierres históricos sin reconstrucción pueden no tener detalle registrado.</p>
      </section>
      <section className={styles.panel} aria-busy={loading}>
        <div className={styles.sectionHead}><h2 className={styles.subTitle}>Ocurrencias registradas</h2>{ready && data ? <span className={styles.badge}>{data.total} en esta consulta</span> : null}</div>
        {loading ? <p role="status" className={styles.emptyState}>Consultando alertas.</p> : null}
        {failed ? <div role="alert" className={styles.errorState}><p>{error || 'No se pudo consultar las alertas.'}</p><p className={styles.note}>No hay un resultado disponible. Esto no significa que no existan alertas.</p><button type="button" className={styles.retry} onClick={() => setTick((value) => value + 1)}>Reintentar</button></div> : null}
        {ready && data?.items.length === 0 ? <p className={styles.emptyState}>No hay ocurrencias registradas para estos filtros.</p> : null}
        {!loading && !failed && data && data.state !== 'READY' ? <p className={styles.emptyState}>No hay un historial disponible en esta consulta. Estado: {data.state}.</p> : null}
        {ready && data && data.items.length > 0 ? <>
          <ul className={styles.cards}>
            {data.items.map((item) => (
              <li key={item.id} className={styles.alertCard}>
                <Link href={responseHref(item)}>{item.email}</Link>
                <p className={styles.copy}>{item.productRule}</p>
                <span className={styles.badge}>{item.matchesCurrentResponse ? 'Vigente' : 'No vigente'}</span>
                <p className={styles.note}>{item.provenance === 'RECONSTRUCTED' ? 'Reconstruida' : 'Registrada'}. {formatAlignmentDate(item.detectedAt)}</p>
              </li>
            ))}
          </ul>
          <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="Tabla de alertas registradas">
            <table>
              <caption className={styles.srOnly}>Alertas del cuestionario. Página {page}.</caption>
              <thead><tr><th scope="col">Cuenta</th><th scope="col">Regla</th><th scope="col">Procedencia</th><th scope="col">Vigencia</th><th scope="col">Detectada</th></tr></thead>
              <tbody>{data.items.map((item) => (
                <tr key={item.id}>
                  <td><Link href={responseHref(item)}>{item.email}</Link></td>
                  <td>{item.productRule}</td>
                  <td>{item.provenance === 'RECONSTRUCTED' ? 'Reconstruida' : 'Registrada'}</td>
                  <td><span className={styles.badge}>{item.matchesCurrentResponse ? 'Vigente' : 'No vigente'}</span></td>
                  <td>{formatAlignmentDate(item.detectedAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </> : null}
        {ready && data && data.total > 0 ? <nav className={styles.pager} aria-label="Páginas de alertas"><p className={styles.note}>{from} a {to} de {data.total}. Página {page}</p><button type="button" className={styles.retry} disabled={page <= 1} onClick={() => changePage(page - 1)}>Anterior</button><button type="button" className={styles.retry} disabled={page * PAGE_SIZE >= data.total} onClick={() => changePage(page + 1)}>Siguiente</button></nav> : null}
      </section>
    </div>
  );
}
