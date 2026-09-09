'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { labApi, type LabChangeSetRow } from '@/lib/lab-api';
import { labUiLabels } from '@/lib/lab-ui/labels';

export default function LabExperimentsPage() {
  const [rows, setRows] = useState<LabChangeSetRow[] | null>(null);

  useEffect(() => {
    labApi
      .changeSets()
      .then((next) => setRows(next.changesets))
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <p className="lab-eyebrow">Laboratorio de metodología</p>
        <h1 className="admin-page-header__title">Cambios</h1>
        <p className="lab-lead">
          Cada cambio debe responder si arregla el problema sin romper casos que antes funcionaban.
        </p>
      </header>
      <div className="lab-stack">
        {rows === null ? null : rows.length === 0 ? (
          <p className="lab-muted">
            Todavía no has probado ningún cambio. Se crean desde un caso o desde un hallazgo.
          </p>
        ) : (
          rows.map((row) => (
            <article key={row.id} className="lab-card">
              <h2 className="lab-h2">Cambio {row.number}</h2>
              <p>{row.reason}</p>
              <p className="lab-muted">{row.operations.join('. ') || 'Cambio'}</p>
              <p className="lab-muted">
                Hallazgo:{' '}
                {row.finding ? `H-${String(row.finding.number).padStart(3, '0')} ${row.finding.title}` : 'Ninguno'}
              </p>
              <p className="lab-muted">Estado: {labUiLabels.changesetStatus(row.status)}</p>
              {row.candidate_ref ? (
                <p className="lab-muted">
                  Candidata: {candidateTitle(row.candidate_ref)}
                  <span className="lab-q__id"> {row.candidate_ref}</span>
                </p>
              ) : null}
              {row.replay_id ? (
                <Link href={`/admin/lab/replays/${row.replay_id}`}>Ver comparación</Link>
              ) : (
                <Link href="/admin/lab/versions">Antes y después</Link>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function candidateTitle(ref: string) {
  const match = ref.match(/@(\d+)$/);
  return match ? `Candidata ${match[1]}` : 'Versión candidata';
}
