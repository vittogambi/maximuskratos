'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { Skeleton } from '@/components/admin/lab/primitives';
import { labApi, type LabCaseRow } from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';
import { matrixTrackLabel } from '@/lib/lab-ui/status';

const RESIDUE = /^(prueba|probe|mm|qa manual)/i;

function scenarioKey(label: string) {
  return label.replace(/\s+\d+$/, '').trim().toLowerCase();
}

function displayLabel(label: string) {
  return label.replace(/\bRafa\b/gi, '').replace(/\s{2,}/g, ' ').trim() || label;
}

export default function LabSandboxPage() {
  const [cases, setCases] = useState<LabCaseRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    labApi
      .cases()
      .then(setCases)
      .catch((err) => setError(humanError(err, 'No pudimos cargar el sandbox.').message));
  }, []);

  const groups = useMemo(() => {
    const rows = (cases ?? []).filter(
      (item) =>
        !item.casebook_key &&
        (item.kind === 'SELF' ||
          item.kind === 'SIMULATION' ||
          RESIDUE.test(item.label) ||
          Boolean(item.derived_from_case_id)),
    );
    const map = new Map<string, LabCaseRow[]>();
    for (const item of rows) {
      const key = scenarioKey(item.label);
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()].map(([key, items]) => {
      const latest = items
        .slice()
        .sort((a, b) => Number(Boolean(b.latest_run)) - Number(Boolean(a.latest_run)))[0]!;
      return { key, label: displayLabel(latest.label), items, latest, residue: RESIDUE.test(latest.label) };
    });
  }, [cases]);

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <p className="lab-eyebrow">Detalles técnicos</p>
        <h1 className="admin-page-header__title">Sandbox</h1>
        <p className="lab-lead">Corridos auxiliares. No cuentan para la validación.</p>
        <Link href="/admin/lab/tech">Volver a detalles técnicos</Link>
      </header>
      {error ? <p className="lab-error">{error}</p> : null}
      {cases === null ? (
        <Skeleton lines={4} />
      ) : groups.length === 0 ? (
        <p className="lab-muted">Todavía no hay experimentos manuales.</p>
      ) : (
        <div className="lab-simple-list">
          {groups.map((group) => (
            <article key={group.key} className="lab-simple-row">
              <div>
                <h2 className="lab-h4">{group.label}</h2>
                <p className="lab-muted">
                  {group.items.length} ejecuciones. Última:{' '}
                  {group.latest.latest_run ? matrixTrackLabel(group.latest.latest_run) : 'Sin run'}
                </p>
                {group.residue ? <p className="lab-muted">Residuo de desarrollo.</p> : null}
                {openKey === group.key ? (
                  <ul style={{ paddingLeft: '1.1rem' }}>
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <Link href={item.latest_run ? `/admin/lab/runs/${item.latest_run.id}` : `/admin/lab/cases/${item.id}`}>
                          {displayLabel(item.label)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <button type="button" className="lab-btn lab-btn--ghost" onClick={() => setOpenKey(openKey === group.key ? null : group.key)}>
                Ver historial
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
