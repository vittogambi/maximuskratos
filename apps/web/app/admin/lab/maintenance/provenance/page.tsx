'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { ProvenanceCard } from '@/components/admin/lab/provenance-card';
import { LabCard, Skeleton } from '@/components/admin/lab/primitives';
import { labApi, type LabReviewAgenda } from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';

export default function LabProvenancePage() {
  const [agenda, setAgenda] = useState<LabReviewAgenda | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    labApi
      .reviewAgenda()
      .then(setAgenda)
      .catch((err) => setError(humanError(err, 'No pudimos cargar la procedencia.').message));
  }, []);

  const catalogs = agenda?.legacy_catalogs ?? [];
  const counts = {
    total: catalogs.length,
    conservado: catalogs.filter((item) => item.status === 'Conservado').length,
    transformado: catalogs.filter((item) => item.status === 'Transformado').length,
    unconfirmed: catalogs.filter((item) => item.status === 'Sin confirmar').length,
  };

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <p className="lab-eyebrow">Detalles técnicos</p>
        <h1 className="admin-page-header__title">Material original y procedencia</h1>
        <p className="lab-lead">Inventario de evidencia. No es una tarea de revisión individual.</p>
        <Link href="/admin/lab/tech">Volver a detalles técnicos</Link>
      </header>
      {error ? <p className="lab-error">{error}</p> : null}
      {!agenda ? (
        <Skeleton lines={6} />
      ) : (
        <div className="lab-stack">
          <LabCard title="Inventario NO BORRAR">
            <p className="lab-lead">{counts.total} elementos</p>
            <p className="lab-muted">
              Conservado: {counts.conservado}. Transformado: {counts.transformado}. Sin confirmar:{' '}
              {counts.unconfirmed}.
            </p>
            <p className="lab-muted">
              Conservado y transformado solo aparecen cuando hay mapping, migración o equivalencia documentada.
            </p>
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Elemento</th>
                  <th>Uso</th>
                  <th>Equivalente</th>
                  <th>Estado</th>
                  <th>Grupo</th>
                </tr>
              </thead>
              <tbody>
                {catalogs.map((row) => (
                  <tr key={`${row.catalog}:${row.element}`}>
                    <td>{row.element}</td>
                    <td>
                      {row.usage} ({row.catalog})
                    </td>
                    <td>{row.equivalent}</td>
                    <td>{row.status}</td>
                    <td>{row.human_group ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </LabCard>
          <LabCard title="Próxima fase">
            <p>Separar el ámbito prioritario del diagnóstico del foco de intervención</p>
            <p className="lab-muted">Se revisará al comenzar el Motor de Intervención.</p>
            {(agenda.later ?? []).map((item) => (
              <ProvenanceCard key={item.id} item={item} />
            ))}
          </LabCard>
        </div>
      )}
    </div>
  );
}
