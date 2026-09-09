import { describe, expect, it } from 'vitest';
import {
  canRevealCriterion,
  criterionVsMatrix,
  stanceFromRecord,
} from '@/lib/lab-ui/criterion-compare';

describe('criterion vs matrix', () => {
  it('treats No estoy seguro as a valid criterion, not an error', () => {
    expect(canRevealCriterion({ open_first_action: 'UNSURE', personal_first_domain: 'UNSURE' })).toBe(true);
    const view = criterionVsMatrix({
      stance: 'UNSURE',
      personalDomain: 'UNSURE',
      matrixDomain: 'FINANZAS',
      matrixState: 'CONTENCIÓN',
      matrixPlanName: null,
    });
    expect(view.phrase).toContain('No registraste una decisión firme');
    expect(view.phrase).not.toContain('No hay criterio suficiente');
    expect(view.firstDifference).toBeNull();
  });

  it('names the first visible difference without blaming an error', () => {
    const view = criterionVsMatrix({
      stance: 'DOMAIN_ONLY',
      personalDomain: 'FINANZAS',
      matrixDomain: 'CUERPO',
      matrixState: 'CONTENCIÓN',
      matrixPlanName: null,
    });
    expect(view.rows[0]).toEqual({ label: 'Ámbito prioritario', you: 'Finanzas', matrix: 'Cuerpo' });
    expect(view.phrase).toBe('La primera diferencia entre tu lectura y la Matriz aparece en el ámbito prioritario.');
  });

  it('describes a match on priority and postponed route', () => {
    const view = criterionVsMatrix({
      stance: 'DOMAIN_ONLY',
      personalDomain: 'FINANZAS',
      matrixDomain: 'FINANZAS',
      matrixState: 'NO_CLASIFICADO',
      matrixPlanName: null,
      matrixBlocked: true,
    });
    expect(view.phrase).toBe('Coinciden en elegir Finanzas como ámbito prioritario y en no entregar todavía una ruta.');
  });

  it('migrates a stored domain without stance', () => {
    expect(stanceFromRecord({ personalFirstDomain: 'CUERPO' })).toBe('DOMAIN_ONLY');
    expect(stanceFromRecord({ personalFirstDomain: 'NONE' })).toBe('NO_DOMAIN');
  });
});
