import { describe, expect, it } from 'vitest';
import { dashboardNextStep, weekPeriodLabel } from '@/lib/dashboard-next';
import type { MatrixRow } from '@/lib/journey-api';

function row(partial: Partial<MatrixRow> & Pick<MatrixRow, 'territory' | 'label'>): MatrixRow {
  return {
    discover: { state: 'NOT_STARTED', settled: 0, required: 10, exceptionCount: 0 },
    planCount: 0,
    plan: null,
    ...partial,
  };
}

const four = ['MENTALIDAD', 'FINANZAS', 'RELACIONES', 'SALUD_FISICA'].map((territory, index) =>
  row({ territory, label: territory, discover: { state: 'NOT_STARTED', settled: 0, required: 10 + index, exceptionCount: 0 } }),
);

describe('dashboard next step', () => {
  it('asks to choose a territory after four explored areas and no plans', () => {
    const rows = four.map((item) => ({ ...item, discover: { ...item.discover, state: 'EXPLORED' as const, settled: item.discover.required } }));
    const next = dashboardNextStep(rows, null);
    expect(next.title).toBe('¿Qué te gustaría mejorar?');
    expect(next.primaryAction).toBe('Crear un plan');
    expect(next.secondaryAction).toBe('Explorar con preguntas');
    expect(next.secondaryHref).toBe('/diagnostico?alcance=general');
    expect(next.href).toBe('/disenar');
    expect(next.focusMatrix).toBe(false);
  });

  it('opens design when there is no plan yet', () => {
    const next = dashboardNextStep(four, null);
    expect(next.kind).toBe('empty');
    expect(next.title).toBe('¿Qué te gustaría mejorar?');
    expect(next.description).toContain('crear un plan directamente');
    expect(next.primaryAction).toBe('Crear un plan');
    expect(next.secondaryAction).toBe('Explorar con preguntas');
    expect(next.secondaryHref).toBe('/diagnostico?alcance=general');
    expect(next.href).toBe('/disenar');
  });

  it('prefers return, then review, focus, pause, draft and a closed cycle', () => {
    const retorno = dashboardNextStep(four, { headline: 'Vuelves después de un tiempo', protectedNote: null, daysAway: 8 });
    expect(retorno.action).toBe('Ver la semana');
    expect(retorno.description).toBe('Puedes continuar desde donde lo dejaste.');
    const paused = dashboardNextStep(four, { headline: 'Avancé el oficio', protectedNote: null, daysAway: 21, stage: 'PAUSED', planId: 'pausa-1' });
    expect(paused.resumePaused).toBe(true);
    expect(paused.primaryAction).toBe('Retomar el plan');
    expect(paused.secondaryHref).toBe('/planes/pausa-1');

    const active = row({
      territory: 'MENTALIDAD',
      label: 'Mentalidad',
      planCount: 1,
      plan: {
        id: 'p1',
        title: 'Escribir cada mañana antes de abrir el correo y dejar la frase terminada',
        stage: 'ACTIVE',
        isFocus: true,
        nextOccasion: { day: '2026-10-28', title: 'Escribir' },
        week: { done: 0, notDone: 0, noInformation: 2, excepted: 0, dueUnmarked: 0, upcoming: 0, percent: null, percentReason: 'NO_INFORMATION' },
      },
    });
    const records = dashboardNextStep([active, ...four.slice(1)], null);
    expect(records.primaryAction).toBe('Revisar mi semana');
    expect(records.title).toBe('Hay acciones por revisar');

    active.plan = { ...active.plan!, week: { ...active.plan!.week!, noInformation: 0, percentReason: 'OPEN_WEEK' } };
    const openWeek = dashboardNextStep([active, ...four.slice(1)], null);
    expect(openWeek.primaryAction).toBe('Ir a mi semana');
    expect(openWeek.href).toBe('/semana?planId=p1');

    active.plan = { ...active.plan!, nextOccasion: { day: '2026-10-29', title: 'Escribir' }, week: { ...active.plan!.week!, noInformation: 0, percentReason: 'OPEN_WEEK' } };
    expect(dashboardNextStep([active, ...four.slice(1)], null).description).toBe('Tu próxima acción es: Escribir.');

    active.plan = { ...active.plan!, nextOccasion: null, week: { ...active.plan!.week!, upcoming: 1, dueUnmarked: 0 } };
    expect(dashboardNextStep([active, ...four.slice(1)], null).description).toBe('Te queda 1 registro por completar esta semana.');

    active.plan = { ...active.plan!, nextOccasion: null, week: { ...active.plan!.week!, upcoming: 2, dueUnmarked: 0 } };
    expect(dashboardNextStep([active, ...four.slice(1)], null).description).toBe('Te quedan 2 registros por completar esta semana.');

    active.plan = { ...active.plan!, nextOccasion: null, week: { ...active.plan!.week!, upcoming: 0, dueUnmarked: 0 } };
    expect(dashboardNextStep([active, ...four.slice(1)], null).description).toBe('No tienes otra acción programada por ahora.');

    active.plan = { ...active.plan!, stage: 'PAUSED', week: null, nextOccasion: null, isFocus: true };
    const focusPaused = dashboardNextStep([active, ...four.slice(1)], null);
    expect(focusPaused.title).toContain('pausa');
    expect(focusPaused.resumePaused).toBe(true);

    active.plan = { ...active.plan!, stage: 'PREPARING', isFocus: false };
    const draft = dashboardNextStep([active, ...four.slice(1)], null);
    expect(draft.href).toBe('/disenar/p1');
    expect(draft.title).toBe('Tienes un plan por terminar');
    expect(draft.description).toContain('Escribir cada mañana');
    expect(draft.primaryAction).toBe('Continuar plan');

    active.plan = { ...active.plan!, stage: 'CLOSED' };
    const closed = dashboardNextStep([active, ...four.slice(1)], null);
    expect(closed.action).toBe('Ver cierre');
    expect(closed.title).toBe('Terminaste este ciclo');
    expect(closed.secondaryAction).toBe('Diseñar otro plan');
  });

  it('formats the civil week without turning a missing date into a range', () => {
    expect(weekPeriodLabel('2026-10-26')).toBe('26 oct a 1 nov');
    expect(weekPeriodLabel(null)).toBeNull();
  });
});
