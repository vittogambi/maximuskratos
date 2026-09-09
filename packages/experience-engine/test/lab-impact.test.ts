import { describe, expect, it } from 'vitest';
import {
  deriveReplayImpact,
  importantResultChanged,
  isCriticalRegression,
  type ResultLite,
} from '../src/lab-impact';
import { readinessCopy, readinessMissing } from '../src/lab-readiness';

const stable: ResultLite = {
  priority: 'MENTALIDAD',
  planId: 'MEN-EST',
  states: {
    MENTALIDAD: 'ESTABILIZACIÓN',
    RELACIONES: 'ESTABILIZACIÓN',
    FINANZAS: 'ESTABILIZACIÓN',
    CUERPO: 'ESTABILIZACIÓN',
  },
  classifications: {
    MENTALIDAD: 'INTERPRETABLE',
    RELACIONES: 'INTERPRETABLE',
    FINANZAS: 'INTERPRETABLE',
    CUERPO: 'INTERPRETABLE',
  },
  firedCritical: false,
  firedHigh: false,
};

describe('cross-case impact', () => {
  it('does not invent improvement when the prior judgment is missing', () => {
    expect(
      deriveReplayImpact({
        importantChanged: true,
        safetyChanged: false,
      }),
    ).toBe('NEEDS_REVIEW');
  });

  it('marks a change that moves toward Rafa as improvement only when that is literal', () => {
    expect(
      deriveReplayImpact({
        importantChanged: true,
        safetyChanged: false,
        closerToRafa: true,
      }),
    ).toBe('IMPROVES');
  });

  it('blocks acceptance when a previously accepted case worsens or safety flips', () => {
    expect(
      isCriticalRegression({
        impact: 'WORSENS',
        priorCaseVerdict: 'REPRESENTS',
        rafaAcceptedMatrix: true,
      }),
    ).toBe(true);
    expect(
      isCriticalRegression({
        impact: 'NEEDS_REVIEW',
        safetyChanged: true,
        rafaAcceptedMatrix: true,
      }),
    ).toBe(true);
  });

  it('treats unchanged official outputs as UNCHANGED', () => {
    expect(importantResultChanged(stable, { ...stable })).toBe(false);
    expect(
      deriveReplayImpact({
        importantChanged: false,
        safetyChanged: false,
      }),
    ).toBe('UNCHANGED');
  });
});

describe('readiness gate', () => {
  it('lists every missing requirement and withholds the ready copy', () => {
    const missing = readinessMissing({
      contractsPass: false,
      safetyPass: true,
      enginePass: true,
      openCriticalFindings: 1,
      coreFamiliesReviewed: false,
      pendingCoreFamilies: ['Empate'],
      allIncludedChangesReplayed: false,
      openCriticalRegressions: 1,
      knownLimitationsDocumented: false,
      explicitDecisionReady: false,
    });
    expect(missing.length).toBeGreaterThanOrEqual(6);
    expect(readinessCopy(missing)).toBeNull();
  });

  it('returns the exact ready sentence only when every gate is closed', () => {
    const missing = readinessMissing({
      contractsPass: true,
      safetyPass: true,
      enginePass: true,
      openCriticalFindings: 0,
      coreFamiliesReviewed: true,
      pendingCoreFamilies: [],
      allIncludedChangesReplayed: true,
      openCriticalRegressions: 0,
      knownLimitationsDocumented: true,
      explicitDecisionReady: true,
    });
    expect(missing).toEqual([]);
    expect(readinessCopy(missing)).toBe(
      'Esta versión candidata está suficientemente alineada con el criterio metodológico registrado para avanzar a la siguiente etapa.',
    );
  });
});
