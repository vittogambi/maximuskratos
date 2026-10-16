import { describe, expect, it } from 'vitest';
import { LANDING_INSIDE_MK_STAGES } from '@/lib/landing-copy';
import { MARCO_STAGES } from '@/lib/marco-central';

describe('product stages', () => {
  it('uses the same five names and descriptions on the landing and the marco', () => {
    expect(LANDING_INSIDE_MK_STAGES.map((stage) => stage.title)).toEqual(MARCO_STAGES.map((stage) => stage.title));
    expect(LANDING_INSIDE_MK_STAGES.map((stage) => stage.body)).toEqual(MARCO_STAGES.map((stage) => stage.body));
    expect(MARCO_STAGES.map((stage) => stage.platform)).toEqual(MARCO_STAGES.map((stage) => stage.title));
  });
});
