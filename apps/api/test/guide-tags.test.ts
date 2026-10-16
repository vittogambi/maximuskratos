import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GUIDE_TAGS } from '../src/journey/plan-gate';

const webGuides = readFileSync(new URL('../../web/lib/plan-guides.ts', import.meta.url), 'utf8');

describe('guide ids', () => {
  it('match the guides the member can pick in the plan form', () => {
    const ids = [...webGuides.matchAll(/^ {4}id: '([a-z]+)'/gm)].map((match) => match[1]);
    expect(ids).toHaveLength(11);
    expect([...ids].sort()).toEqual(Object.keys(GUIDE_TAGS).sort());
  });
});
