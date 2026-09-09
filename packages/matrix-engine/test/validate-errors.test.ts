import { describe, expect, it } from 'vitest';
import { importMatrix } from '../src/import/xlsx-importer';
import { validateDefinition } from '../src/import/validate';
import { buildWorkbook, validQuestion } from './helpers/build-xlsx';

async function codes(bytes: Buffer): Promise<string[]> {
  const result = await importMatrix({
    bytes,
    definitionId: 'matrix-test',
    sourceFileName: 'test.xlsx',
  });
  return result.report.errors.map((error) => error.code);
}

describe('import ERROR rules', () => {
  it('duplicate question id', async () => {
    const bytes = buildWorkbook({
      questions: [validQuestion(), validQuestion({ ID_Pregunta: 'AUD-MEN-01' })],
    });
    expect(await codes(bytes)).toContain('DUPLICATE_QUESTION_ID');
  });

  it('empty question id', async () => {
    const bytes = buildWorkbook({
      questions: [validQuestion({ ID_Pregunta: '   ' })],
    });
    expect(await codes(bytes)).toContain('EMPTY_QUESTION_ID');
  });

  it('missing scale', async () => {
    const bytes = buildWorkbook({
      questions: [validQuestion({ ID_Escala: 'NO_EXISTE' })],
    });
    expect(await codes(bytes)).toContain('MISSING_SCALE');
  });

  it('variable kind outside catalog', async () => {
    const bytes = buildWorkbook({
      questions: [validQuestion({ Tipo_variable: 'MAGIA' })],
    });
    expect(await codes(bytes)).toContain('INVALID_VARIABLE_KIND');
  });

  it('domain outside catalog', async () => {
    const bytes = buildWorkbook({
      questions: [validQuestion({ Ámbito: 'ESPIRITU' })],
    });
    expect(await codes(bytes)).toContain('INVALID_DOMAIN');
  });

  it('non-numeric weight', async () => {
    const bytes = buildWorkbook({
      questions: [validQuestion({ Ponderación: 'alto' })],
    });
    expect(await codes(bytes)).toContain('INVALID_WEIGHT');
  });

  it('negative weight', async () => {
    const bytes = buildWorkbook({
      questions: [validQuestion({ Ponderación: -1 })],
    });
    expect(await codes(bytes)).toContain('INVALID_WEIGHT');
  });

  it('estado without score map outside LAB-NORM-01', async () => {
    const bytes = buildWorkbook({
      questions: [
        validQuestion({
          ID_Pregunta: 'D-CUE-99',
          ID_Escala: 'SLEEP_HOURS',
          Tipo_variable: 'ESTADO',
          Ponderación: 1,
        }),
      ],
    });
    expect(await codes(bytes)).toContain('UNSCOREABLE_ESTADO');
  });

  it('critical without required fields', async () => {
    const bytes = buildWorkbook({
      questions: [
        validQuestion({
          ID_Pregunta: 'D-REL-15',
          Tipo_variable: 'RIESGO',
          Crítica: 'Sí',
          Severidad: null,
          Acción_inmediata: null,
          Derivación_profesional: null,
        }),
      ],
    });
    expect(await codes(bytes)).toContain('CRITICAL_INCOMPLETE');
  });

  it('severity outside catalog', async () => {
    const bytes = buildWorkbook({
      questions: [
        validQuestion({
          ID_Pregunta: 'D-REL-15',
          Tipo_variable: 'RIESGO',
          Crítica: 'Sí',
          Severidad: 'APOCALIPSIS',
          Acción_inmediata: 'a',
          Derivación_profesional: 'b',
        }),
      ],
    });
    expect(await codes(bytes)).toContain('INVALID_SEVERITY');
  });

  it('orphan objective', async () => {
    const bytes = buildWorkbook({
      objectives: [
        ['MEN-CON-O1', 'NO-PLAN', 1, 'texto', 'IDX-MEN', 'meta', 2, 'FUNDACIONAL'],
      ],
    });
    expect(await codes(bytes)).toContain('ORPHAN_OBJECTIVE');
  });

  it('orphan activity', async () => {
    const bytes = buildWorkbook({
      activities: [
        ['MEN-CON-O1-A1', 'NO-OBJ', 'hacer', 'Diaria', 10, 'ev', 'min', 'CAPACIDAD'],
      ],
    });
    expect(await codes(bytes)).toContain('ORPHAN_ACTIVITY');
  });

  it('invalid plan state', async () => {
    const bytes = buildWorkbook({
      plans: [
        [
          'MEN-CON',
          'MENTALIDAD',
          'CAOS',
          'nombre',
          'entrada',
          'salida',
          '6 semanas',
          3,
          'NÚCLEO',
        ],
      ],
    });
    expect(await codes(bytes)).toContain('INVALID_PLAN_STATE');
  });

  it('duplicate plan domain+state', async () => {
    const bytes = buildWorkbook({
      plans: [
        [
          'MEN-CON',
          'MENTALIDAD',
          'CONTENCIÓN',
          'a',
          'e',
          's',
          '6',
          3,
          'NÚCLEO',
        ],
        [
          'MEN-CON-2',
          'MENTALIDAD',
          'CONTENCIÓN',
          'b',
          'e',
          's',
          '6',
          3,
          'NÚCLEO',
        ],
      ],
    });
    expect(await codes(bytes)).toContain('DUPLICATE_PLAN_COMBO');
  });

  it('dimension crossing domains', async () => {
    const bytes = buildWorkbook({
      questions: [
        validQuestion(),
        validQuestion({
          ID_Pregunta: 'AUD-CUE-01',
          Ámbito: 'CUERPO',
          Dimensión: 'Dirección e identidad',
        }),
      ],
    });
    expect(await codes(bytes)).toContain('DIMENSION_CROSSES_DOMAINS');
  });

  it('alias target missing', async () => {
    const result = await importMatrix({
      bytes: buildWorkbook(),
      definitionId: 'matrix-test',
      sourceFileName: 'test.xlsx',
    });
    result.definition.alias_map.push({
      from: 'Fantasma',
      to: 'MEN.no_existe',
      interpretation: 'LAB-ALIAS-01',
    });
    const issues = validateDefinition(result.definition, {
      questionRows: [],
      catalogs: {},
    });
    expect(issues.some((issue) => issue.code === 'ALIAS_TARGET_MISSING')).toBe(true);
  });

  it('missing engine interpretation', async () => {
    const result = await importMatrix({
      bytes: buildWorkbook(),
      definitionId: 'matrix-test',
      sourceFileName: 'test.xlsx',
    });
    result.definition.interpretations = result.definition.interpretations.filter(
      (item) => item.id !== 'LAB-SAFETY-01',
    );
    const issues = validateDefinition(result.definition, {
      questionRows: [],
      catalogs: {},
    });
    expect(issues.some((issue) => issue.code === 'MISSING_INTERPRETATION')).toBe(
      true,
    );
  });
});
