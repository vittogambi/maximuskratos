import { describe, expect, it } from 'vitest';
import {
  shadowDiagnosticFromParts,
  shadowOverallCoach,
  shadowOverallMember,
  shadowTotalsFromParts,
} from '../src/instrumentos/shadow-diagnostic';

function fullParts(values: { PR: number; ER: number; PY: number; D: number; IN: number }) {
  const part = (value: number) => ({ value, calculable: true as const });
  return {
    PR: part(values.PR),
    ER: part(values.ER),
    PY: part(values.PY),
    D: part(values.D),
    IN: part(values.IN),
  };
}

describe('shadowDiagnosticFromParts', () => {
  it('matches Excel thresholds for coach and member copy', () => {
    expect(shadowOverallMember(0, 0)).toBe('Sin desarrollo');
    expect(shadowOverallCoach(0, 0)).toBe('Sin desarrollo');
    expect(shadowOverallMember(6, 6)).toContain('Perfil libre');
    expect(shadowOverallCoach(6, 6)).toContain('PERFIL LIBRE Y ENFOCADO');
    expect(shadowOverallMember(13, 14)).toContain('Integración avanzada');
    expect(shadowOverallCoach(13, 14)).toContain('INTEGRACIÓN AVANZADA');
    expect(shadowOverallMember(36, 6)).toContain('Alerta de autosabotaje');
    expect(shadowOverallCoach(36, 6)).toContain('ALERTA DE AUTOSABOTAJE');
    expect(shadowOverallMember(36, 7)).toContain('Bloqueo moderado');
    expect(shadowOverallCoach(36, 7)).toContain('BLOQUEO MODERADO');
  });

  it('withholds labels until all five groups are calculable', () => {
    const partial = shadowDiagnosticFromParts({
      PR: { value: 4, calculable: true },
      ER: { value: null, calculable: false },
    });
    expect(partial.shadowDiagnostic).toBeNull();
    expect(partial.shadowDiagnosticCoach).toBeNull();
    expect(shadowTotalsFromParts({ PR: { value: 4, calculable: true }, ER: { value: null, calculable: false } }).ready).toBe(false);
  });

  it('persists totals and both wordings when complete', () => {
    const result = shadowDiagnosticFromParts(fullParts({ PR: 4, ER: 3, PY: 3, D: 3, IN: 14 }));
    expect(result.shadowInterferenceTotal).toBe(13);
    expect(result.shadowIntegrationTotal).toBe(14);
    expect(result.shadowDiagnostic).toContain('Integración avanzada');
    expect(result.shadowDiagnosticCoach).toContain('INTEGRACIÓN AVANZADA');
  });
});
