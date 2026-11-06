import { describe, expect, it } from 'vitest';
import { PACK as MENTALIDAD } from '../src/journey/intervention/mentalidad';
import { PACK as RELACIONES } from '../src/journey/intervention/relaciones';
import {
  clampToHorizon,
  designLoad,
  designReadiness,
  emptyDesign,
  ownStrategySnapshot,
  parseDesignActions,
  recommendStrategies,
  resumeStep,
  seedFromPattern,
  seedFromTemplate,
  type PlanDesign,
} from '../src/journey/intervention/plan-design';
import {
  buildOutcomeContract,
  mergeReviewWithOutcome,
  outcomeContractMeta,
  parseContract,
} from '../src/journey/plan-outcome-contract';

const template = (id: string) => MENTALIDAD.templates.find((row) => row.id === id)!;

function ready(design: Partial<PlanDesign>, extra: Partial<Parameters<typeof designReadiness>[0]> = {}) {
  return designReadiness({
    change: 'Ordenar mi semana',
    mode: 'RESULT',
    soughtOutcome: 'Llegar al viernes con lo importante avanzado',
    criterion: 'El viernes miro la lista y hay dos cosas hechas',
    design: { ...emptyDesign(), resultSaved: true, mode: 'RESULT', ...design },
    template: null,
    protectNote: 'El sueño',
    horizonWeeks: 3,
    ...extra,
  });
}

describe('patrones de trabajo', () => {
  it('cada patrón propone acciones editables sin inventar el contenido de la persona', () => {
    const habit = seedFromPattern('HABIT', { horizonWeeks: 3, territory: 'MENTALIDAD', basis: 1 });
    expect(habit).toHaveLength(1);
    expect(habit[0]!.title).toBe('');
    expect(habit[0]!.schedule).toEqual({ kind: 'WEEKLY', occasionsPerWeek: 3, minutesPerOccasion: 15 });

    const steps = seedFromPattern('STEPS', { horizonWeeks: 4, territory: 'FINANZAS', basis: 1 });
    expect(steps.map((row) => row.schedule.kind === 'ONCE' && row.schedule.week)).toEqual([1, 2, 3]);

    const decision = seedFromPattern('DECISION', { horizonWeeks: 3, territory: 'MENTALIDAD', basis: 1 });
    expect(decision.map((row) => row.schedule.kind === 'ONCE' && row.schedule.week)).toEqual([1, 2, 3]);
    expect(decision[2]!.doneWhen).toContain('Decidí, o escribí por qué todavía no');

    const single = seedFromPattern('DECISION', { horizonWeeks: 1, territory: 'MENTALIDAD', basis: 1 });
    expect(single.every((row) => row.schedule.kind === 'ONCE' && row.schedule.week === 1)).toBe(true);
  });

  it('la conversación en Relaciones queda marcada para la aclaración de viabilidad', () => {
    const rel = seedFromPattern('CONVERSATION', { horizonWeeks: 2, territory: 'RELACIONES', basis: 1 });
    expect(rel[1]!.contentTags).toEqual(['CONFRONTATION']);
    const fin = seedFromPattern('CONVERSATION', { horizonWeeks: 2, territory: 'FINANZAS', basis: 1 });
    expect(fin[1]!.contentTags).toEqual([]);
  });

  it('la plantilla del catálogo siembra su acción con su versión mínima y sus marcas', () => {
    const [row] = seedFromTemplate(template('MEN-C2'), 2);
    expect(row!.schedule.kind).toBe('TRIGGER');
    expect(row!.source).toEqual({ kind: 'TEMPLATE', templateId: 'MEN-C2', usesMinimum: false });
    expect(row!.basis).toBe(2);
  });
});

