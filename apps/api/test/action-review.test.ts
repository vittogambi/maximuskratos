import { describe, expect, it } from 'vitest';
import { actionCountsInWeek, actionEnd } from '../src/journey/action-window';
import { previewWeek } from '../src/journey/apply-week';
import { reviewAppliesFrom } from '../src/journey/civil-week';
import { actionChangesResultMeaning, loadForWeek, planActionReview, type ReviewAction } from '../src/journey/intervention/action-review';

const reviewed = '2026-11-02';
const next = '2026-11-09';

const actions: ReviewAction[] = [
  { id: 'walk', title: 'Caminar', doneWhen: 'Caminé', cue: 'Al volver', minimumVersion: null, occasionsPerWeek: 3, minutesPerOccasion: 20, kind: 'WEEKLY', onceWeekStart: null, position: 0 },
  { id: 'call', title: 'Llamar al banco', doneWhen: 'Llamé', cue: null, minimumVersion: null, occasionsPerWeek: null, minutesPerOccasion: 15, kind: 'ONCE', onceWeekStart: reviewed, position: 1 },
  { id: 'later', title: 'Enviar la declaración', doneWhen: 'Enviada', cue: null, minimumVersion: null, occasionsPerWeek: null, minutesPerOccasion: 30, kind: 'ONCE', onceWeekStart: '2026-11-16', position: 2 },
  { id: 'restart', title: 'Retomar', doneWhen: 'Retomé', cue: null, minimumVersion: null, occasionsPerWeek: null, minutesPerOccasion: 10, kind: 'TRIGGER', onceWeekStart: null, position: 3 },
];

describe('vigencia de una revisión', () => {
  it('dentro de la semana revisada, los cambios empiezan el lunes siguiente', () => {
    expect(reviewAppliesFrom('2026-11-04', '2026-11-02')).toBe('2026-11-09');
    expect(reviewAppliesFrom('2026-11-09', '2026-11-02')).toBe('2026-11-09');
  });

  it('si se aplica tarde, empiezan el próximo lunes y no uno que ya pasó', () => {
    expect(reviewAppliesFrom('2026-11-10', '2026-11-02')).toBe('2026-11-16');
    expect(reviewAppliesFrom('2026-11-20', '2026-11-02')).toBe('2026-11-23');
    expect(reviewAppliesFrom('2026-11-23', '2026-11-02')).toBe('2026-11-23');
  });
});

describe('coherencia de la pregunta semanal', () => {
  it('reemplazar o renombrar una acción de plantilla pide revisión, y el resto no', () => {
    const template = new Set(['walk']);
    expect(actionChangesResultMeaning([{ op: 'SUBSTITUTE', actionId: 'walk', revision: { title: 'Nadar' } }], template)).toBe(true);
    expect(actionChangesResultMeaning([{ op: 'MODIFY', actionId: 'walk', revision: { title: 'Caminar más corto' } }], template)).toBe(true);
    expect(actionChangesResultMeaning([{ op: 'MODIFY', actionId: 'walk', revision: {} }], template)).toBe(false);
    expect(actionChangesResultMeaning([{ op: 'REDUCE', actionId: 'walk', revision: {} }], template)).toBe(false);
    expect(actionChangesResultMeaning([{ op: 'SUBSTITUTE', actionId: 'own', revision: { title: 'Nadar' } }], template)).toBe(false);
  });
});

describe('ventana de una acción', () => {
  const base = { id: 'a', active: true, effectiveFrom: '2026-11-04' };
  it('una acción terminada sigue contando en sus semanas y deja de contar después', () => {
    const ended = { ...base, active: false, effectiveTo: '2026-11-08' };
    expect(actionCountsInWeek(ended, [ended], '2026-11-02', '2026-11-08')).toBe(true);
    expect(actionCountsInWeek(ended, [ended], '2026-11-09', '2026-11-15')).toBe(false);
  });

  it('el reemplazo marca el final aunque la fila sea anterior a la columna', () => {
    const old = { ...base, active: false };
    const successor = { id: 'b', active: true, effectiveFrom: '2026-11-09', replacesActionId: 'a' };
    expect(actionEnd(old, [old, successor])).toBe('2026-11-08');
    expect(actionCountsInWeek(successor, [old, successor], '2026-11-02', '2026-11-08')).toBe(false);
  });

  it('una acción vieja terminada sin fecha no se cuenta, como antes', () => {
    expect(actionEnd({ ...base, active: false }, [])).toBeUndefined();
  });
});

