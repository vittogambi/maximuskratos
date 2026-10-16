import { describe, expect, it } from 'vitest';
import { ARCHETYPE_ORIGIN_SOURCE, parseQuestionContext, readQuestionContext } from '../src/diagnostic/question-capture';

describe('parseQuestionContext', () => {
  it('hides follow, measure and hour directives from the person', () => {
    expect(parseQuestionContext('@sigue:2:Sí')).toEqual({
      contextEs: null,
      capture: null,
      follows: { order: 2, value: 'Sí', negate: false },
      subsetRef: null,
      heading: null,
    });
    expect(parseQuestionContext('@medidas:edad:Edad:años:14:100|peso:Peso:kg:35:250').capture).toEqual({
      kind: 'measures',
      fields: [
        { key: 'edad', label: 'Edad', unit: 'años', min: 14, max: 100 },
        { key: 'peso', label: 'Peso', unit: 'kg', min: 35, max: 250 },
      ],
    });
    expect(parseQuestionContext('@horas:0:12').capture).toEqual({ kind: 'hours', min: 0, max: 12 });
    expect(parseQuestionContext('@fecha:nacimiento:1:120').capture).toEqual({ kind: 'birthdate', minAge: 1, maxAge: 120 });
    expect(parseQuestionContext('@lineas:a:Primer valor|b:Segundo valor').capture).toEqual({
      kind: 'lines',
      fields: [
        { key: 'a', label: 'Primer valor' },
        { key: 'b', label: 'Segundo valor' },
      ],
    });
    expect(parseQuestionContext('@sigue:4:!No|@numero:nivel:0:10')).toMatchObject({
      follows: { order: 4, value: 'No', negate: true },
      capture: { kind: 'number', unit: 'nivel', min: 0, max: 10 },
    });
    expect(parseQuestionContext('Una nota para la persona.').contextEs).toBe('Una nota para la persona.');
    expect(parseQuestionContext('@nota:Medir la integridad.').contextEs).toBe('Medir la integridad.');
    expect(parseQuestionContext('@actividad:pasion').capture).toEqual({ kind: 'activity', field: 'pasion' });
    expect(parseQuestionContext('Detalle de formulario-v1:F-RAD-001!R18').contextEs).toBeNull();
  });

  it('marks the origen archetype item as an archetype capture', () => {
    expect(readQuestionContext(ARCHETYPE_ORIGIN_SOURCE, '@nota:Que elija del listado cuál cree que mejor lo describa').capture).toEqual({
      kind: 'archetype',
    });
  });
});
