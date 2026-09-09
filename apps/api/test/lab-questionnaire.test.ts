import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildQuestionnaireBlueprint, serializeScale } from '../src/lab/lab-questionnaire';
import type { MatrixDefinition } from '@mk/matrix-engine';

const definition = JSON.parse(
  readFileSync(resolve(__dirname, '../../../packages/matrix-engine/definitions/matrix-v2.0.json'), 'utf8'),
) as MatrixDefinition;

describe('LAB-065 questionnaire phases', () => {
  const blueprint = buildQuestionnaireBlueprint(
    definition,
    definition.questions.map((item) => item.id),
  );

  it('starts with Auditoría and does not include Hoja de Ruta', () => {
    expect(blueprint.phases[0]).toMatchObject({ key: 'auditoria', chip: 'Auditoría' });
    expect(blueprint.phases[0].question_ids[0]).toBe('AUD-MEN-01');
    expect(blueprint.phases.map((item) => item.chip)).toEqual([
      'Auditoría',
      'Cuerpo',
      'Relaciones',
      'Finanzas',
      'Mentalidad',
      'Propósito',
    ]);
    expect(blueprint.phases.some((item) => /Hoja|HdRP|Ruta/.test(item.title))).toBe(false);
    expect(blueprint.purpose_modules.map((item) => item.key)).not.toContain('ALINEACIÓN');
    expect(blueprint.purpose_modules.map((item) => item.name)).toEqual([
      'Historia y linaje',
      'Futuro deseado',
      'Criterios morales',
      'Mínimos no negociables',
      'Quién estoy construyendo',
      'Patrones que bloquean',
      'Recursos internos',
      'Preferencias personales',
      'Posibles propósitos',
      'Experimento real',
      'Legado y beneficiarios',
    ]);
  });

  it('splits packed CHOICE labels into selectable options', () => {
    const bodyGoal = serializeScale(definition.scales.find((item) => item.id === 'BODY_GOAL'));
    expect(bodyGoal?.anchors.map((item) => item.label)).toEqual([
      'Mantenimiento',
      'Atlético',
      'Musculado',
      'Hipertrofiado',
      'Otro',
    ]);
  });
});
