import { describe, expect, it } from 'vitest';
import { applyWeekDecisions, futureOccasions, nextPlanOutcome, previewWeek } from '../src/journey/apply-week';
import { isoWeekdayFromDay } from '../src/journey/civil-week';

const actions = [
  { id: 'a', title: 'Escribir', doneWhen: 'Hay borrador', active: true },
  { id: 'b', title: 'Comparar', doneWhen: 'Hay referencias', active: true },
];

describe('applyWeekDecisions', () => {
  it('retires an action and leaves the modified one for the past', () => {
    const effects = previewWeek(actions, { a: 'MODIFY', b: 'RETIRE' }, { a: { doneWhen: 'Borrador sin diseño' } });
    expect(effects.find((effect) => effect.actionId === 'b')?.next.active).toBe(false);
    const modified = effects.find((effect) => effect.actionId === 'a');
    expect(modified?.next.doneWhen).toBe('Hay borrador');
    expect(modified?.next.active).toBe(false);
    expect(modified?.successor?.doneWhen).toBe('Borrador sin diseño');
    expect(modified?.successor?.replacesActionId).toBe('a');
  });

  it('refuses modify without a concrete change', () => {
    expect(() => applyWeekDecisions(actions, { a: 'MODIFY' }, {})).toThrow('MODIFY_REQUIRES_CHANGE');
  });
});

describe('previewWeek', () => {
  const action = { id: 'a', title: 'Escribir', doneWhen: 'Hay borrador', active: true, weekday: 1, intervalDays: 7, paused: false };

  it('rejects an empty reduction and a substitution without a new strategy', () => {
    expect(() => previewWeek([action], { a: 'REDUCE' }, {})).toThrow('REDUCE_REQUIRES_CHANGE');
    expect(() => previewWeek([action], { a: 'SUBSTITUTE' }, { a: { title: 'Escribir' } })).toThrow('SUBSTITUTE_REQUIRES_CHANGE');
  });

  it('keeps the previous load when fewer occasions start next week', () => {
    const reduced = previewWeek(
      [{ ...action, occasionsPerWeek: 2, minutesPerOccasion: 20 }],
      { a: 'REDUCE' },
      { a: { occasionsPerWeek: 1, minutesPerOccasion: 20 } },
    );
    expect(reduced[0]?.next.occasionsPerWeek).toBe(2);
    expect(reduced[0]?.next.active).toBe(false);
    expect(reduced[0]?.next.doneWhen).toBe('Hay borrador');
    expect(reduced[0]?.successor?.occasionsPerWeek).toBe(1);
    expect(reduced[0]?.successor?.doneWhen).toBe('Hay borrador');
  });

  it('reduces frequency without rewriting the criterion and substitutes without a second obligation', () => {
    const reduced = previewWeek([action], { a: 'REDUCE' }, { a: { intervalDays: 14, weekday: 3 } });
    expect(reduced[0]?.next.doneWhen).toBe('Hay borrador');
    expect(reduced[0]?.next.intervalDays).toBe(14);
    expect(reduced[0]?.next.weekday).toBe(3);
    expect(reduced[0]?.next.id).toBe('a');
    const replaced = previewWeek([action], { a: 'SUBSTITUTE' }, { a: { title: 'Ensayo corto' } });
    expect(replaced[0]?.next.active).toBe(false);
    expect(replaced[0]?.successor?.replacesActionId).toBe('a');
    const paused = previewWeek([action], { a: 'PAUSE' }, {});
    expect(paused[0]?.next.paused).toBe(true);
    expect(paused[0]?.next.doneWhen).toBe('Hay borrador');
    const resumed = previewWeek([{ ...action, paused: true }], { a: 'RESUME' }, {});
    expect(resumed[0]?.next.paused).toBe(false);
    expect(resumed[0]?.next.doneWhen).toBe('Hay borrador');
    expect(resumed[0]?.next.id).toBe('a');
  });

  it('futureOccasions uses ISO weekday including Sunday as 7', () => {
    const days = futureOccasions('2026-10-12', 7, 7, 21);
    expect(days.length).toBeGreaterThan(0);
    expect(days.every((day) => isoWeekdayFromDay(day) === 7)).toBe(true);
  });

  it('lists fewer occasions when the interval grows', () => {
    const weekly = futureOccasions('2026-10-12', 1, 7);
    const reduced = futureOccasions('2026-10-12', 1, 14);
    expect(weekly.length).toBeGreaterThan(reduced.length);
    expect(new Set(weekly).size).toBe(weekly.length);
    const later = futureOccasions('2026-11-02', 1, 7);
    expect(later.every((day) => day >= '2026-11-02')).toBe(true);
    expect(later.some((day) => day < '2026-11-02')).toBe(false);
  });

  it('keeps the plan result unless a different one is written', () => {
    expect(nextPlanOutcome('Hay un párrafo.', '  ')).toBeNull();
    expect(nextPlanOutcome('Hay un párrafo.', 'Hay un párrafo.')).toBeNull();
    expect(nextPlanOutcome('Hay un párrafo.', 'Un párrafo que se puede usar.')).toBe('Un párrafo que se puede usar.');
  });
});
