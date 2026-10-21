import { describe, expect, it } from 'vitest';
import { moduleMatchesTerritory, parseTerritoryParam, questionMatchesTerritory } from '../src/diagnostic/diagnostic-territory';

describe('diagnostic-territory', () => {
  it('parses known territories', () => {
    expect(parseTerritoryParam('finanzas')).toBe('FINANZAS');
  });

  it('matches audit rows to salud', () => {
    expect(
      moduleMatchesTerritory(
        [{ sourceRef: 'formulario-v1:E-AUD-001!R16' }],
        'SALUD_FISICA',
      ),
    ).toBe(true);
    expect(questionMatchesTerritory('formulario-v1:E-AUD-001!R6', 'FINANZAS')).toBe(false);
  });
});