describe('ADJUST en la vista previa de la semana', () => {
  const row = { id: 'walk', title: 'Caminar', doneWhen: 'Caminé', active: true, occasionsPerWeek: 3, minutesPerOccasion: 20, cue: 'Al volver', minimumVersion: null };
  it('cambiar solo el cuándo deja el texto anterior y crea una sucesora', () => {
    const [effect] = previewWeek([row], { walk: 'ADJUST' }, { walk: { cue: 'Antes de cenar' } });
    expect(effect!.next).toMatchObject({ active: false, cue: 'Al volver' });
    expect(effect!.successor).toMatchObject({ cue: 'Antes de cenar', title: 'Caminar', minimumVersion: null, replacesActionId: 'walk' });
  });

  it('cambiar solo la versión mínima también conserva la anterior', () => {
    const [effect] = previewWeek([row], { walk: 'ADJUST' }, { walk: { minimumVersion: 'Diez minutos' } });
    expect(effect!.next).toMatchObject({ active: false, minimumVersion: null, cue: 'Al volver' });
    expect(effect!.successor).toMatchObject({ minimumVersion: 'Diez minutos', cue: 'Al volver' });
  });

  it('cambiar la carga deja la acción anterior con su historia y crea una sucesora', () => {
    const [effect] = previewWeek([row], { walk: 'ADJUST' }, { walk: { occasionsPerWeek: 2 } });
    expect(effect!.next.active).toBe(false);
    expect(effect!.successor).toMatchObject({ occasionsPerWeek: 2, minutesPerOccasion: 20, cue: 'Al volver', replacesActionId: 'walk' });
  });

  it('pasar a una sola vez deja la sucesora sin frecuencia semanal', () => {
    const [effect] = previewWeek([row], { walk: 'ADJUST' }, { walk: { onceWeekStart: next } });
    expect(effect!.successor).toMatchObject({ occasionsPerWeek: null, onceWeekStart: next });
  });

  it('un ajuste sin cambios se rechaza', () => {
    expect(() => previewWeek([row], { walk: 'ADJUST' }, { walk: { cue: 'Al volver' } })).toThrow('ADJUST_REQUIRES_CHANGE');
  });
});

