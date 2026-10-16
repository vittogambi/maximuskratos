import { describe, expect, it } from 'vitest';
import { formatAlignmentValue } from '@/lib/journey-api';

describe('formatAlignmentValue', () => {
  it('rounds index values to whole numbers', () => {
    expect(formatAlignmentValue(52.1605)).toBe('52');
    expect(formatAlignmentValue(56.94)).toBe('57');
    expect(formatAlignmentValue(null)).toBe('—');
  });
});
