import { describe, expect, it } from 'vitest';
import { accountTextsFromLedger, healthFactFromLedger } from '../src/instrumentos/ledger-account';
import type { LedgerEntry } from '../src/instrumentos/answer-ledger';

function entry(sourceRef: string, value: string | null, exceptionKind: string | null = null): LedgerEntry {
  return {
    sourceRef,
    revision: 1,
    answeredAt: new Date(),
    sessionId: 's1',
    catalogVersion: 'formulario-completo@6',
    value,
    exceptionKind,
  };
}

describe('ledger account', () => {
  it('reads weekly standard from partial ledger entries', () => {
    const texts = accountTextsFromLedger([entry('formulario-v1:E-PER-000!R62', 'Duermo ocho horas')]);
    expect(texts.weeklyStandard).toBe('Duermo ocho horas');
  });

  it('maps postpone option values like the completed session reader', () => {
    const texts = accountTextsFromLedger([entry('formulario-v1:E-PER-000!R134', '1')]);
    expect(texts.postpone).toBe('PARCIAL');
  });

  it('uses F-RAD-001 cells for health when present', () => {
    const health = healthFactFromLedger([
      entry('formulario-v1:F-RAD-001!R18', 'No'),
      entry('formulario-v1:F-RAD-001!R20', 'No'),
      entry('formulario-v1:F-RAD-001!R22', 'No'),
      entry('formulario-v1:F-RAD-001!R24', 'No'),
      entry('formulario-v1:F-RAD-001!R27', 'No'),
    ]);
    expect(health.medicalLimit).toBe('NO');
  });

  it('leaves health unknown without radiografía answers', () => {
    const health = healthFactFromLedger([]);
    expect(health.medicalLimit).toBe('UNKNOWN');
  });
});
