import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadMigrationLedger, loadSourceMappings } from '../src/source-mapping';
import type { MatrixDefinition } from '../src/types';

const definition = JSON.parse(
  readFileSync(resolve(__dirname, '../definitions/matrix-v2.0.json'), 'utf8'),
) as MatrixDefinition;

describe('LAB-060 source mapping sidecar', () => {
  const mappings = loadSourceMappings();
  const byId = new Map(mappings.map((item) => [item.v2_question_id, item]));

  it('has one row per 01_PREGUNTAS id plus REMOVED concepts', () => {
    const live = mappings.filter((item) => item.transformation_type !== 'REMOVED');
    expect(live.map((item) => item.v2_question_id).sort()).toEqual(
      definition.questions.map((item) => item.id).sort(),
    );
    expect(mappings.filter((item) => item.transformation_type === 'REMOVED')).toHaveLength(15);
  });

  it('keeps every v2_question_id in the definition or marked REMOVED', () => {
    const ids = new Set(definition.questions.map((item) => item.id));
    for (const item of mappings) {
      expect(ids.has(item.v2_question_id) || item.transformation_type === 'REMOVED').toBe(true);
    }
  });

  it('does not leave HIGH mappings without an original text unless NEW_IN_V2', () => {
    for (const item of mappings.filter((row) => row.confidence === 'HIGH')) {
      if (item.transformation_type === 'NEW_IN_V2') {
        expect(item.source_question).toBeNull();
      } else {
        expect(item.source_question).toBeTruthy();
      }
    }
  });

  it('marks every UNCLEAR row for Rafa review', () => {
    for (const item of mappings.filter((row) => row.transformation_type === 'UNCLEAR')) {
      expect(item.review_needed_by_rafa).toBe('YES');
      expect(item.source_question).toBeNull();
    }
  });

  it('maps AUD-CUE-04 to E-AUD-001 Q6 as HIGH reformulated', () => {
    expect(byId.get('AUD-CUE-04')).toMatchObject({
      source_form: 'E-AUD-001',
      source_section: 'SECCIÓN 2: HÁBITOS Y ACCIONES',
      source_question_number: '6',
      transformation_type: 'REFORMULATED',
      confidence: 'HIGH',
    });
  });
});

describe('LAB-061 source form corrections', () => {
  const mappings = loadSourceMappings();

  it('points the 20 D-REL questions at F-RAD-002', () => {
    const rel = mappings.filter((item) => /^D-REL-/.test(item.v2_question_id));
    expect(rel).toHaveLength(20);
    expect(rel.every((item) => item.source_form === 'F-RAD-002')).toBe(true);
    expect(rel.every((item) => item.source_form !== 'E-AUD-001')).toBe(true);
  });

  it('does not cite F-RAD-001 on AUD-REL or AUD-FIN', () => {
    const rows = mappings.filter((item) => /^AUD-(REL|FIN)-/.test(item.v2_question_id));
    expect(rows.length).toBeGreaterThan(0);
    for (const item of rows) {
      expect(item.source_form).toBe('E-AUD-001');
      expect(item.source_form ?? '').not.toContain('F-RAD-001');
    }
  });

  it('does not leave D-REL citing only E-AUD-001', () => {
    for (const item of mappings.filter((row) => /^D-REL-/.test(row.v2_question_id))) {
      expect(item.source_form).not.toBe('E-AUD-001');
    }
  });
});

describe('LAB-064 migration ledger', () => {
  it('copies the 15 10_MIGRACION rows in sheet order', () => {
    const rows = loadMigrationLedger();
    expect(rows).toHaveLength(15);
    expect(rows[0]).toMatchObject({
      id: 'MIG-01',
      source_sheets: 'RESUMEN',
      problem: 'D26 #DIV/0!',
    });
    expect(rows[5]).toMatchObject({
      id: 'MIG-06',
      source_sheets: 'E-AUD-001',
      problem: 'Preguntas moralizantes o dobles',
    });
    expect(rows[5].v2_resolution).toContain('Banco neutral');
    expect(rows[9]).toMatchObject({
      id: 'MIG-10',
      source_sheets: 'F-RAD-001',
    });
  });
});
