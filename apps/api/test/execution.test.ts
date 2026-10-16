import { describe, expect, it } from 'vitest';
import { executionReading } from '../src/journey/execution';

describe('executionReading', () => {
  it('leaves the plate empty when no domain action is active', () => {
    const reading = executionReading(
      [{ id: 'a', domain: null, active: true }],
      [],
      '2026-09-28',
      '2026-10-04',
    );
    expect(reading.plate).toBeNull();
    expect(reading.domains.MENTE.percent).toBeNull();
  });

  it('counts a done record in this week and ignores another domain', () => {
    const reading = executionReading(
      [
        { id: 'm', domain: 'MENTE', active: true },
        { id: 'e', domain: 'ESPIRITU', active: true },
      ],
      [{ actionId: 'm', day: '2026-09-30', status: 'DONE' }],
      '2026-09-28',
      '2026-10-04',
    );
    expect(reading.domains.MENTE).toEqual({ planned: 1, done: 1, percent: 100 });
    expect(reading.domains.ESPIRITU.percent).toBe(0);
    expect(reading.plate).toBe(50);
  });

  it('does not count a done record from another week', () => {
    const reading = executionReading(
      [{ id: 'm', domain: 'MENTE', active: true }],
      [{ actionId: 'm', day: '2026-09-21', status: 'DONE' }],
      '2026-09-28',
      '2026-10-04',
    );
    expect(reading.domains.MENTE.percent).toBe(0);
  });
});
