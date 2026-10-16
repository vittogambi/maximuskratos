import { describe, expect, it } from 'vitest';
import { alertRuleConditionLabel } from '@/components/admin/recorrido-reading';

describe('alertRuleConditionLabel', () => {
  it('rewrites legacy Dispara copy to gatilla', () => {
    expect(alertRuleConditionLabel('Dispara si la respuesta es 1 o 2.')).toBe('Se gatilla con respuesta 1 o 2 en la escala.');
  });

  it('keeps current gatilla copy', () => {
    expect(alertRuleConditionLabel('Se gatilla con respuesta 1 en la escala.')).toBe('Se gatilla con respuesta 1 en la escala.');
  });
});