describe('edición de acciones', () => {
  const prior = [...seedFromTemplate(template('MEN-C2'), 1), ...seedFromPattern('STEPS', { horizonWeeks: 3, territory: 'MENTALIDAD', basis: 1, existing: seedFromTemplate(template('MEN-C2'), 1) })];

  it('conserva el origen por clave y no deja crear un disparador desde el cliente', () => {
    const edited = parseDesignActions([
      { key: prior[0]!.key, title: prior[0]!.title, doneWhen: prior[0]!.doneWhen, schedule: { kind: 'TRIGGER', minutesPerOccasion: 10 }, minimum: prior[0]!.minimum },
    ], { horizonWeeks: 3, basis: 1, prior });
    expect(edited[0]!.source.kind).toBe('TEMPLATE');
    expect(edited[0]!.schedule).toMatchObject({ kind: 'TRIGGER', trigger: 'Cuando se interrumpe tu rutina' });
    expect(() => parseDesignActions([{ title: 'Nuevo', doneWhen: 'x', schedule: { kind: 'TRIGGER', minutesPerOccasion: 5 } }], { horizonWeeks: 3, basis: 1, prior })).toThrow(/se repite/);
  });

  it('reordena, agrega y elimina sin perder el texto de las acciones que quedan', () => {
    const reordered = parseDesignActions([
      { key: prior[2]!.key, title: 'Llamar al contador', doneWhen: 'La llamada ocurrió', schedule: { kind: 'ONCE', week: 2, minutesPerOccasion: 15 } },
      { title: 'Juntar las boletas', doneWhen: 'Están en una carpeta', schedule: { kind: 'ONCE', week: 1, minutesPerOccasion: 20 } },
    ], { horizonWeeks: 3, basis: 1, prior });
    expect(reordered.map((row) => row.title)).toEqual(['Llamar al contador', 'Juntar las boletas']);
    expect(reordered[0]!.key).toBe(prior[2]!.key);
    expect(reordered[1]!.source.kind).toBe('MEMBER');
    expect(new Set(reordered.map((row) => row.key)).size).toBe(2);
  });

  it('marca como desactualizada una acción que no se revisó después de cambiar el objetivo', () => {
    const kept = parseDesignActions(prior.map((row) => ({ ...row })), { horizonWeeks: 3, basis: 2, prior });
    expect(kept.every((row) => row.basis === 1)).toBe(true);
    const acknowledged = parseDesignActions(prior.map((row) => ({ ...row })), { horizonWeeks: 3, basis: 2, prior, acknowledge: true });
    expect(acknowledged.every((row) => row.basis === 2)).toBe(true);
  });

  it('rechaza listas demasiado largas, semanas fuera del ciclo y marcas desconocidas', () => {
    const many = Array.from({ length: 7 }, () => ({ title: 'x', doneWhen: 'y', schedule: { kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 5 } }));
    expect(() => parseDesignActions(many, { horizonWeeks: 3, basis: 1, prior: [] })).toThrow(/hasta 6/);
    expect(() => parseDesignActions([{ title: 'x', doneWhen: 'y', schedule: { kind: 'ONCE', week: 4, minutesPerOccasion: 5 } }], { horizonWeeks: 3, basis: 1, prior: [] })).toThrow(/semana/);
    expect(() => parseDesignActions([{ title: 'x', doneWhen: 'y', contentTags: ['MAGIA'], schedule: { kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 5 } }], { horizonWeeks: 3, basis: 1, prior: [] })).toThrow(/Marca/);
  });

  it('acorta el ciclo sin borrar pasos: los deja en la última semana', () => {
    const clamped = clampToHorizon(prior, 1);
    expect(clamped.filter((row) => row.schedule.kind === 'ONCE').every((row) => row.schedule.kind === 'ONCE' && row.schedule.week === 1)).toBe(true);
  });
});

describe('carga y preparación', () => {
  it('suma la carga por semana: lo recurrente todas las semanas, lo único en su semana', () => {
    const actions = parseDesignActions([
      { title: 'Caminar', doneWhen: 'Caminé', schedule: { kind: 'WEEKLY', occasionsPerWeek: 3, minutesPerOccasion: 20 } },
      { title: 'Comprar zapatillas', doneWhen: 'Las tengo', schedule: { kind: 'ONCE', week: 2, minutesPerOccasion: 60 } },
    ], { horizonWeeks: 3, basis: 1, prior: [] });
    expect(designLoad(actions, 3)).toMatchObject({ byWeek: [60, 120, 60], maxWeekly: 120, occasionsFirstWeek: 3, demanding: false });
  });

  it('dice qué falta y en qué paso, sin pedir campos que no aplican', () => {
    expect(resumeStep(ready({}, { change: '' }))).toBe(1);
    const nothing = ready({ resultSaved: false, mode: null });
    expect(nothing.map((row) => row.code)).toContain('RESULT_MODE');
    const exploring = designReadiness({
      change: 'Ver si me gusta correr',
      mode: 'EXPLORATION',
      soughtOutcome: '¿Me sirve correr temprano?',
      criterion: '',
      design: { ...emptyDesign(), resultSaved: true, mode: 'EXPLORATION' },
      template: null,
      protectNote: null,
      horizonWeeks: 2,
    });
    expect(exploring.map((row) => row.code)).toEqual(expect.arrayContaining(['LEARNING', 'STRATEGY', 'ACTIONS', 'PROTECT', 'LOAD']));
    expect(exploring.map((row) => row.code)).not.toContain('CRITERION');
  });

  it('pide el foco de la plantilla y confirmación cuando las acciones quedaron atrás del objetivo', () => {
    const t = template('MEN-D1');
    const actions = seedFromTemplate(t, 1);
    const missing = ready({ strategy: { kind: 'CATALOG', templateId: 'MEN-D1', focusText: null, stageDefinition: null }, actions, objectiveRevision: 2, loadConfirmed: true }, { template: t });
    expect(missing.map((row) => row.code)).toEqual(['FOCUS', 'STALE']);
    expect(resumeStep(missing)).toBe(3);
  });

  it('avisa cuando la carga semanal supera el tope del dominio', () => {
    const actions = parseDesignActions([
      { title: 'Sesión larga', doneWhen: 'Hecho', schedule: { kind: 'WEEKLY', occasionsPerWeek: 21, minutesPerOccasion: 600 } },
    ], { horizonWeeks: 3, basis: 1, prior: [] });
    const missing = ready({ actions, loadConfirmed: true, strategy: { kind: 'OWN', pattern: 'HABIT', title: 'H', approach: null } });
    const load = missing.find((row) => row.code === 'LOAD_MAX');
    expect(load?.message).toContain('28 horas');
  });

  it('un plan completo queda listo para activar', () => {
    const actions = seedFromPattern('HABIT', { horizonWeeks: 3, territory: 'MENTALIDAD', basis: 1 }).map((row) => ({ ...row, title: 'Leer 15 minutos' }));
    const missing = ready({ strategy: { kind: 'OWN', pattern: 'HABIT', title: 'Leer', approach: null }, actions, loadConfirmed: true });
    expect(missing).toEqual([]);
    expect(resumeStep(missing)).toBe(5);
  });
});

