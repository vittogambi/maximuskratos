import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scoreAlignment, type CoreAnswer } from '../src/instrumentos/core-index';
import { captureQuality } from '../src/instrumentos/core-definition';
import { scoreDepth } from '../src/instrumentos/depth';
import { draftHelp, normalizeInterest, proposePriority } from '../src/journey/priority';

const root = resolve(__dirname, 'fixtures/casos-realistas');
const cases = JSON.parse(readFileSync(`${root}/casos.json`, 'utf8')) as {
  cases: Array<{
    id: string;
    context: { direction: string; interest: string; weekly_minutes: number; occasions: number; health_limit: string };
    user_goal: string;
    must_not: string[];
    core_answers: Record<string, number | null>;
    core_exceptions: Record<string, string>;
    capture: { mode: string };
  }>;
};
const reference = JSON.parse(readFileSync(`${root}/referencia_indices.json`, 'utf8')) as {
  tolerance: number;
  cases: Array<{ case_id: string; initial: { groups: Record<string, number | null>; pillars: Record<string, number | null>; general: number | null }; after_complete_reconfirmation?: { general: number | null } }>;
};

function sourceRef(key: string): string {
  const [sheet, row] = key.split('!row=');
  return `formulario-v1:${sheet}!R${row}`;
}

function answersOf(item: (typeof cases.cases)[number], catalog: string): CoreAnswer[] {
  return Object.entries(item.core_answers).map(([key, value]) => ({
    sourceRef: sourceRef(key),
    value: item.core_exceptions[key] ? null : value,
    exception: (item.core_exceptions[key] as CoreAnswer['exception']) ?? null,
    catalogVersion: catalog,
  }));
}

