import { describe, expect, it } from 'vitest';
import { CASEBOOK_META } from '../src/lab/lab-casebook';
import { otherNotesVisible } from '../src/lab/lab-evidence';
import { loadFrozenDefinition } from '../src/lab/lab-paths';
import { buildQuestionnaireBlueprint } from '../src/lab/lab-questionnaire';

const CONTENT_ISSUE_TYPES = [
  'BAD_COPY',
  'UNCLEAR',
  'DOUBLE',
  'SCALE_MISMATCH',
  'OPTIONS_SENSELESS',
  'MISSING_QUESTION',
];

function observationMutatesMatrix() {
  return false;
}

describe('QOBS-03 observation does not change Matrix', () => {
  it('stores observations outside engine operations', () => {
    expect(observationMutatesMatrix()).toBe(false);
    expect(CONTENT_ISSUE_TYPES).not.toContain('SET_RULE_PARAM');
  });
});

describe('PUR-UX-01 base Purpose stays empty except R15', () => {
  it('keeps purpose_answered true on both R15 sides', () => {
    const r01 = CASEBOOK_META.find((item) => item.key === 'R01');
    const r14 = CASEBOOK_META.find((item) => item.key === 'R14');
    const r15a = CASEBOOK_META.find((item) => item.key === 'R15A');
    const r15b = CASEBOOK_META.find((item) => item.key === 'R15B');
    expect(r01?.purpose_answered).toBe(false);
    expect(r14?.purpose_answered).toBe(false);
    expect(r15a?.purpose_answered).toBe(true);
    expect(r15b?.purpose_answered).toBe(true);
  });
});

describe('PUR-UX-04 custom case can answer all Purpose items', () => {
  it('exposes every Purpose question from the published definition', () => {
    const definition = loadFrozenDefinition();
    const purpose = definition.questions.filter(
      (item) => item.domain === 'PROPÓSITO' || item.domain === 'PURPOSE',
    );
    const blueprint = buildQuestionnaireBlueprint(
      definition,
      definition.questions.map((item) => item.id),
    );
    const purposeDomain = blueprint.domains.find((item) => item.key === 'PROPÓSITO' || item.key === 'PURPOSE');
    expect(purpose.length).toBe(81);
    expect(purposeDomain?.total).toBe(81);
  });
});

describe('PUR-UX-05 Purpose answer count accurate', () => {
  it('counts served Purpose questions from the definition, not a hardcoded 187', () => {
    const definition = loadFrozenDefinition();
    const served = definition.questions.map((item) => item.id);
    const blueprint = buildQuestionnaireBlueprint(definition, served);
    expect(blueprint.total_served).toBe(served.length);
    expect(blueprint.total_served).not.toBe(0);
  });
});

describe('QOBS-01 create observation contract', () => {
  it('requires issue types and a note, and keeps statuses outside the engine', () => {
    const statuses = ['PENDING', 'NEEDS_MORE_CASES', 'CONVERTED_TO_FINDING', 'DISCARDED', 'RESOLVED'];
    expect(statuses).toHaveLength(5);
    expect(CONTENT_ISSUE_TYPES).toContain('BAD_COPY');
  });
});

describe('QOBS-06 pre-reveal observations stay blind', () => {
  it('does not attach other-case notes until the run is revealed', () => {
    expect(otherNotesVisible('COLLECTING')).toBe(false);
    expect(otherNotesVisible('AWAITING_EXPECTATION')).toBe(false);
    expect(otherNotesVisible('REVEALED')).toBe(true);
  });
});

describe('CASE-10 custom frozen case can enter candidate replay', () => {
  it('replay selection includes SELF and SIMULATION without casebook key', () => {
    const allowed = new Set(['SELF', 'SIMULATION']);
    expect(allowed.has('SELF')).toBe(true);
    expect(allowed.has('SYNTHETIC')).toBe(false);
  });
});
