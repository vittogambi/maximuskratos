import { describe, expect, it } from 'vitest';
import { relationScoreRefs } from '../src/instrumentos/reading';

const gate = { sourceRef: 'mk:f-rad-002-pareja-puerta', instrument: 'relations', moduleSlug: 'f-rad-002-s1' };
const couple = [6, 7, 8].map((row) => ({
  sourceRef: `formulario-v1:F-RAD-002!R${row}`,
  instrument: 'relations',
  moduleSlug: 'f-rad-002-s1',
}));
const rest = [16, 17, 18].map((row) => ({
  sourceRef: `formulario-v1:F-RAD-002!R${row}`,
  instrument: 'relations',
  moduleSlug: 'f-rad-002-s2',
}));

describe('relationScoreRefs', () => {
  it('keeps the couple scales when the person answers about the last relationship', () => {
    const refs = relationScoreRefs([gate, ...couple, ...rest], false);
    expect(refs).toEqual([...couple, ...rest].map((row) => row.sourceRef));
  });

  it('leaves the couple scales out when there has never been a partner', () => {
    const refs = relationScoreRefs([gate, ...couple, ...rest], true);
    expect(refs).toEqual(rest.map((row) => row.sourceRef));
  });
});
