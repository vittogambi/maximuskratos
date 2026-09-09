import { describe, expect, it } from 'vitest';
import { findingBlocksMatrix, findingEffectiveStatus, findingOpenReady, findingScope } from '../src/lab/lab-finding-ready';

describe('findingOpenReady', () => {
  it('rejects placeholder expected behavior', () => {
    const gate = findingOpenReady({
      title: 'La escala de respuesta',
      current_behavior: 'La escala de respuesta',
      rafa_expected_behavior: 'dada',
      layer: 'SCORE',
      severity: 'IMPORTANT',
      caseCount: 1,
      evidenceCount: 1,
    });
    expect(gate.ok).toBe(false);
    expect(gate.missing).toContain('Qué esperaba el revisor');
  });

  it('accepts a complete finding', () => {
    const gate = findingOpenReady({
      title: 'La lectura corta cambia el ámbito prioritario',
      current_behavior: 'AUD prioriza distinto que FULL',
      rafa_expected_behavior: 'La auditoría breve no debería cambiar el ámbito prioritario.',
      layer: 'COVERAGE',
      severity: 'IMPORTANT',
      caseCount: 1,
      evidenceCount: 1,
    });
    expect(gate.ok).toBe(true);
  });

  it('treats incomplete OPEN as DRAFT', () => {
    expect(findingEffectiveStatus('OPEN', false)).toBe('DRAFT');
    expect(findingEffectiveStatus('OPEN', true)).toBe('OPEN');
  });

  it('does not let Dirección findings block Matrix', () => {
    expect(findingScope('PURPOSE_OUTSIDE')).toBe('DIRECCION');
    expect(
      findingBlocksMatrix({ layer: 'PURPOSE_OUTSIDE', severity: 'IMPORTANT', status: 'OPEN' }),
    ).toBe(false);
  });

  it('blocks Matrix when an interfaz finding says purpose changed score', () => {
    expect(findingScope('INTERPRETATION')).toBe('INTERFAZ');
    expect(
      findingBlocksMatrix({ layer: 'INTERPRETATION', severity: 'IMPORTANT', status: 'OPEN' }),
    ).toBe(true);
  });
});
