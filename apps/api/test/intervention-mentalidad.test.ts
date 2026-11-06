import { describe, expect, it } from 'vitest';
import type { LedgerEntry } from '../src/instrumentos/answer-ledger';
import {
  activeIndicators,
  buildReadings,
  executionFrom,
  modifiersFor,
  progressFrom,
  readingsForGoal,
  readSources,
  reviewProposal,
  templateById,
  TEMPLATES,
  validateMeasure,
} from '../src/journey/intervention/mentalidad';
import { executionStats } from '../src/journey/intervention/execution-coverage';

const AUD = 'formulario-v1:E-AUD-001!R';
const PER = 'formulario-v1:E-PER-000!R';

function entry(sourceRef: string, value: string | null, over: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    sourceRef,
    value,
    revision: 1,
    answeredAt: new Date('2026-10-01T12:00:00Z'),
    sessionId: 's1',
    catalogVersion: 'formulario-completo@6',
    exceptionKind: null,
    ...over,
  };
}

describe('intervención Mentalidad: fuentes', () => {
  it('lee 1 y 2 como candidata, 3 como intermedio y 4 y 5 como recurso', () => {
    const read = readSources([entry(`${AUD}26`, '2'), entry(`${AUD}9`, '3'), entry(`${AUD}29`, '5')]);
    expect(read.scales.R26?.band).toBe('CANDIDATE');
    expect(read.scales.R9?.band).toBe('MIDDLE');
    expect(read.scales.R29?.band).toBe('RESOURCE');
    expect(read.scales.R26?.source).toMatchObject({ instrument: 'E-AUD-001', row: 26, catalogVersion: 'formulario-completo@6', revision: 1 });
  });

  it('deja fuera R8 y R19 capturadas con etiquetas genéricas antes de @6', () => {
    const read = readSources([
      entry(`${AUD}19`, '1', { catalogVersion: 'formulario-completo@5' }),
      entry(`${AUD}8`, '1', { catalogVersion: 'formulario-completo@6' }),
      entry(`${AUD}26`, '1', { catalogVersion: 'formulario-completo@5' }),
    ]);
    expect(read.scales.R19).toBeUndefined();
    expect(read.ineligible).toContainEqual(expect.objectContaining({ key: 'R19', reason: 'GENERIC_LABELS' }));
    expect(read.scales.R8?.band).toBe('CANDIDATE');
    expect(read.scales.R26?.band).toBe('CANDIDATE');
  });

  it('no convierte excepciones, ausencias ni «No» en dificultad o recurso', () => {
    const read = readSources([
      entry(`${AUD}26`, null, { exceptionKind: 'DECLINED' }),
      entry(`${PER}134`, null, { exceptionKind: 'UNKNOWN' }),
      entry(`${PER}135`, '0'),
    ]);
    expect(read.scales.R26).toBeUndefined();
    expect(read.difficulties.D2).toBeUndefined();
    expect(buildReadings(read, [])).toEqual([]);
  });

  it('distingue R30 de auditoría de R30 del perfil', () => {
    const read = readSources([entry(`${AUD}30`, '2'), entry(`${PER}30`, 'Un martes tranquilo.')]);
    expect(read.scales.R30?.source.instrument).toBe('E-AUD-001');
    expect(read.vision).toBeNull();
  });
});

