import { describe, expect, it } from 'vitest';
import { NOT_CONNECTED } from '../src/journey/accompaniment/sources';
import {
  directionSeed,
  proposeLink,
  proposePurpose,
  reviewPurposeQuestion,
} from '../src/journey/purpose-link';

describe('purpose-link', () => {
  it('does not invent text without sources', () => {
    const result = proposePurpose({});
    expect(result.text).toBeNull();
    expect(result.question).toBe('¿Para qué te importa esto?');
  });

  it('cites direction statement with provenance', () => {
    const result = proposePurpose({
      directionStatement: 'Tener margen para elegir',
      directionStatus: 'CONFIRMADO_POR_USUARIO',
    });
    expect(result.text).toContain('margen');
    expect(result.refs.some((ref) => ref.id === 'direction')).toBe(true);
  });

  it('does not offer seed when direction is signed', () => {
    const seed = directionSeed({
      directionConfirmedAt: '2026-01-01',
      whyStatus: 'CONFIRMED',
      whyItMatters: 'Dormir tranquilo',
    });
    expect(seed.offer).toBe(false);
  });

  it('proposes EXPLORATORY link for EXPLORANDO unless direct reason is explicit', () => {
    expect(proposeLink({ directionStatement: 'X', directionStatus: 'EXPLORANDO' }).linkKind).toBe('EXPLORATORY');
    expect(
      proposeLink({ directionStatement: 'X', directionStatus: 'EXPLORANDO', explicitDirectReason: 'Es la prioridad del trimestre' }).linkKind,
    ).toBe('DIRECT');
  });

  it('uses the original review question for provisional why', () => {
    expect(reviewPurposeQuestion({ whyStatus: 'PROVISIONAL', whyItMatters: null })).toBe('¿Esta meta sigue importándote?');
    expect(reviewPurposeQuestion({ whyStatus: 'CONFIRMED', whyItMatters: 'Dormir sin deuda' })).toContain('Dormir sin deuda');
  });

  it('never references NOT_CONNECTED inventory ids in proposals', () => {
    const result = proposePurpose({
      goalText: 'Meta',
      directionStatement: 'ignored',
      directionStatus: 'CONFIRMADO_POR_USUARIO',
    });
    for (const ref of result.refs) {
      expect((NOT_CONNECTED as readonly string[]).includes(ref.id)).toBe(false);
    }
  });
});
