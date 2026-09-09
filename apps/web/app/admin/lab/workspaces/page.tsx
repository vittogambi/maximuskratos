'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { labApi, type LabWorkspace } from '@/lib/lab-api';

export default function LabWorkspacesPage() {
  const [rows, setRows] = useState<LabWorkspace[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    labApi
      .workspaces()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar'));
  }, []);

  return (
    <div className="lab">
      <LabNav />
      <h1 className="admin-page-header__title">Espacios de trabajo</h1>
      <p className="lab-lead">Detalle interno. Los cambios se crean desde un hallazgo.</p>
      {error ? <p className="lab-error">{error}</p> : null}
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={`/admin/lab/workspaces/${row.id}`}>
              {row.baseDefinitionRef} {row.id.slice(0, 8)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
