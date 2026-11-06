import { describe, expect, it } from 'vitest';
import { inferPlanTerritory } from '../src/journey/plan-territory-assignment';

describe('inferPlanTerritory', () => {
  it('proposes a single territory when all actions agree', () => {
    const result = inferPlanTerritory([
      { territory: 'FINANZAS' },
      { territory: 'FINANZAS' },
    ]);
    expect(result.confidence).toBe('SINGLE');
    expect(result.territory).toBe('FINANZAS');
  });

  it('flags mixed territories', () => {
    const result = inferPlanTerritory([
      { territory: 'FINANZAS' },
      { territory: 'MENTALIDAD' },
    ]);
    expect(result.confidence).toBe('MIXED');
    expect(result.territory).toBeNull();
  });
});
