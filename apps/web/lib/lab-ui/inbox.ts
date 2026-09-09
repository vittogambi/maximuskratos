import type { LabCaseRow } from '@/lib/lab-api';

export type LabInboxFilter =
  | 'todos'
  | 'base'
  | 'mios'
  | 'simulaciones'
  | 'pendientes'
  | 'resultado'
  | 'cerrados'
  | 'hallazgos'
  | 'sugeridos';

export function filterLabCases(rows: LabCaseRow[], filter: LabInboxFilter): LabCaseRow[] {
  const suggested = rows
    .filter((item) => !item.matrix_review_complete && Boolean(item.latest_run))
    .slice(0, 6);
  return rows.filter((item) => {
    if (filter === 'base') return Boolean(item.casebook_key);
    if (filter === 'mios') return !item.casebook_key && item.kind !== 'SIMULATION';
    if (filter === 'simulaciones') return item.kind === 'SIMULATION';
    if (filter === 'pendientes') return !item.matrix_review_complete;
    if (filter === 'resultado') return item.latest_run?.status === 'REVEALED';
    if (filter === 'cerrados') return item.matrix_review_complete;
    if (filter === 'hallazgos') return Boolean(item.has_findings);
    if (filter === 'sugeridos') return suggested.some((row) => row.id === item.id);
    return true;
  });
}