function close(actual: number | null, expected: number | null, tolerance: number) {
  if (expected == null || actual == null) {
    expect(actual).toBe(expected);
    return;
  }
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

describe('oráculo aritmético contra ia-mk-cuest@0.1', () => {
  for (const item of cases.cases) {
    const expected = reference.cases.find((row) => row.case_id === item.id)!;
    it(item.id, () => {
      const catalog = item.capture.mode === 'LEGACY_MANIFEST' ? 'formulario-completo@4' : 'formulario-completo@6';
      const reading = scoreAlignment(answersOf(item, catalog));
      if (item.capture.mode === 'LEGACY_MANIFEST') {
        expect(reading.general).toBeNull();
        expect(reading.coverage.eligible).toBeLessThan(20);
        const repaired = scoreAlignment(answersOf(item, 'formulario-completo@6'));
        close(repaired.general, expected.after_complete_reconfirmation?.general ?? null, reference.tolerance);
        return;
      }
      close(reading.general, expected.initial.general, reference.tolerance);
      close(reading.pillars.ESPIRITU, expected.initial.pillars.E, reference.tolerance);
      close(reading.pillars.MENTE, expected.initial.pillars.M, reference.tolerance);
      close(reading.pillars.CUERPO, expected.initial.pillars.C, reference.tolerance);
      expect(reading.coverage.eligible).toBe((expected.initial as { eligible_reference_count: number }).eligible_reference_count);
      for (const [group, value] of Object.entries(expected.initial.groups)) {
        close(reading.groups[group as keyof typeof reading.groups].value, value, reference.tolerance);
      }
    });
  }

  it('un ingreso ajeno y un texto largo no mueven el núcleo ni la profundidad', () => {
    const base = cases.cases.find((item) => item.id === 'MK-S01')!;
    const first = scoreAlignment(answersOf(base, 'formulario-completo@6'));
    const second = scoreAlignment([
      ...answersOf(base, 'formulario-completo@6'),
      { sourceRef: 'formulario-v1:F-RAD-003!R48', value: null, catalogVersion: 'formulario-completo@6' },
    ]);
    expect(second.general).toBe(first.general);
    const short = scoreDepth([{
      component: 'origen', record: 'VALID', recognized: { meaning: 'Conozco una parte.', matters: 'No invento el resto.' }, integrated: null, linkCurrent: true, contrasted: null,
    }]);
    const long = scoreDepth([{
      component: 'origen', record: 'VALID', recognized: { meaning: 'Conozco una parte. '.repeat(80), matters: 'No invento el resto.' }, integrated: null, linkCurrent: true, contrasted: null,
    }]);
    expect(long.components.find((row) => row.component === 'origen')?.score).toBe(short.components.find((row) => row.component === 'origen')?.score);
  });
});

describe('propuesta del motor, sin el texto esperado del caso', () => {
  const rawOf = (id: string) => Object.fromEntries(
    Object.entries(cases.cases.find((item) => item.id === id)!.core_answers)
      .filter(([, value]) => value != null)
      .map(([key, value]) => [sourceRef(key), value as number]),
  );

  it('vector A con interés de trabajo no elige el grupo más bajo', () => {
    const proposal = proposePriority({
      direction: 'PROVISIONAL',
      interest: normalizeInterest('TRABAJO_Y_PROYECTOS'),
      capacity: 2,
      weeklyMinutes: 90,
      healthLimit: false,
      hasIkigaiExperiment: false,
      raw: rawOf('MK-S01'),
    });
    expect(proposal.focus).toBe('ORGANIZACION');
    const help = draftHelp(proposal, { weeklyMinutes: 90, occasions: 2, goal: 'Preparar una propuesta breve que el equipo pueda revisar.' });
    expect(help.action).toMatch(/ocasiones|revisable/i);
    expect(help.occasion).toContain('90');
    expect(help.occasion).not.toMatch(/\d{1,2}:\d{2}/);
    expect(help.forbids.join(' ')).toMatch(/horario/i);
  });

  it('explorar IKIGAI no exige el general ni monetizar', () => {
    const proposal = proposePriority({
      direction: 'EXPLORANDO',
      interest: normalizeInterest('IKIGAI'),
      capacity: 1,
      weeklyMinutes: 45,
      healthLimit: false,
      hasIkigaiExperiment: false,
      raw: rawOf('MK-S02'),
    });
    expect(proposal.focus).toBe('EXPERIMENTO');
    expect(draftHelp(proposal, { weeklyMinutes: 45, occasions: 1, goal: null }).forbids.join(' ')).toMatch(/Monetizar/);
  });

  it('límite vigente propone cuidado y prohíbe prescribir', () => {
    const proposal = proposePriority({
      direction: 'PROVISIONAL',
      interest: normalizeInterest('CUIDADO'),
      capacity: 1,
      weeklyMinutes: 30,
      healthLimit: true,
      hasIkigaiExperiment: false,
      raw: rawOf('MK-S03'),
    });
    expect(proposal.focus).toBe('CUIDADO');
    expect(draftHelp(proposal, { weeklyMinutes: 30, occasions: 1, goal: null }).forbids).toEqual(expect.arrayContaining(['Dieta', 'Medicación']));
  });

  it('capacidad cero no crea una obligación', () => {
    const proposal = proposePriority({
      direction: 'CONFIRMADO_POR_USUARIO',
      interest: normalizeInterest('PAUSA'),
      capacity: 0,
      healthLimit: false,
      hasIkigaiExperiment: false,
      raw: rawOf('MK-S04'),
    });
    expect(proposal).toMatchObject({ focus: 'PAUSA', requiresAction: false });
    expect(draftHelp(proposal, { weeklyMinutes: 0, occasions: 0, goal: null }).action).toBeNull();
  });

  it('finanzas no propone inversión y relaciones no empeizan por confrontar', () => {
    const money = proposePriority({
      direction: 'PROVISIONAL', interest: normalizeInterest('ORDEN_FINANCIERO'), capacity: 1, healthLimit: false, hasIkigaiExperiment: false, raw: rawOf('MK-S05'),
    });
    expect(money.focus).toBe('ORDEN');
    expect(draftHelp(money, { weeklyMinutes: 40, occasions: 1, goal: null }).forbids).toEqual(expect.arrayContaining(['Inversión', 'Deuda']));
    const bond = proposePriority({
      direction: 'PROVISIONAL', interest: normalizeInterest('CUIDAR_UN_VINCULO'), capacity: 1, healthLimit: false, hasIkigaiExperiment: false, raw: rawOf('MK-S11'),
    });
    expect(bond.focus).toBe('ACLARAR');
    expect(draftHelp(bond, { weeklyMinutes: 30, occasions: 1, goal: null }).forbids.join(' ')).toMatch(/Confrontación/);
  });

  it('bajar los minutos o subir todos los extremos no se confunde con un resultado', () => {
    const maxed = Object.fromEntries(Object.entries(rawOf('MK-S01')).map(([ref, value]) => {
      if (ref.endsWith('R154')) return [ref, 2];
      if (ref.includes('E-PER-000')) return [ref, 4];
      return [ref, 5];
    }));
    const reading = scoreAlignment(Object.entries(maxed).map(([sourceRef, value]) => ({
      sourceRef, value, catalogVersion: 'formulario-completo@6',
    })));
    expect(reading.general).toBe(100);
    const same = proposePriority({
      direction: 'PROVISIONAL', interest: normalizeInterest('CUIDADO'), capacity: 1, weeklyMinutes: 20, healthLimit: false, hasIkigaiExperiment: false, raw: rawOf('MK-S01'),
    });
    const original = proposePriority({
      direction: 'PROVISIONAL', interest: normalizeInterest('TRABAJO_Y_PROYECTOS'), capacity: 2, weeklyMinutes: 90, healthLimit: false, hasIkigaiExperiment: false, raw: rawOf('MK-S01'),
    });
    expect(same.focus).not.toBe(original.focus);
    expect(scoreAlignment(Object.entries(rawOf('MK-S01')).map(([sourceRef, value]) => ({ sourceRef, value, catalogVersion: 'formulario-completo@6' }))).general).toBeCloseTo(54.4753, 4);
  });

  it('MK-V01 una respuesta fuera del núcleo no cambia el general', () => {
    const item = cases.cases.find((row) => row.id === 'MK-S01')!;
    const first = scoreAlignment(answersOf(item, 'formulario-completo@6'));
    const second = scoreAlignment([
      ...answersOf(item, 'formulario-completo@6'),
      { sourceRef: 'formulario-v1:F-RAD-003!R48', value: 5, catalogVersion: 'formulario-completo@6' },
    ]);
    expect(second.general).toBe(first.general);
  });

  it('MK-V02 marcar origen como desconocido no cambia el general', () => {
    const item = cases.cases.find((row) => row.id === 'MK-S06')!;
    const first = scoreAlignment(answersOf(item, 'formulario-completo@6'));
    const second = scoreAlignment([
      ...answersOf(item, 'formulario-completo@6'),
      { sourceRef: 'formulario-v1:F-RAD-002!R1', value: null, exception: 'UNKNOWN', catalogVersion: 'formulario-completo@6' },
    ]);
    expect(second.general).toBe(first.general);
    expect(first.general).toBeCloseTo(67.284, 3);
  });

  it('MK-V03 alargar un texto de profundidad no cambia el nivel', () => {
    const short = scoreDepth([{
      component: 'origen', record: 'VALID', recognized: { meaning: 'Conozco una parte.', matters: 'No invento el resto.' }, integrated: null, linkCurrent: true, contrasted: null,
    }]);
    const long = scoreDepth([{
      component: 'origen', record: 'VALID', recognized: { meaning: 'Conozco una parte. '.repeat(40), matters: 'No invento el resto. '.repeat(40) }, integrated: null, linkCurrent: true, contrasted: null,
    }]);
    expect(long.components.find((row) => row.component === 'origen')?.score).toBe(short.components.find((row) => row.component === 'origen')?.score);
  });

  it('la captura vieja de identidad no es elegible', () => {
    const signal = { id: 'I73', group: 'NUC-E2' as const, pillar: 'ESPIRITU' as const, sourceRef: 'formulario-v1:E-PER-000!R73', min: 1, max: 4, polarity: 'DIRECT' as const, window: '' };
    expect(captureQuality('formulario-completo@4', signal)).toBe('OPCIONES_SIN_SIGNIFICADO');
    expect(captureQuality('formulario-completo@6', signal)).toBe('ETIQUETADA');
  });
});
