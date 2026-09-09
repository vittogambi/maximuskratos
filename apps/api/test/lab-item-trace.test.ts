import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENGINE_SEMVER, buildPolicyPlan, namedPolicy, runAssessment } from '@mk/matrix-engine';
import { domainComposition } from '../src/lab/lab-composition';
import { buildDomainFormula, buildItemTrace, buildStateBands } from '../src/lab/lab-item-trace';
import { casebookDir, loadFrozenDefinition } from '../src/lab/lab-paths';

const PLANNED = ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'] as const;

type CasebookFile = { now?: string; responses: Record<string, unknown> };

function files(): string[] {
  return readdirSync(casebookDir())
    .filter((name) => /^R\d+[A-Z]?\.json$/.test(name))
    .sort();
}

function asInput(questionId: string, value: unknown) {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return {
      questionId,
      status: 'ANSWERED' as const,
      rawValue: (record.value ?? record.rawValue ?? null) as number | string | null,
      qualitativeConfirmed: (record.qualitativeConfirmed as boolean | null | undefined) ?? null,
    };
  }
  return { questionId, status: 'ANSWERED' as const, rawValue: value as number | string | null };
}

function reading(file: string) {
  const definition = loadFrozenDefinition();
  const raw = JSON.parse(readFileSync(join(casebookDir(), file), 'utf8')) as CasebookFile;
  const responses = Object.entries(raw.responses).map(([id, value]) => asInput(id, value));
  const snapshot = runAssessment({
    definition,
    policy: namedPolicy('FULL-v1'),
    responses,
    engineSemver: ENGINE_SEMVER,
    now: raw.now ?? '2026-08-24T18:00:00.000Z',
  });
  const labels = Object.fromEntries(definition.dimensions.map((item) => [item.key, item.labels[0] ?? item.key]));
  const composition = Object.fromEntries(
    PLANNED.map((key) => [key, domainComposition(snapshot, key, labels)]),
  );
  const plan = buildPolicyPlan({ definition, policy: namedPolicy('FULL-v1'), responses });
  return {
    definition,
    snapshot,
    item_trace: buildItemTrace(definition, snapshot, composition, plan.served_ids, responses),
    state_bands: buildStateBands(definition),
    domain_formula: buildDomainFormula(snapshot, composition),
  };
}

describe('LAB-020 item_trace', () => {
  it('reconstructs classified domain scores from item contributions', () => {
    for (const file of files()) {
      const { snapshot, item_trace, state_bands } = reading(file);
      expect(state_bands, file).toHaveLength(4);
      for (const domain of snapshot.domains.filter((item) => (PLANNED as readonly string[]).includes(item.key))) {
        if (domain.classification === 'NO_CLASIFICADO' || domain.score == null) continue;
        const sum = item_trace
          .filter((item) => item.domain === domain.key && item.contribution_to_domain != null)
          .reduce((total, item) => total + (item.contribution_to_domain ?? 0), 0);
        expect(sum, `${file} ${domain.key}`).toBeCloseTo(domain.score, 2);
      }
    }
  });

  it('matches the R04 Cuerpo acceptance numbers', () => {
    const { item_trace } = reading('R04.json');
    const cue = item_trace.filter((item) => item.domain === 'CUERPO');
    expect(cue.filter((item) => item.question_id !== 'D-CUE-07')).toHaveLength(27);
    const first = cue.find((item) => item.question_id === 'AUD-CUE-01');
    expect(first).toMatchObject({
      normalized_score: 0,
      weight: 1,
      dimension: 'CUE.seguridad_y_restricciones',
    });
    const sum = cue.reduce((total, item) => total + (item.contribution_to_domain ?? 0), 0);
    expect(sum).toBeCloseTo(first?.domain_score ?? 0, 2);
    expect(first?.domain_score).toBeCloseTo(39.29, 0);
    expect(first?.domain_score_display).toBe(39);
  });

  it('marks D-CUE-07 as NO_SCALE_MAP on R03', () => {
    const { item_trace } = reading('R03.json');
    const row = item_trace.find((item) => item.question_id === 'D-CUE-07');
    expect(row).toMatchObject({ excluded_reason: 'NO_SCALE_MAP', normalized_score: null });
  });
});
