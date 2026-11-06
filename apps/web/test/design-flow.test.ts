import { describe, expect, it } from 'vitest';
import type { DesignAction, Template } from '@/lib/intervention-api';
import { actionsForSave, emptyAction, loadLine, moveItem, scheduleLabel, weeklyLoad, withTemplateMinimum } from '@/lib/plan-design';

const template = {
  id: 'MEN-A2',
  schedule: { kind: 'WEEKLY', occasionsPerWeek: 2, minutesPerOccasion: 45 },
  minimum: { text: 'Un bloque de 25 minutos.', occasionsPerWeek: 1, minutesPerOccasion: 25 },
} as unknown as Template;

const seeded: DesignAction = {
  key: 'a1',
  title: 'Reserva un bloque',
  doneWhen: 'El bloque ocurrió',
  cue: null,
  minimum: 'Un bloque de 25 minutos.',
  schedule: { kind: 'WEEKLY', occasionsPerWeek: 2, minutesPerOccasion: 45 },
  contentTags: [],
  source: { kind: 'TEMPLATE', templateId: 'MEN-A2', usesMinimum: false },
  basis: 1,
};

describe('editor de acciones', () => {
  it('describe la frecuencia en palabras', () => {
    expect(scheduleLabel({ kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 20 })).toBe('1 vez por semana, 20 minutos cada vez');
    expect(scheduleLabel({ kind: 'ONCE', week: 2, minutesPerOccasion: 30 })).toBe('Una vez, en la semana 2 del ciclo, 30 minutos');
  });

  it('reordena sin perder elementos y no sale de los límites', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
  });

  it('la carga mínima de la plantilla cambia los números, no el texto', () => {
    const reduced = withTemplateMinimum(seeded, template, true);
    expect(reduced.title).toBe('Reserva un bloque');
    expect(reduced.schedule).toEqual({ kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 25 });
    expect(withTemplateMinimum(reduced, template, false).schedule).toEqual(seeded.schedule);
  });

  it('suma la carga por semana y la cuenta en palabras', () => {
    const once: DesignAction = { ...emptyAction(3), title: 'Llamar', schedule: { kind: 'ONCE', week: 2, minutesPerOccasion: 30 } };
    const byWeek = weeklyLoad([seeded, once], 3);
    expect(byWeek).toEqual([90, 120, 90]);
    expect(loadLine(byWeek)).toBe('semana 1: 90 minutos, semana 2: 120 minutos, semana 3: 90 minutos.');
    expect(loadLine([60, 60])).toBe('60 minutos por semana.');
  });

  it('una acción nueva no inventa una clave ni un origen', () => {
    const body = actionsForSave([{ ...emptyAction(1), title: 'Nueva', cue: '  ' }, seeded]);
    expect(body[0]).toMatchObject({ key: undefined, cue: null, usesMinimum: undefined });
    expect(body[1]).toMatchObject({ key: 'a1', usesMinimum: false });
  });
});
