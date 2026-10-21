import { describe, expect, it } from 'vitest';
import { readOwnPlan } from '../src/journey/own-plan';

describe('own plan gaps', () => {
  it('lists occasion, criterion and horizon gaps without mutating actions', () => {
    const reading = readOwnPlan({
      actions: [
        { id: 'a1', title: 'Paso uno', doneWhen: 'Ok', weekday: null, occasionsPerWeek: null, minutesPerOccasion: 30 },
        { id: 'a2', title: 'Paso dos', doneWhen: '', weekday: 1, occasionsPerWeek: null, minutesPerOccasion: 20 },
      ],
      reviewAt: null,
      capacityMinutes: 15,
    });
    expect(reading.gaps).toContain('OCCASION');
    expect(reading.gaps).toContain('CRITERION');
    expect(reading.gaps).toContain('HORIZON');
    expect(reading.loadExceedsDeclared).toBe(true);
  });
});