describe('recomendaciones', () => {
  it('sin datos no finge una recomendación personal', () => {
    const out = recommendStrategies({ pack: MENTALIDAD, goal: null, readings: [], mode: 'RESULT', prior: [] });
    expect(out.basis).toBe('NONE');
    expect(out.items).toEqual([]);
    expect(out.note).toContain('no hay una estrategia que destaque');
  });

  it('con el tipo de cambio elegido, recomienda por ese dato y lo dice', () => {
    const out = recommendStrategies({ pack: MENTALIDAD, goal: 'avanzar', readings: [], mode: 'RESULT', prior: [] });
    expect(out.items.map((row) => row.kind === 'CATALOG' && row.templateId)).toEqual(['MEN-B1', 'MEN-B2']);
    expect(out.items[0]!.reasons[0]).toContain('Avanzar algo que estoy postergando');
  });

  it('una lectura reconocida pesa más que el tipo de cambio, y el orden no sigue la gravedad', () => {
    const reading = MENTALIDAD.readings.find((row) => row.id === 'sostener')!;
    const out = recommendStrategies({
      pack: MENTALIDAD,
      goal: 'organizar',
      readings: [{ id: reading.id, interpretation: reading.interpretation, plans: reading.plans }],
      mode: 'RESULT',
      prior: [{ templateId: 'MEN-C1', title: 'Promesas de octubre' }],
    });
    expect(out.items.map((row) => row.kind === 'CATALOG' && row.templateId)).toEqual(['MEN-C1', 'MEN-C2', 'MEN-A1']);
    expect(out.items[0]!.priorUse).toBe('Ya la usaste en «Promesas de octubre».');
  });

  it('explorar propone primero pruebas pequeñas', () => {
    const out = recommendStrategies({ pack: RELACIONES, goal: null, readings: [], mode: 'EXPLORATION', prior: [] });
    expect(out.basis).toBe('PERSONAL');
    expect(out.items[0]).toMatchObject({ kind: 'OWN', pattern: 'EXPLORE' });
  });
});

describe('estrategia propia y resultado exploratorio', () => {
  it('la estrategia propia produce el mismo contrato de plantilla, sin indicador inventado', () => {
    const actions = seedFromPattern('STEPS', { horizonWeeks: 3, territory: 'FINANZAS', basis: 1 }).map((row, index) => ({ ...row, title: `Paso ${index + 1}` }));
    const snap = ownStrategySnapshot({ planId: '12345678-aaaa', packVersion: 'v', soughtOutcome: 'Declarar impuestos', strategy: { kind: 'OWN', pattern: 'STEPS', title: 'Por pasos', approach: 'Un paso por semana' }, actions, horizonWeeks: 3 });
    expect(snap.id).toBe('OWN-12345678');
    expect(snap.indicators).toEqual([]);
    expect(snap.action).toBe('Paso 1');
    expect(snap.notes).toEqual(['Un paso por semana']);
  });

  it('el contrato exploratorio no pide evidencia ni confirmación de criterio, y un contrato viejo se lee como resultado', () => {
    const exploring = buildOutcomeContract({ mode: 'EXPLORATION', change: 'Correr', soughtOutcome: '¿Me sirve?', criterion: 'Saber si quiero seguir', criterionStatus: 'PROVISIONAL', checkAt: '2026-11-20' });
    const meta = outcomeContractMeta({ title: 'Correr', outcome: '¿Me sirve?', outcomeContract: { current: exploring, history: [] } });
    expect(meta.complete).toBe(true);
    expect(parseContract({ soughtOutcome: 'x', criterion: 'y' })!.mode).toBe('RESULT');
  });

  it('aprender no se presenta como resultado conseguido', () => {
    const merged = mergeReviewWithOutcome({ code: 'KEEP', text: '' }, { assessment: 'LEARNED', executionLevel: 'SUFFICIENT' });
    expect(merged.outcomeText).toContain('no equivale a conseguir un resultado medible');
    expect(merged.choices).toContain('MODIFY');
  });
});
