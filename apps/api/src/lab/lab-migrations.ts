import { loadMigrationLedger, type MigrationLedgerRow } from '@mk/matrix-engine';

export type MigrationDecisionView = MigrationLedgerRow & {
  rafa_verdict: string | null;
  rafa_note: string | null;
  fidelity_theme: string;
  fidelity_bucket: 'Conservado' | 'Transformado' | 'Pendiente';
};

export function fidelityThemeFromLedger(row: MigrationLedgerRow): string {
  if (row.id === 'MIG-02' || row.id === 'MIG-13') return 'HdRP';
  if (row.id === 'MIG-04') return 'E-PER-006';
  if (row.id === 'MIG-12') return 'Ikigai';
  if (row.affected_v2_ids.some((id) => id.includes('REMOVED-E-AUD-001'))) return 'Brooks';
  if (row.affected_v2_ids.some((id) => id.includes('REMOVED-F-RAD-003'))) return 'F-RAD-003';
  if (row.affected_v2_ids.some((id) => /linaje|historia/i.test(id))) return 'Linaje';
  return row.source_sheets || 'Otras';
}

export function listMigrationViews(
  stored: Array<{ id: string; rafaVerdict: string | null; rafaNote: string | null }>,
): MigrationDecisionView[] {
  const byId = new Map(stored.map((row) => [row.id, row]));
  return loadMigrationLedger().map((row) => {
    const saved = byId.get(row.id);
    const rafa_verdict = saved?.rafaVerdict ?? null;
    const theme = fidelityThemeFromLedger(row);
    const namedPending = ['Brooks', 'F-RAD-003', 'E-PER-006', 'Linaje', 'Ikigai', 'HdRP'].includes(theme);
    return {
      ...row,
      rafa_verdict,
      rafa_note: saved?.rafaNote ?? null,
      fidelity_theme: theme,
      fidelity_bucket: rafa_verdict
        ? rafa_verdict === 'KEEP_V2'
          ? 'Conservado'
          : 'Transformado'
        : namedPending
          ? 'Pendiente'
          : /resuelto en diseño/i.test(row.design_status)
            ? 'Transformado'
            : 'Pendiente',
    };
  });
}

