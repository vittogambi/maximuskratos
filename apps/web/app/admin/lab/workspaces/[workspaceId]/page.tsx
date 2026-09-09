'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { LabCard, Tech } from '@/components/admin/lab/primitives';
import { labApi, type LabWorkspace } from '@/lib/lab-api';
import { labUiLabels } from '@/lib/lab-ui/labels';

export default function LabWorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const [workspace, setWorkspace] = useState<LabWorkspace | null>(null);

  useEffect(() => {
    labApi.workspace(workspaceId).then(setWorkspace).catch(() => undefined);
  }, [workspaceId]);

  if (!workspace) return <p className="lab-muted">Cargando este espacio de trabajo.</p>;

  return (
    <div className="lab">
      <Link className="lab-back" href="/admin/lab/experiments">
        Volver a cambios
      </Link>
      <h1 className="admin-page-header__title">Espacio de trabajo</h1>
      <p className="lab-lead">Detalle interno de un cambio. No es la revisión principal.</p>
      <LabCard title="Cambios de este espacio">
        {workspace.changeSets?.length ? (
          <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
            {workspace.changeSets.map((item) => (
              <li key={item.id}>
                Cambio {item.number}. {labUiLabels.changesetStatus(item.status)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="lab-muted">Todavía no hay cambios en este espacio.</p>
        )}
      </LabCard>
      <Tech>
        <p className="lab-mono">base {workspace.baseDefinitionRef}</p>
        <pre className="lab-pre">{JSON.stringify(workspace.pendingOperations, null, 2)}</pre>
        <ul>
          {workspace.changeSets?.map((item) => (
            <li key={item.id}>
              #{item.number} {item.status} {item.targetDefinitionRef}
            </li>
          ))}
        </ul>
      </Tech>
    </div>
  );
}
