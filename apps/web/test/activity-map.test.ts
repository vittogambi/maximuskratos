import { describe, expect, it } from 'vitest';
import { activityAnswer, activityCounts, activityDraftReady, activityLens, activitySlot } from '@/lib/activity-map';

describe('mapa de ikigai en el diagnóstico', () => {
  it('ubica cada campo en su círculo', () => {
    expect(activityLens('formulario-v1:E-PER-000!R220')).toBe('PASION');
    expect(activityLens('formulario-v1:E-PER-000!R227')).toBe('CAPACIDAD');
    expect(activityLens('formulario-v1:E-PER-000!R234')).toBe('NECESIDAD');
    expect(activityLens('formulario-v1:E-PER-000!R241')).toBe('VALOR');
    expect(activityLens('formulario-v1:E-PER-000!R156')).toBeNull();
    expect(activitySlot('formulario-v1:E-PER-000!R228')).toEqual({
      index: 2,
      total: 5,
      name: 'vocación',
      prompt: '¿En qué eres bueno, o puedes llegar a serlo?',
    });
    expect(activitySlot('formulario-v1:E-PER-000!R227')?.index).toBe(1);
  });

  it('lee la respuesta escrita para sumarla al círculo', () => {
    expect(activityAnswer(JSON.stringify({ answer: 'Dar clases' }))).toBe('Dar clases');
    expect(activityAnswer('')).toBe('');
  });

  it('cuenta una actividad solo cuando tiene ámbito, idea y respuesta', () => {
    expect(activityDraftReady(JSON.stringify({ ambit: 'Creación y Expresión', option: 'Enseñar', answer: 'Dar clases' }))).toBe(true);
    expect(activityDraftReady(JSON.stringify({ ambit: 'Creación y Expresión', option: '', answer: 'Dar clases' }))).toBe(false);
    const counts = activityCounts([
      'formulario-v1:E-PER-000!R220',
      'formulario-v1:E-PER-000!R221',
      'formulario-v1:E-PER-000!R227',
    ]);
    expect(counts.PASION).toBe(2);
    expect(counts.CAPACIDAD).toBe(1);
    expect(counts.NECESIDAD).toBe(0);
    expect(counts.VALOR).toBe(0);
  });
});
