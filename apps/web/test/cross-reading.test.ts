import { describe, expect, it } from 'vitest';
import { presentCrossReading } from '@/components/admin/recorrido-reading';

describe('presentCrossReading', () => {
  it('shows the linked activities, not only empty combination fields', () => {
    const reading = presentCrossReading({
      activities: [
        { sourceRef: 'R220', answer: 'Escribir ensayos' },
        { sourceRef: 'R241', answer: 'Diagnosticar equipos' },
      ],
      links: [{ id: 'l1', fromRef: 'R220', toRef: 'R241', combinationId: 'c1', reason: 'Encaja en mi semana', status: 'ACTIVE' }],
      combinations: [{ id: 'c1', reason: '', valuation: null, valuationReason: '', experiment: '' }],
      purpose: { edited: 'Quiero unir escritura y diagnóstico.' },
    });
    expect(reading.combinations[0]?.links[0]?.from).toBe('Escribir ensayos');
    expect(reading.combinations[0]?.links[0]?.to).toBe('Diagnosticar equipos');
    expect(reading.combinations[0]?.links[0]?.reason).toBe('Encaja en mi semana');
    expect(reading.purposeDraft).toBe('Quiero unir escritura y diagnóstico.');
  });
});