describe('intervención Mentalidad: lecturas', () => {
  it('«Más o menos» pregunta si ocurre actualmente y «Sí» ofrece una lectura candidata', () => {
    const partial = buildReadings(readSources([entry(`${PER}134`, '1')]), []);
    expect(partial[0]).toMatchObject({ id: 'postergacion', status: 'TO_CONFIRM', question: '¿Esto ocurre actualmente?' });
    const yes = buildReadings(readSources([entry(`${PER}134`, '2')]), []);
    expect(yes[0]).toMatchObject({ id: 'postergacion', status: 'CANDIDATE', asksFocus: '¿Cuál es esa decisión o ese proyecto?' });
  });

  it('separa planificación de desplazamiento, sostener de retomar y energía de evitación', () => {
    const readings = buildReadings(readSources([
      entry(`${AUD}26`, '2'),
      entry(`${PER}135`, '2'),
      entry(`${AUD}9`, '2'),
      entry(`${AUD}29`, '1'),
      entry(`${AUD}20`, '2'),
      entry(`${AUD}19`, '4'),
      entry(`${AUD}7`, '5'),
      entry(`${PER}109`, '2'),
    ]), []);
    const ids = readings.map((row) => row.id);
    expect(ids).toEqual(expect.arrayContaining(['planificacion', 'desplazamiento', 'sostener', 'retomar', 'energia', 'contencion']));
    expect(ids).not.toContain('evitacion');
    expect(ids).not.toContain('respuesta');
    expect(readings.find((row) => row.id === 'retomar')?.plans[0]).toBe('MEN-C2');
    expect(readings.find((row) => row.id === 'contencion')?.interpretation).not.toMatch(/reaccion|impuls/i);
  });

  it('F exige (R6 bajo o R30 de auditoría bajo) y una visión disponible', () => {
    expect(buildReadings(readSources([entry(`${AUD}6`, '1')]), []).map((row) => row.id)).not.toContain('coherencia');
    const withVision = buildReadings(readSources([entry(`${AUD}30`, '2'), entry(`${PER}33`, 'Vivir con calma y oficio.')]), []);
    expect(withVision[0]).toMatchObject({ id: 'coherencia', vision: 'Vivir con calma y oficio.', question: '¿Esa visión sigue vigente para ti?' });
  });

  it('habla de lo declarado y no usa juicios sobre la persona', () => {
    const readings = buildReadings(readSources([entry(`${AUD}7`, '1'), entry(`${AUD}9`, '1'), entry(`${AUD}29`, '1')]), []);
    const text = readings.map((row) => `${row.declared.join(' ')} ${row.interpretation}`).join(' ');
    expect(text).toContain('marcaste 1 de 5');
    expect(text).toContain('En algunas situaciones te cuesta elegir cómo responder');
    expect(text).toContain('Señalaste que a veces te cuesta sostener lo que empiezas');
    expect(text).not.toMatch(/Dijiste|abandonas|no corrige|la emoción decide/i);
  });

  it('un rechazo vale para esas respuestas y caduca cuando cambia una revisión', () => {
    const ledger = [entry(`${AUD}26`, '2')];
    const first = buildReadings(readSources(ledger), []);
    const rejected = buildReadings(readSources(ledger), [{ readingId: 'planificacion', outcome: 'NOT', signature: first[0]!.signature }]);
    expect(rejected[0]?.recognition).toBe('NOT');
    expect(readingsForGoal(rejected, null).readings).toEqual([]);
    const changed = buildReadings(readSources([entry(`${AUD}26`, '1', { revision: 2 })]), [{ readingId: 'planificacion', outcome: 'NOT', signature: first[0]!.signature }]);
    expect(changed[0]?.recognition).toBeNull();
  });

  it('con meta declarada muestra hasta dos lecturas pertinentes; sin meta no declara prioridad', () => {
    const readings = buildReadings(readSources([
      entry(`${AUD}26`, '2'),
      entry(`${PER}135`, '2'),
      entry(`${AUD}9`, '1'),
    ]), []);
    const withGoal = readingsForGoal(readings, 'organizar');
    expect(withGoal.prioritized).toBe(true);
    expect(withGoal.readings.map((row) => row.id)).toEqual(['planificacion', 'desplazamiento']);
    const noGoal = readingsForGoal(readings, null);
    expect(noGoal.prioritized).toBe(false);
    expect(noGoal.readings).toHaveLength(3);
  });
});

describe('intervención Mentalidad: plantillas y ajustes', () => {
  it('cada plantilla trae acción, frecuencia o disparador, mínima, criterio, resultado, indicador y revisión', () => {
    for (const template of TEMPLATES) {
      expect(template.action.length).toBeGreaterThan(10);
      expect(template.minimum.text.length).toBeGreaterThan(5);
      expect(template.doneWhen.length).toBeGreaterThan(5);
      expect(template.seeks.length).toBeGreaterThan(5);
      expect(template.indicators.some((row) => row.role === 'RESULT')).toBe(true);
      expect(template.horizonWeeks).toBeGreaterThanOrEqual(2);
      expect(template.horizonWeeks).toBeLessThanOrEqual(4);
    }
  });

  it('A1 mínima cambia el indicador y C2 es condicional', () => {
    const a1 = templateById('MEN-A1')!;
    expect(activeIndicators(a1, true)[0]?.question).toBe('¿Avanzó tu prioridad de esta semana?');
    expect(activeIndicators(a1, false)[0]?.max).toBe(3);
    const c2 = templateById('MEN-C2')!;
    expect(c2.schedule.kind).toBe('TRIGGER');
    expect(executionFrom({ done: 0, notDone: 0, noInformation: 0 }, true)).toBe('NOT_APPLICABLE');
  });

  it('«no tengo tiempo» sugiere la mínima y R27 ofrece entorno, sin aplicarlos', () => {
    const mods = modifiersFor(readSources([entry(`${PER}133`, '2'), entry(`${AUD}27`, '1')]));
    expect(mods.suggestMinimum?.because).toMatch(/decides tú/);
    expect(mods.environmentAlternative?.text).toMatch(/opcional/);
    expect(modifiersFor(readSources([entry(`${PER}133`, '1')])).suggestMinimum).toBeNull();
  });
});