describe('revisión acción por acción', () => {
  it('lo no mencionado se mantiene, y solo se decide sobre lo que cambia', () => {
    const plan = planActionReview({ actions, changes: [{ actionId: 'later', op: 'RESCHEDULE', schedule: { kind: 'ONCE', weekStart: '2026-11-23' } }], additions: [], reviewedWeek: reviewed });
    expect(Object.keys(plan.decisions)).toEqual(['later']);
    expect(plan.revisions.later).toEqual({ onceWeekStart: '2026-11-23' });
    expect(plan.changes[0]!.summary).toBe('«Enviar la declaración» pasa a la semana del 23 de noviembre. Su semana original conserva lo que se registró.');
    expect(plan.choice).toBe('MODIFY');
  });

  it('modifica la tercera acción sin tocar las otras', () => {
    const plan = planActionReview({
      actions,
      changes: [{ actionId: 'later', op: 'MODIFY', title: 'Enviar la declaración con el contador', doneWhen: 'Enviada' }],
      additions: [],
      reviewedWeek: reviewed,
    });
    expect(plan.decisions).toEqual({ later: 'ADJUST' });
    expect(plan.revisions.later).toMatchObject({ title: 'Enviar la declaración con el contador', onceWeekStart: '2026-11-16' });
  });

  it('una tarea cuya semana pasó necesita una semana nueva para cambiar', () => {
    expect(() => planActionReview({ actions, changes: [{ actionId: 'call', op: 'MODIFY', title: 'Llamar al banco y pedir el saldo' }], additions: [], reviewedWeek: reviewed })).toThrow(/Elige en qué semana/);
    expect(() => planActionReview({ actions, changes: [{ actionId: 'call', op: 'RESCHEDULE', schedule: { kind: 'ONCE', weekStart: reviewed } }], additions: [], reviewedWeek: reviewed })).toThrow(/no empezó/);
    expect(() => planActionReview({ actions, changes: [{ actionId: 'later', op: 'RESCHEDULE', schedule: { kind: 'ONCE', weekStart: next } }], additions: [], reviewedWeek: reviewed, earliestWeek: '2026-11-23' })).toThrow(/no empezó/);
    expect(() => planActionReview({ actions, changes: [{ actionId: 'walk', op: 'RESCHEDULE', schedule: { kind: 'ONCE', weekStart: next } }], additions: [], reviewedWeek: reviewed })).toThrow(/se repite cada semana/);
  });

  it('aligerar tiene que bajar algo y no puede subir nada', () => {
    expect(() => planActionReview({ actions, changes: [{ actionId: 'walk', op: 'REDUCE', occasionsPerWeek: 3 }], additions: [], reviewedWeek: reviewed })).toThrow(/baja las veces/);
    expect(() => planActionReview({ actions, changes: [{ actionId: 'walk', op: 'REDUCE', occasionsPerWeek: 2, minutesPerOccasion: 30 }], additions: [], reviewedWeek: reviewed })).toThrow(/no puede subir/);
    const plan = planActionReview({ actions, changes: [{ actionId: 'walk', op: 'REDUCE', occasionsPerWeek: 2 }], additions: [], reviewedWeek: reviewed });
    expect(plan.choice).toBe('REDUCE');
    expect(plan.nextWeekMinutes).toBe(2 * 20 + 10);
  });

  it('retirar o descartar exige el motivo y no cuenta en la carga', () => {
    expect(() => planActionReview({ actions, changes: [{ actionId: 'call', op: 'RETIRE' }], additions: [], reviewedWeek: reviewed })).toThrow(/motivo/);
    const plan = planActionReview({ actions, changes: [{ actionId: 'walk', op: 'RETIRE', reason: 'Me lesioné el tobillo' }], additions: [], reviewedWeek: reviewed });
    expect(plan.endReasons).toEqual({ walk: 'Me lesioné el tobillo' });
    expect(plan.nextWeekMinutes).toBe(10);
  });

  it('sustituir pide la acción nueva y conserva el tipo de la anterior', () => {
    expect(() => planActionReview({ actions, changes: [{ actionId: 'walk', op: 'SUBSTITUTE', title: 'Caminar' , doneWhen: 'x' }], additions: [], reviewedWeek: reviewed })).toThrow(/distinta/);
    const plan = planActionReview({ actions, changes: [{ actionId: 'walk', op: 'SUBSTITUTE', title: 'Nadar', doneWhen: 'Nadé', contentTags: ['PHYSICAL_EXERTION'] }], additions: [], reviewedWeek: reviewed });
    expect(plan.revisions.walk).toMatchObject({ title: 'Nadar', doneWhen: 'Nadé', contentTags: ['PHYSICAL_EXERTION'] });
    expect(plan.choice).toBe('SUBSTITUTE');
  });

  it('agregar respeta el máximo, y una tarea ya pasada no ocupa lugar', () => {
    const add = { title: 'Archivar comprobantes', doneWhen: 'Archivados', minutesPerOccasion: 10, schedule: { kind: 'ONCE' as const, weekStart: '2026-11-23' } };
    const plan = planActionReview({ actions, changes: [], additions: [add, add, add], reviewedWeek: reviewed });
    expect(plan.additions.map((row) => row.position)).toEqual([4, 5, 6]);
    expect(() => planActionReview({ actions, changes: [], additions: [add, add, add, add], reviewedWeek: reviewed })).toThrow(/hasta 6/);
  });

  it('la carga de la semana siguiente suma todo el plan, no solo la primera acción', () => {
    expect(loadForWeek(actions, next)).toBe(60 + 10);
    expect(loadForWeek(actions, '2026-11-16')).toBe(60 + 30 + 10);
  });

  it('una acción por disparador no recibe veces por semana', () => {
    expect(() => planActionReview({ actions, changes: [{ actionId: 'restart', op: 'MODIFY', schedule: { kind: 'WEEKLY', occasionsPerWeek: 2 } }], additions: [], reviewedWeek: reviewed })).toThrow(/cuando ocurre/);
  });

  it('sin cambios y con registros faltantes, la decisión es dejar constancia', () => {
    const plan = planActionReview({ actions, changes: [], additions: [], reviewedWeek: reviewed, noRecordsNote: true });
    expect(plan.choice).toBe('NO_RECORDS');
  });
});
