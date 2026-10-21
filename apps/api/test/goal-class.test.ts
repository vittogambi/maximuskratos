import { describe, expect, it } from 'vitest';
import { goalKindFromClass } from '../src/journey/accompaniment/goal-class';

describe('goal class mapping', () => {
  it('maps finish in mentalidad to ENTREGAR', () => {
    expect(goalKindFromClass('MENTALIDAD', 'FINISH')).toBe('ENTREGAR');
  });

  it('maps try in finanzas to CONSTRUIR_O_PROBAR', () => {
    expect(goalKindFromClass('FINANZAS', 'TRY')).toBe('CONSTRUIR_O_PROBAR');
  });
});
