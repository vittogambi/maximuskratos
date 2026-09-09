import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PairCompare } from '@/components/admin/lab/pair-compare';
import type { LabPairCompare } from '@/lib/lab-api';

function text(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');
}

const r07: LabPairCompare = {
  available: true,
  pair: 'R07',
  implied_rule: 'El cruce de umbral cambia el estado',
  changed_questions: [
    {
      questionId: 'D-MEN-13',
      text: 'Pregunta de borde',
      a: 2,
      b: 3,
      a_label: 'A veces',
      b_label: 'A menudo',
      a_score: 25,
      b_score: 50,
      aStatus: 'ANSWERED',
      bStatus: 'ANSWERED',
    },
  ],
  dimensions: {
    'MEN.claridad': { a: 37, b: 42, label: 'Claridad' },
  },
  domains: {
    MENTALIDAD: { a_score: 39, b_score: 40, a_state: 'CONTENCIÓN', b_state: 'ESTABILIZACIÓN' },
  },
  priority: { a: 'MENTALIDAD', b: 'MENTALIDAD' },
  plans: { a: 'MEN-CON', b: 'MEN-EST', a_name: 'Contención mental', b_name: 'Estabilización mental' },
};

const r13: LabPairCompare = {
  available: true,
  pair: 'R13',
  implied_rule: 'El headline de dominio puede coincidir con distinta composición dimensional',
  changed_questions: Array.from({ length: 24 }, (_, index) => ({
    questionId: `D-MEN-${String(index + 1).padStart(2, '0')}`,
    text: `Pregunta ${index + 1}`,
    a: 2,
    b: 4,
    a_label: 'Poco',
    b_label: 'Bastante',
    a_score: 25,
    b_score: 75,
    aStatus: 'ANSWERED',
    bStatus: 'ANSWERED',
  })),
  dimensions: {
    'MEN.a': { a: 20, b: 40, label: 'Dimensión A' },
    'MEN.b': { a: 30, b: 50, label: 'Dimensión B' },
    'MEN.c': { a: 40, b: 60, label: 'Dimensión C' },
    'MEN.d': { a: 50, b: 70, label: 'Dimensión D' },
  },
  domains: {},
  priority: { a: 'MENTALIDAD', b: 'MENTALIDAD' },
  plans: { a: 'MEN-EST', b: 'MEN-EST', a_name: 'Estabilización mental', b_name: 'Estabilización mental' },
};

describe('LAB-024 pair compare render', () => {
  it('shows labels, one dimension, the 39/40 band change, and stable priority', () => {
    const body = text(renderToStaticMarkup(<PairCompare pair={r07} />));
    expect(body).toContain('Qué cambia entre A y B');
    expect(body).toContain('Los casos difieren en una respuesta.');
    expect(body).toContain('El cruce de umbral cambia el estado');
    expect(body).toContain('A: A veces');
    expect(body).toContain('B: A menudo');
    expect(body).toContain('Claridad');
    expect(body).toContain('39');
    expect(body).toContain('Contención');
    expect(body).toContain('40');
    expect(body).toContain('Estabilización');
    expect(body).toContain('Ámbito prioritario');
    expect(body).toContain('Mentalidad en ambos');
    expect(body).toContain('Contención mental');
    expect(body).toContain('Estabilización mental');
    expect(body).toContain('Pregunta de borde');
    expect(body).not.toContain('Respuesta A');
    expect(body).not.toContain('D-MEN-13');
    expect(body).not.toContain('SIGNAL_AVAILABLE');
  });

  it('collapses many questions and keeps domain priority and route', () => {
    const body = text(renderToStaticMarkup(<PairCompare pair={r13} />));
    expect(body).toContain('Pregunta 24');
    expect(body).toContain('Los casos difieren en 24 respuestas.');
    expect(body).toContain('Ver respuestas comparadas');
    expect(body).toContain('El headline de dominio puede coincidir con distinta composición dimensional');
    expect(body).toContain('Dimensión A');
    expect(body).toContain('Dimensión D');
    expect(body).toContain('Ámbito prioritario');
    expect(body).toContain('Mentalidad en ambos');
    expect(body).toContain('Estabilización mental');
    expect(body).not.toContain('SIGNAL_AVAILABLE');
  });

  it('reuses the same view for Original / Simulación', () => {
    const body = text(
      renderToStaticMarkup(
        <PairCompare pair={r07} title="Qué cambia entre Original y Simulación" aColumn="Original" bColumn="Simulación" />,
      ),
    );
    expect(body).toContain('Original: A veces');
    expect(body).toContain('Simulación: A menudo');
  });

  it('summarizes an equal diagnosis without exposing signal codes', () => {
    const body = text(
      renderToStaticMarkup(
        <PairCompare
          pair={{
            ...r13,
            diagnostic_equal: true,
            changed_questions: r13.changed_questions?.slice(0, 15),
            direction: {
              signal_a: 'SIGNAL_AVAILABLE',
              signal_b: 'SIGNAL_AVAILABLE',
              fingerprint_equal: false,
              methodology_version: '0.1',
            },
            portraits: {
              a: 'Quiere construir algo propio.',
              b: 'Prioriza familia y estabilidad.',
            },
          }}
        />,
      ),
    );
    expect(body).toContain('Caso A');
    expect(body).toContain('Quiere construir algo propio.');
    expect(body).toContain('Caso B');
    expect(body).toContain('Los casos difieren en 15 respuestas sobre hacia dónde quiere ir.');
    expect(body).toContain('Igual en ambos casos');
    expect(body).toContain('La diferencia se conservó sin modificar el diagnóstico.');
    expect(body).not.toContain('SIGNAL_AVAILABLE');
  });
});
