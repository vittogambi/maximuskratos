import { describe, expect, it } from 'vitest';
import { playerBackTarget } from '@/components/diagnostico/player-back';

describe('player back', () => {
  it('from an intro opens the last question of the previous section', () => {
    expect(playerBackTarget({
      screen: 'intro',
      moduleSlug: 'e-aud-s2',
      isFirstInModule: true,
      previousQuestionId: 'q-last-s1',
    })).toEqual({ kind: 'question', questionId: 'q-last-s1' });
  });

  it('from the first question opens that section intro', () => {
    expect(playerBackTarget({
      screen: 'question',
      moduleSlug: 'e-aud-s2',
      isFirstInModule: true,
      previousQuestionId: 'q-last-s1',
    })).toEqual({ kind: 'intro', moduleSlug: 'e-aud-s2' });
  });

  it('from a later question opens the previous question', () => {
    expect(playerBackTarget({
      screen: 'question',
      moduleSlug: 'e-aud-s2',
      isFirstInModule: false,
      previousQuestionId: 'q1',
    })).toEqual({ kind: 'question', questionId: 'q1' });
  });

  it('hides back on the first intro', () => {
    expect(playerBackTarget({
      screen: 'intro',
      moduleSlug: 'e-aud-s1',
      isFirstInModule: true,
      previousQuestionId: null,
    })).toBeNull();
  });
});
