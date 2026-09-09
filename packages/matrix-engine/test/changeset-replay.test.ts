import { describe, expect, it } from 'vitest';
import { applyChangeOperations, isNoopChange } from '../src/changeset/apply-operations';
import { replayMethodology } from '../src/engine/replay';
import { loadFrozen, makeResponses } from './helpers/assessment';

describe('changeset and methodology replay', () => {
  it('rejects from mismatch and no-ops', () => {
    const definition = loadFrozen();
    const question = definition.questions.find((item) => item.id === 'AUD-CUE-01');
    expect(question).toBeTruthy();
    expect(() =>
      applyChangeOperations(definition, [
        {
          op: 'SET_QUESTION_WEIGHT',
          question_id: 'AUD-CUE-01',
          from: 99,
          to: 0.5,
        },
      ]),
    ).toThrow(/from mismatch/);

    const same = applyChangeOperations(definition, []);
    expect(isNoopChange(definition, same)).toBe(true);
  });

  it('materializes a new hash and replays without mutating the original definition', () => {
    const definition = loadFrozen();
    const originalSha = definition.definition_sha256;
    const band = definition.state_bands.find((item) => item.max === 39);
    expect(band).toBeTruthy();
    const candidate = applyChangeOperations(definition, [
      {
        op: 'SET_RULE_PARAM',
        rule_id: band!.rule_id,
        param: 'max',
        from: 39,
        to: 35,
      },
    ]);
    expect(candidate.definition_sha256).not.toBe(originalSha);
    expect(definition.definition_sha256).toBe(originalSha);

    const replay = replayMethodology({
      responses: makeResponses(definition, { scoreableValue: 4, riskValue: 5 }),
      policy: { id: 'FULL-v1', kind: 'STATIC' },
      baseDefinition: definition,
      candidateDefinition: candidate,
      now: '2026-08-25T12:00:00.000Z',
      operationCount: 1,
    });
    expect(['SINGLE', 'AMBIGUOUS', 'NONE']).toContain(replay.attribution);
    expect(replay.base.definition_sha256).toBe(originalSha);
  });
});
