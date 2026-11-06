import { describe, expect, it } from 'vitest';
import type { LedgerEntry } from '../src/instrumentos/answer-ledger';
import type { Pack } from '../src/journey/intervention/engine';
import { buildReadings, readSources } from '../src/journey/intervention/engine';
import { PACK as FINANZAS } from '../src/journey/intervention/finanzas';
import { PACK as RELACIONES } from '../src/journey/intervention/relaciones';
import { PACK as SALUD } from '../src/journey/intervention/salud';
import { packByTerritory, templateById } from '../src/journey/intervention/registry';

function entry(sourceRef: string, value: string): LedgerEntry {
  return {
    sourceRef,
    value,
    revision: 1,
    answeredAt: new Date('2026-10-01T12:00:00Z'),
    sessionId: 's1',
    catalogVersion: 'formulario-completo@6',
    exceptionKind: null,
  };
}

function low(pack: Pack, key: string) {
  const spec = pack.scales[key];
  return entry(`formulario-v1:${spec.instrument}!R${spec.row}`, '2');
}

describe('intervención de los otros ámbitos', () => {
  it('cada plantilla es general, tiene resultado y no se pisa con otra', () => {
    const ids = [FINANZAS, RELACIONES, SALUD].flatMap((pack) => pack.templates.map((row) => row.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const pack of [FINANZAS, RELACIONES, SALUD]) {
      expect(pack.templates.length).toBeGreaterThan(0);
      for (const template of pack.templates) {
        expect(template.indicators.some((row) => row.role === 'RESULT')).toBe(true);
        expect(template.notes.join(' ')).not.toMatch(/invertir en|pauta de entrenamiento|dieta de|termina la relación/i);
      }
    }
    expect(templateById('FIN-A1')?.id).toBe('FIN-A1');
    expect(templateById('MEN-A1')?.id).toBe('MEN-A1');
    expect(packByTerritory('finanzas')?.territory).toBe('FINANZAS');
    expect(packByTerritory('salud_fisica')?.version).toBe('intervencion-salud@0.1');
  });

  it('una escala baja abre la lectura y un 5 no', () => {
    const fin = buildReadings(FINANZAS, readSources(FINANZAS, [low(FINANZAS, 'deuda-control')]), []);
    expect(fin.map((row) => row.id)).toEqual(['deudas']);
    expect(fin[0]?.declared[0]).toContain('marcaste 2 de 5');
    expect(buildReadings(FINANZAS, readSources(FINANZAS, [entry('formulario-v1:F-RAD-003!R35', '5')]), [])).toEqual([]);

    const rel = buildReadings(RELACIONES, readSources(RELACIONES, [low(RELACIONES, 'pareja-solidez')]), []);
    expect(rel.map((row) => row.id)).toEqual(['pareja']);
    expect(rel[0]?.interpretation).not.toMatch(/tóxic/i);

    const salud = buildReadings(SALUD, readSources(SALUD, [low(SALUD, 'entrenamiento')]), []);
    expect(salud.map((row) => row.id)).toEqual(['entrenamiento']);
  });

  it('la indicación médica de salud sugiere la mínima y no crea una lectura clínica', () => {
    const read = readSources(SALUD, [entry('formulario-v1:F-RAD-001!R27', 'Sí')]);
    expect(buildReadings(SALUD, read, [])).toEqual([]);
    expect(SALUD.modifiers(read).suggestMinimum?.because).toMatch(/indicación/);
    expect(SALUD.modifiers(readSources(SALUD, [entry('formulario-v1:F-RAD-001!R27', 'No')])).suggestMinimum).toBeNull();
  });

  it('finanzas no convierte la inversión en un plan', () => {
    const text = FINANZAS.templates.map((row) => `${row.title} ${row.action} ${row.seeks}`).join(' ');
    expect(text).not.toMatch(/acciones|bienes raíces|fondo de inversión/i);
    expect(FINANZAS.readings.some((row) => row.scales.includes('flujo-cubre'))).toBe(true);
  });
});
