import { describe, expect, it } from 'vitest';
import { bandOf15, moduleReading, scoreFormularios, sleepReading } from '../src/diagnostic/excel-score';

type Row = { slug: string; formCode: string; value: number | null; skipped: boolean; text: string | null };

function rows(slug: string, values: Array<number | 'skip'>): Row[] {
  return values.map((value) => ({
    slug,
    formCode: slug,
    value: value === 'skip' ? null : value,
    skipped: value === 'skip',
    text: null,
  }));
}

const audit = [
  ...rows('e-aud-s1', [5, 5, 5, 5, 5]),
  ...rows('e-aud-s2', [5, 5, 5, 5, 5]),
  ...rows('e-aud-s3', [5, 5, 5, 5, 5]),
  ...rows('e-aud-s4', [5, 5, 5, 5]),
  ...rows('e-aud-s5', [5, 5, 5, 5]),
  ...rows('e-aud-s6', [1, 1, 1, 1, 1]),
];

describe('scoreFormularios', () => {
  it('sums sections 1 to 5 to 115 and leaves Brooks out', () => {
    const score = scoreFormularios(audit);
    expect(score.auditTotal).toBe(115);
    expect(score.auditBand).toBe('DOMINANTE');
    expect(score.auditAlerts).toBe(0);
  });

  it('uses the Excel cuts, not the FASE1 averages', () => {
    const low = scoreFormularios(rows('e-aud-s1', [1, 1, 1, 1, 1]));
    expect(low.auditTotal).toBe(5);
    expect(low.auditBand).toBe('CRÍTICO');
    expect(low.auditAlerts).toBe(5);
  });

  it('alerts section 1 only at 1 and sections 3 to 5 at 2 or less', () => {
    const score = scoreFormularios([
      ...rows('e-aud-s1', [2]),
      ...rows('e-aud-s3', [2]),
    ]);
    expect(score.auditAlerts).toBe(1);
  });

  it('does not treat a skipped couple item as zero and leaves the relation band pending', () => {
    const score = scoreFormularios([
      ...rows('f-rad-002', [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 'skip']),
    ]);
    expect(score.relationTotal).toBe(55);
    expect(score.relationBand).toBeNull();
    expect(score.relationBandPending).toBe(true);
  });

  it('bands a complete relation ficha and a complete finance ficha on their own cuts', () => {
    const score = scoreFormularios([
      ...rows('f-rad-002', Array(12).fill(5)),
      ...rows('f-rad-003', Array(12).fill(2)),
    ]);
    expect(score.relationTotal).toBe(60);
    expect(score.relationBand).toBe('PROPULSOR');
    expect(score.financeTotal).toBe(24);
    expect(score.financeBand).toBe('CRÍTICO');
  });
});

describe('moduleReading', () => {
  it('names each finance block from the sheet bands', () => {
    const values = [5, 5, 5, 4, 4, 3, 2, 2, 2, 1, 1, 1];
    expect(moduleReading('f-rad-003', values)).toEqual([
      { label: 'Suficiencia y flujo de caja', detail: 'Fluido, con 15 de 15.' },
      { label: 'Hábitos de ahorro y respaldo', detail: 'Calibración, con 11 de 15.' },
      { label: 'Hábitos de inversión y multiplicación', detail: 'Reestructuración, con 6 de 15.' },
      { label: 'Gestión de deudas y techo de valor', detail: 'Reestructuración, con 3 de 15.' },
    ]);
    expect(bandOf15(0)).toBe('Sin desarrollo');
  });

  it('sums an audit section and treats sleep under 6 as the sheet formula', () => {
    expect(moduleReading('e-aud-s4', [5, 4, 3, 2])).toEqual([{ label: 'Suma', detail: '14 de 20' }]);
    expect(sleepReading(5)?.detail).toBe('5 horas, por debajo de 6');
    expect(sleepReading(6)?.detail).toBe('6 horas');
  });
});
