import { describe, expect, it } from 'vitest';
import { nextStep, type NextStepInput } from '../src/journey/next-step';

const base: NextStepInput = {
  formularioCompleted: true,
  hasActiveSession: false,
  activeResponses: null,
  directionWorks: true,
  activePlan: null,
  weekClosed: false,
  weekRecords: 0,
};

describe('nextStep', () => {
  it('sends an exploring member with no plan to planning, not back to the sheet', () => {
    expect(nextStep({ ...base, directionWorks: true, activePlan: null })).toMatchObject({
      href: '/planes',
      label: 'Crear el plan',
    });
  });

  it('asks for a direction, and says what is missing, when the sheet has none', () => {
    const step = nextStep({ ...base, directionWorks: false });
    expect(step.href).toBe('/proposito');
    expect(step.detail).toContain('cuidar o explorar');
  });

  it('sends a member without a persisted formulario reading back to the questionnaire', () => {
    expect(nextStep({ ...base, formularioCompleted: false, directionWorks: true })).toMatchObject({
      href: '/diagnostico',
    });
  });

  it('keeps an open questionnaire session first', () => {
    expect(nextStep({ ...base, hasActiveSession: true, activeResponses: 0, formularioCompleted: false })).toMatchObject({
      href: '/diagnostico',
      label: 'Comenzar la auditoría',
    });
    expect(nextStep({ ...base, hasActiveSession: true, activeResponses: 4, formularioCompleted: false })).toMatchObject({
      label: 'Continuar la auditoría',
    });
  });

  it('asks for an action when the plan has none', () => {
    expect(nextStep({ ...base, activePlan: { actions: [] } })).toMatchObject({
      href: '/planes',
      label: 'Agregar una acción',
    });
  });

  it('opens the calendar when this week has no records yet', () => {
    expect(nextStep({ ...base, activePlan: { actions: [{ id: 'a' }] }, weekRecords: 0 })).toMatchObject({
      href: '/calendario',
      label: 'Abrir el calendario',
    });
  });
});
