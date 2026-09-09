import { describe, expect, it } from 'vitest';
import { loadSourceMappings, sourceMappingById } from '@mk/matrix-engine';
import { listMigrationViews } from '../src/lab/lab-migrations';

describe('LAB-060 question source_mapping', () => {
  it('returns the HIGH mapping for AUD-CUE-04', () => {
    expect(sourceMappingById('AUD-CUE-04')).toMatchObject({
      source_form: 'E-AUD-001',
      source_section: 'SECCIÓN 2: HÁBITOS Y ACCIONES',
      source_question_number: '6',
      transformation_type: 'REFORMULATED',
      confidence: 'HIGH',
    });
  });

  it('exposes UNCLEAR rows when filtering LOW confidence', () => {
    const low = loadSourceMappings().filter(
      (item) => item.confidence === 'LOW' || item.transformation_type === 'UNCLEAR',
    );
    const unclear = loadSourceMappings().filter((item) => item.transformation_type === 'UNCLEAR');
    expect(unclear.length).toBeGreaterThan(0);
    expect(unclear.every((item) => low.some((row) => row.v2_question_id === item.v2_question_id))).toBe(true);
    expect(sourceMappingById('P-PRO-026')).toMatchObject({
      source_form: 'E-PER-006',
      transformation_type: 'MERGED',
      confidence: 'LOW',
    });
  });

  it('points D-REL-01 at F-RAD-002 after LAB-061', () => {
    expect(sourceMappingById('D-REL-01')?.source_form).toBe('F-RAD-002');
    expect(sourceMappingById('AUD-FIN-01')?.source_form).toBe('E-AUD-001');
    expect(sourceMappingById('AUD-FIN-01')?.source_form ?? '').not.toContain('F-RAD-001');
  });
});

describe('LAB-064 migration views', () => {
  it('returns 15 ledger rows and keeps a PATCH idempotent', () => {
    const empty = listMigrationViews([]);
    expect(empty).toHaveLength(15);
    expect(empty[5]).toMatchObject({
      id: 'MIG-06',
      source_sheets: 'E-AUD-001',
      rafa_verdict: null,
    });
    expect(empty[5].v2_resolution).toContain('Banco neutral');
    const once = listMigrationViews([
      { id: 'MIG-06', rafaVerdict: 'KEEP_V2', rafaNote: 'ok' },
    ]);
    const twice = listMigrationViews([
      { id: 'MIG-06', rafaVerdict: 'KEEP_V2', rafaNote: 'ok' },
    ]);
    expect(once[5].rafa_verdict).toBe('KEEP_V2');
    expect(twice[5]).toEqual(once[5]);
    const keep = listMigrationViews([{ id: 'MIG-02', rafaVerdict: 'KEEP_V2', rafaNote: null }]);
    expect(keep.find((item) => item.id === 'MIG-02')?.fidelity_bucket).toBe('Conservado');
    const recover = listMigrationViews([
      { id: 'MIG-04', rafaVerdict: 'RECOVER_DIRECTION', rafaNote: null },
    ]);
    expect(recover.find((item) => item.id === 'MIG-04')?.fidelity_bucket).toBe('Transformado');
  });
});
