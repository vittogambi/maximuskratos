import { describe, expect, it } from 'vitest';
import {
  buildMemberDirectionView,
  directionStatusForMode,
  mergeDirectionContent,
  modeFromContent,
  readDirectionFields,
} from '../src/journey/member-direction';

describe('member-direction', () => {
  it('maps mode to directionStatus', () => {
    expect(directionStatusForMode('CLEAR')).toBe('CONFIRMADO_POR_USUARIO');
    expect(directionStatusForMode('EXPLORE')).toBe('PROVISIONAL');
    expect(directionStatusForMode('UNKNOWN')).toBe('EXPLORANDO');
  });

  it('reads mode from content', () => {
    expect(modeFromContent({ directionMode: 'CLEAR' })).toBe('CLEAR');
    expect(modeFromContent({ directionStatus: 'EXPLORANDO' })).toBe('UNKNOWN');
  });

  it('mergeDirectionContent preserves synthesis fields', () => {
    const merged = mergeDirectionContent(
      { synthesis: { version: 1 }, statement: 'Antes' },
      { mode: 'CLEAR', statement: 'Nueva', desiredChange: 'Más tiempo' },
    );
    expect(merged.synthesis).toEqual({ version: 1 });
    expect(merged.statement).toBe('Nueva');
    expect(merged.desiredChange).toBe('Más tiempo');
    expect(merged.directionStatus).toBe('CONFIRMADO_POR_USUARIO');
  });

  it('buildMemberDirectionView exposes sources', () => {
    const view = buildMemberDirectionView({
      purpose: {
        id: 'p1',
        revision: 2,
        content: { directionMode: 'CLEAR', statement: 'Enseñar', desiredChange: 'Tiempo familiar' },
        createdAt: new Date('2026-01-01'),
      },
      facts: { vision: 'Visión', values: ['A', 'B'], standards: [], heritage: null, identity: null, pattern: null, activities: [], seal: null, ocean: [], relation: [], finance: [], partner: null },
      plansOnOlderRevision: 1,
    });
    expect(readDirectionFields(view).statement).toBe('Enseñar');
    expect(view.sources.vision).toBe('Visión');
    expect(view.plansOnOlderRevision).toBe(1);
  });
});
