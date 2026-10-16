import { describe, expect, it } from 'vitest';
import { personalityBandForAverage, personalityOverallAverage } from '../src/instrumentos/personality-reading';
import { scorePersonality, personalityId } from '../src/instrumentos/score';

describe('personalityOverallAverage', () => {
  it('inverts middle items and averages fifteen scores', () => {
    const raw = Array.from({ length: 15 }, () => 3);
    expect(personalityOverallAverage(raw)).toBe(3);
    raw[1] = 1;
    expect(personalityOverallAverage(raw)).toBeCloseTo((14 * 3 + 5) / 15);
  });
});

describe('scorePersonality bands', () => {
  it('uses Excel style labels and global average when complete', () => {
    const answers = Array.from({ length: 15 }, (_, index) => ({
      id: personalityId(index + 1),
      value: 3,
    }));
    answers[1] = { id: personalityId(2), value: 1 };
    const result = scorePersonality(answers);
    const apertura = result.parts.Apertura as { value: number; descriptor: string };
    expect(apertura.descriptor).toBe('Equilibrio entre creatividad y sentido práctico');
    expect(result.calculable).toBe(true);
    expect(result.value).not.toBeNull();
  });

  it('maps high and low bands', () => {
    const high = Array.from({ length: 15 }, (_, index) => ({
      id: personalityId(index + 1),
      value: index % 3 === 1 ? 1 : 5,
    }));
    const result = scorePersonality(high);
    expect(personalityBandForAverage(0, (result.parts.Apertura as { value: number }).value)).toContain('exploradora');
  });
});
