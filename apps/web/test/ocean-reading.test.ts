import { describe, expect, it } from 'vitest';
import { oceanClosedReading } from '@/lib/ocean-reading';

const apertura = ['formulario-v1:E-PER-000!R187', 'formulario-v1:E-PER-000!R188', 'formulario-v1:E-PER-000!R189'];

describe('resultado de factores de la personalidad', () => {
  it('no aparece en la primera pregunta del factor', () => {
    expect(oceanClosedReading(apertura[0], { [apertura[0]]: 5 })).toEqual([]);
  });

  it('muestra un factor al cerrar su trío', () => {
    const row = oceanClosedReading(apertura[2]!, {
      [apertura[0]]: 3,
      [apertura[1]]: 3,
      [apertura[2]]: 3,
    });
    expect(row).toHaveLength(1);
    expect(row[0]?.detail).toContain('Equilibrio entre creatividad y sentido práctico');
    expect(row[0]?.detail).toMatch(/Media 3(,3)? de 5/);
  });

  it('promedia el factor e invierte la pregunta del medio al cerrar el módulo', () => {
    const high = oceanClosedReading('formulario-v1:E-PER-000!R205', {
      [apertura[0]]: 5,
      [apertura[1]]: 1,
      [apertura[2]]: 5,
    });
    expect(high[0]?.detail).toContain('Mentalidad exploradora e ideal para innovación');
    expect(high).toHaveLength(5);
    expect(high[4]?.detail).toContain('Sin desarrollo');

    const low = oceanClosedReading('formulario-v1:E-PER-000!R205', {
      [apertura[0]]: 1,
      [apertura[1]]: 5,
      [apertura[2]]: 1,
    });
    expect(low[0]?.detail).toContain('Prefiere procesos claros y enfoque pragmático');

    const mid = oceanClosedReading('formulario-v1:E-PER-000!R205', {
      [apertura[0]]: 3,
      [apertura[1]]: 3,
      [apertura[2]]: 3,
    });
    expect(mid[0]?.detail).toContain('Equilibrio entre creatividad y sentido práctico');
  });
});
