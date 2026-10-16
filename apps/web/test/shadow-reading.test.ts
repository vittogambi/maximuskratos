import { describe, expect, it } from 'vitest';
import { SHADOW_FAMILIES, shadowClosedReading, shadowOverall, shadowPoints, shadowSectionReading } from '@/lib/shadow-reading';

const A1 = ['formulario-v1:E-PER-000!R94', 'formulario-v1:E-PER-000!R95', 'formulario-v1:E-PER-000!R96'];
const A = [
  ...A1,
  'formulario-v1:E-PER-000!R98', 'formulario-v1:E-PER-000!R99', 'formulario-v1:E-PER-000!R100',
  'formulario-v1:E-PER-000!R102', 'formulario-v1:E-PER-000!R103', 'formulario-v1:E-PER-000!R104',
];

function fill(refs: string[], value: number): Record<string, number> {
  return Object.fromEntries(refs.map((ref) => [ref, value]));
}

describe('lectura de sombra E-PER-000', () => {
  it('traduce Sí, Más o menos y No', () => {
    expect(shadowPoints('2')).toBe(2);
    expect(shadowPoints('Más o menos')).toBe(1);
    expect(shadowPoints('No')).toBe(0);
    expect(shadowPoints('')).toBeNull();
  });

  it('deja sin desarrollo mientras el ámbito no tiene respuestas', () => {
    const rows = shadowSectionReading(A1[0], {});
    expect(rows.map((row) => row.detail)).toEqual([
      'sin desarrollo',
      'sin desarrollo',
      'sin desarrollo',
      'sin desarrollo',
    ]);
    expect(rows[0]?.label).toContain('Patrones repetitivos');
  });

  it('usa los cortes del ámbito y de la familia A', () => {
    const latent = shadowSectionReading(A1[0], fill(A1, 2));
    expect(latent[1]?.detail).toContain('Dominante');
    const absent = shadowSectionReading(A1[0], { [A1[0]]: 1 });
    expect(absent[1]?.detail).toBe('Ausente: vínculos saludables.');
    expect(absent[0]?.detail).toContain('Ausente');

    const family = shadowSectionReading(A[0], fill(A, 2));
    expect(family[0]?.detail).toContain('Dominante');
    const mid = shadowSectionReading(A[0], fill(A, 1));
    expect(mid[0]?.detail).toContain('Sombra latente');
  });

  it('cubre las 45 respuestas y los cortes de B y E', () => {
    const refs = SHADOW_FAMILIES.flatMap((family) => family.ambits.flatMap((ambit) => ambit.refs));
    expect(refs).toHaveLength(45);
    const emotions = shadowSectionReading('formulario-v1:E-PER-000!R107', {
      'formulario-v1:E-PER-000!R107': 2,
    });
    expect(emotions[0]?.detail).toContain('Sin sombra aparente');
    expect(emotions[1]?.detail).toContain('Latente');
    const integration = shadowSectionReading('formulario-v1:E-PER-000!R146', fill([
      'formulario-v1:E-PER-000!R146', 'formulario-v1:E-PER-000!R147', 'formulario-v1:E-PER-000!R148',
      'formulario-v1:E-PER-000!R150', 'formulario-v1:E-PER-000!R151', 'formulario-v1:E-PER-000!R152',
      'formulario-v1:E-PER-000!R154', 'formulario-v1:E-PER-000!R155', 'formulario-v1:E-PER-000!R156',
    ], 2));
    expect(integration[0]?.detail).toContain('alto');
  });

  it('no muestra el resultado mientras la familia sigue abierta', () => {
    expect(shadowClosedReading('formulario-v1:E-PER-000!R107', { 'formulario-v1:E-PER-000!R107': 2 })).toEqual([]);
    const closed = shadowClosedReading('formulario-v1:E-PER-000!R117', {
      'formulario-v1:E-PER-000!R107': 2,
      'formulario-v1:E-PER-000!R117': 0,
    });
    expect(closed[0]?.label).toContain('Emociones rechazadas');
    expect(closed.some((row) => row.label === 'Diagnóstico sombra')).toBe(false);
  });

  it('cierra con el diagnóstico de la hoja en la última pregunta', () => {
    const empty = shadowSectionReading('formulario-v1:E-PER-000!R156', {});
    expect(empty.at(-1)).toEqual({ label: 'Diagnóstico sombra', detail: 'Sin desarrollo' });
    expect(shadowOverall(6, 6)).toContain('Perfil libre');
    expect(shadowOverall(13, 14)).toContain('Integración avanzada');
    expect(shadowOverall(36, 6)).toContain('Alerta de autosabotaje');
    expect(shadowOverall(36, 7)).toContain('Bloqueo moderado');
    expect(shadowOverall(0, 0)).toBe('Sin desarrollo');
  });
});