describe('intervención Mentalidad: indicadores y revisión', () => {
  it('la primera medida es la línea base del indicador', () => {
    const d1 = templateById('MEN-D1')!.indicators[0]!;
    expect(progressFrom(d1, [{ value: 9, text: null, notApplicable: false }])).toBe('UNKNOWN');
    expect(progressFrom(d1, [{ value: 9, text: null, notApplicable: false }, { value: 5, text: null, notApplicable: false }])).toBe('ADVANCE');
  });

  it('valida medidas y «no aplica» solo donde corresponde', () => {
    const c2 = templateById('MEN-C2')!.indicators[0]!;
    expect(validateMeasure(c2, { notApplicable: true }).notApplicable).toBe(true);
    const a1 = templateById('MEN-A1')!.indicators[0]!;
    expect(() => validateMeasure(a1, { value: 4 })).toThrow();
    expect(() => validateMeasure(a1, { value: 1.5 })).toThrow();
    expect(() => validateMeasure(a1, { notApplicable: true })).toThrow();
  });

  it('no cuenta solo ausencias como ejecución baja', () => {
    expect(executionFrom({ done: 0, notDone: 0, noInformation: 5 }, false)).toBe('NONE');
    expect(executionFrom({ done: 3, notDone: 1, noInformation: 4 }, false)).toBe('SUFFICIENT');
  });

  it('separa cumplimiento de cobertura en la revisión', () => {
    const sparse = executionStats({ done: 1, notDone: 0, noInformation: 9 }, false);
    expect(sparse.ratioOfResolved).toBe(100);
    expect(sparse.coverage).toBe('INCOMPLETE');
    expect(sparse.levelForReview).not.toBe('SUFFICIENT');
    const reviewSparse = reviewProposal({
      execution: sparse.levelForReview,
      progress: 'NO_ADVANCE',
      coverage: sparse.coverage,
      ratioOfResolved: sparse.ratioOfResolved,
      unresolved: sparse.noInformation,
    });
    expect(reviewSparse.code).toBe('NO_RECORDS');
    const full = executionStats({ done: 8, notDone: 2, noInformation: 0 }, false);
    expect(full.coverage).toBe('COMPLETE');
    expect(full.ratioOfResolved).toBe(80);
  });

  it('el texto exige resultado conseguido y mantiene la meta cumplida', () => {
    const textIndicator = templateById('MEN-A2')!.indicators[0]!;
    expect(() => validateMeasure(textIndicator, { text: 'No conseguí nada' })).toThrow();
    expect(progressFrom(textIndicator, [{ value: 0, text: 'No conseguí nada', notApplicable: false }])).toBe('NO_ADVANCE');
    expect(validateMeasure(textIndicator, { text: 'Entregué el borrador', textOutcome: 'ACHIEVED' }).value).toBe(1);
    expect(progressFrom(textIndicator, [{ value: 1, text: 'Sí', notApplicable: false }])).toBe('UNKNOWN');
    expect(progressFrom(textIndicator, [
      { value: 1, text: 'Sí', notApplicable: false },
      { value: 1, text: 'Sigue', notApplicable: false },
    ])).toBe('MAINTAINED');
    expect(reviewProposal({ execution: 'SUFFICIENT', progress: 'MAINTAINED' }).code).toBe('KEEP');
  });

  it('aplica la tabla de revisión acordada', () => {
    expect(reviewProposal({ execution: 'SUFFICIENT', progress: 'ADVANCE' }).code).toBe('KEEP');
    expect(reviewProposal({ execution: 'SUFFICIENT', progress: 'ADVANCE' }).text).toMatch(/no hace falta subir la carga/);
    expect(reviewProposal({ execution: 'SUFFICIENT', progress: 'NO_ADVANCE' }).code).toBe('CHECK');
    expect(reviewProposal({ execution: 'PARTIAL', progress: 'ADVANCE' }).code).toBe('LIGHTER_OK');
    const low = reviewProposal({ execution: 'LOW', progress: 'NO_ADVANCE' });
    expect(low.code).toBe('EXPLORE');
    expect(low.text).toMatch(/no la única/);
    expect(reviewProposal({ execution: 'NONE', progress: 'UNKNOWN' }).text).toMatch(/no significa que el plan haya fallado/);
    expect(reviewProposal({ execution: 'SUFFICIENT', progress: 'ADVANCE', newRestriction: true }).code).toBe('COMPATIBILITY');
  });
});
