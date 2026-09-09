import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importMatrix } from '../src/import/xlsx-importer';
import { canonicalize, definitionSha256 } from '../src/engine/hash';
import { EXPECTED_SOURCE_SHA256, LAB_INTERPRETATION_IDS, MatrixImportError } from '../src/types';

const XLSX = resolve(__dirname, '../../../MATRIZ_MAESTRA_MK_v2_FOCO.xlsx');

describe('P0-01 matrix import', () => {
  it('INV-17: two imports of the same xlsx are byte-identical', async () => {
    const first = await importMatrix({
      xlsxPath: XLSX,
      definitionId: 'matrix-v2.0',
      expectSha256: EXPECTED_SOURCE_SHA256,
    });
    const second = await importMatrix({
      xlsxPath: XLSX,
      definitionId: 'matrix-v2.0',
      expectSha256: EXPECTED_SOURCE_SHA256,
    });
    expect(first.canonicalJson).toBe(second.canonicalJson);
    expect(first.definition.definition_sha256).toBe(second.definition.definition_sha256);
  });

  it('produces the frozen inventory and the six warnings', async () => {
    const { definition, report } = await importMatrix({
      xlsxPath: XLSX,
      definitionId: 'matrix-v2.0',
    });

    expect(definition.definition_ref).toBe('matrix-v2.0@1');
    expect(definition.source.sha256).toBe(EXPECTED_SOURCE_SHA256);
    expect(report.counts.questions).toBe(187);
    expect(report.counts.questions_active).toBe(187);
    expect(report.counts.estado_weighted).toBe(113);
    expect(report.counts.scoreable).toBe(112);
    expect(report.counts.risks).toBe(8);
    expect(report.counts.inverse).toBe(5);
    expect(report.counts.rules).toBe(26);
    expect(report.counts.plans).toBe(16);
    expect(report.counts.objectives).toBe(48);
    expect(report.counts.activities).toBe(96);
    expect(report.counts.metrics).toBe(40);
    expect(report.counts.dimensions_raw).toBe(46);
    expect(report.counts.dimensions_canonical).toBe(41);
    expect(report.errors).toHaveLength(0);
    expect(report.warnings.map((w) => w.code)).toEqual([
      'W1',
      'W2',
      'W3',
      'W4',
      'W5',
      'W6',
    ]);
    expect(report.warnings[0].ids).toEqual(['D-REL-15', 'D-FIN-09', 'D-CUE-25']);
    expect(report.warnings[2].ids).toEqual(['D-CUE-07']);
    expect(report.publishable).toBe(true);
  });

  it('embeds the twenty LAB interpretations', async () => {
    const { definition } = await importMatrix({
      xlsxPath: XLSX,
      definitionId: 'matrix-v2.0',
    });
    const ids = definition.interpretations.map((item) => item.id);
    expect(ids).toEqual([...LAB_INTERPRETATION_IDS]);
    expect(definition.interpretations.every((item) => item.status === 'PROVISIONAL')).toBe(
      true,
    );
  });

  it('definition_sha256 ignores key order and reacts to a threshold change', async () => {
    const { definition } = await importMatrix({
      xlsxPath: XLSX,
      definitionId: 'matrix-v2.0',
    });
    const parsed = JSON.parse(canonicalize(definition));
    const shuffled = {
      status: parsed.status,
      questions: parsed.questions,
      definition_id: parsed.definition_id,
      ...parsed,
    };
    expect(definitionSha256(shuffled)).toBe(definition.definition_sha256);

    const mutated = {
      ...definition,
      coverage_bands: {
        ...definition.coverage_bands,
        insufficient_below: 0.5,
      },
    };
    expect(definitionSha256(mutated)).not.toBe(definition.definition_sha256);
  });

  it('fails when --expect-sha256 does not match', async () => {
    await expect(
      importMatrix({
        xlsxPath: XLSX,
        definitionId: 'matrix-v2.0',
        expectSha256: '0'.repeat(64),
      }),
    ).rejects.toBeInstanceOf(MatrixImportError);
  });
});
