import { describe, expect, it } from 'vitest';
import {
  ALREADY_FROZEN,
  canMutateResponses,
  canWriteSnapshot,
  compareExpectation,
  defaultBlind,
  derivedPayloadBlocked,
  EXPECTATION_PENDING,
  facilitatorNoteVisible,
  freezeDestination,
  realCasesAllowed,
  REAL_CASES_GATED,
} from '../src/lab-gates';

describe('lab gates', () => {
  it('allows synthetic casebook and blocks real/imported without the legal gate', () => {
    expect(realCasesAllowed('SYNTHETIC', false)).toBe(true);
    expect(realCasesAllowed('SELF', false)).toBe(true);
    expect(realCasesAllowed('SIMULATION', false)).toBe(true);
    expect(realCasesAllowed('REAL', false)).toBe(false);
    expect(realCasesAllowed('IMPORTED', false)).toBe(false);
    expect(realCasesAllowed('REAL', true)).toBe(true);
    expect(REAL_CASES_GATED).toBe('REAL_CASES_GATED');
  });

  it('defaults blindness and freeze destination', () => {
    expect(defaultBlind('SYNTHETIC')).toBe(true);
    expect(defaultBlind('REAL')).toBe(false);
    expect(freezeDestination(true)).toBe('AWAITING_EXPECTATION');
    expect(freezeDestination(false)).toBe('REVEALED');
  });

  it('freezes snapshot once and locks responses', () => {
    expect(canMutateResponses('COLLECTING')).toBe(true);
    expect(canMutateResponses('AWAITING_EXPECTATION')).toBe(false);
    expect(canWriteSnapshot('COLLECTING', false)).toBe(true);
    expect(canWriteSnapshot('COLLECTING', true)).toBe(false);
    expect(canWriteSnapshot('AWAITING_EXPECTATION', true)).toBe(false);
    expect(ALREADY_FROZEN).toBe('ALREADY_FROZEN');
  });

  it('blocks derived payloads while expectation is pending', () => {
    for (const endpoint of ['result', 'trace', 'preview', 'comparison', 'review', 'experience']) {
      expect(derivedPayloadBlocked('AWAITING_EXPECTATION', endpoint)).toBe(true);
    }
    expect(derivedPayloadBlocked('REVEALED', 'result')).toBe(false);
    expect(derivedPayloadBlocked('COLLECTING', 'result')).toBe(false);
    expect(EXPECTATION_PENDING).toBe('EXPECTATION_PENDING');
  });

  it('keeps facilitator notes hidden until reveal', () => {
    expect(facilitatorNoteVisible('COLLECTING')).toBe(false);
    expect(facilitatorNoteVisible('AWAITING_EXPECTATION')).toBe(false);
    expect(facilitatorNoteVisible('FAILED')).toBe(false);
    expect(facilitatorNoteVisible('REVEALED')).toBe(true);
  });

  it('marks purpose as MATRIX_SILENT and finds first state divergence', () => {
    const comparison = compareExpectation({
      firedAlerts: ['D-CUE-05'],
      classifications: {
        MENTALIDAD: 'INTERPRETABLE',
        RELACIONES: 'INTERPRETABLE',
        FINANZAS: 'INTERPRETABLE',
        CUERPO: 'INTERPRETABLE',
      },
      states: {
        MENTALIDAD: 'ESTABILIZACIÓN',
        RELACIONES: 'CONSOLIDACIÓN',
        FINANZAS: 'CONSOLIDACIÓN',
        CUERPO: 'CONTENCIÓN',
      },
      priority: 'CUERPO',
      planId: 'CUE-CON',
      expectedAlerts: ['D-CUE-05'],
      expectedStates: {
        MENTALIDAD: 'ESTABILIZACIÓN',
        RELACIONES: 'CONSOLIDACIÓN',
        FINANZAS: 'CONSOLIDACIÓN',
        CUERPO: 'ESTABILIZACIÓN',
      },
      expectedPriority: 'MENTALIDAD',
      expectedPlanId: 'MEN-EST',
    });
    expect(comparison.first_divergence).toBe('states');
    expect(comparison.rows.find((row) => row.key === 'purpose')?.result).toBe('MATRIX_SILENT');
    expect(comparison.rows.find((row) => row.key === 'priority')?.possible_consequence).toBe(true);
  });
});
