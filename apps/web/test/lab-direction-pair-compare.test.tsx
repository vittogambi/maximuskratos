import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DirectionPairCompare } from '@/components/admin/lab/direction-pair-compare';
import type { LabPairCompare } from '@/lib/lab-api';
import { bothFamilyCasesReviewed, directionPairVisible, isDirectionCompareFamily } from '@/lib/lab-ui/direction-compare';

function text(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');
}

const benjamin: LabPairCompare = {
  available: true,
  pair: 'R15',
  diagnostic_equal: true,
  changed_questions: [
    {
      questionId: 'DIR-01',
      text: 'Qué quiere construir',
      a: 'negocio propio',
      b: 'estabilidad familiar',
      a_label: 'Algo propio',
      b_label: 'Familia y estabilidad',
      aStatus: 'ANSWERED',
      bStatus: 'ANSWERED',
    },
  ],
  dimensions: {},
  domains: {},
  priority: { a: 'MENTALIDAD', b: 'MENTALIDAD' },
  plans: { a: 'MEN-EST', b: 'MEN-EST', a_name: 'Estabilización mental', b_name: 'Estabilización mental' },
  alerts: { a: 'ninguna', b: 'ninguna' },
  direction: {
    signal_a: 'SIGNAL_AVAILABLE',
    signal_b: 'SIGNAL_AVAILABLE',
    fingerprint_equal: false,
    methodology_version: '0.1',
  },
  portraits: {
    a: 'Benjamín habla de construir algo propio, estar más presente en casa y mejorar su situación financiera.',
    b: 'Benjamín pone más énfasis en su familia, la estabilidad y tener mayor disponibilidad en su día a día.',
  },
};

describe('direction pair compare', () => {
  it('waits for both versions to be reviewed, not only revealed', () => {
    expect(directionPairVisible(false, true)).toBe(false);
    expect(directionPairVisible(true, false)).toBe(false);
    expect(directionPairVisible(true, true)).toBe(true);
    expect(isDirectionCompareFamily({ id: 'purpose_silent', review_surface: 'frontier' })).toBe(true);
    expect(isDirectionCompareFamily({ id: 'edge_39_40', review_surface: 'matrix' })).toBe(false);
    const family = { id: 'purpose_silent', keys: ['R15A', 'R15B'] };
    expect(
      bothFamilyCasesReviewed(
        [
          { casebook_key: 'R15A', family_reviews: { purpose_silent: { case_done: true } } },
          { casebook_key: 'R15B', family_reviews: { purpose_silent: { case_done: false } } },
        ],
        family,
      ),
    ).toBe(false);
    expect(
      bothFamilyCasesReviewed(
        [
          { casebook_key: 'R15A', family_reviews: { purpose_silent: { case_done: true } } },
          { casebook_key: 'R15B', family_reviews: { purpose_silent: { case_done: true } } },
        ],
        family,
      ),
    ).toBe(true);
  });

  it('leads with what Benjamín expresses and keeps diagnosis in the background', () => {
    const body = text(
      renderToStaticMarkup(
        <DirectionPairCompare
          pair={benjamin}
          question="¿Te parece correcto que estas diferencias sobre hacia dónde quiere ir Benjamín se conserven sin modificar su diagnóstico?"
        />,
      ),
    );
    expect(body).toContain('Comparar las dos versiones de Benjamín');
    expect(body).toContain('mismas respuestas diagnósticas');
    expect(body).toContain('En la primera versión');
    expect(body).toContain('construir algo propio');
    expect(body).toContain('En la segunda versión');
    expect(body).toContain('más énfasis en su familia');
    expect(body).toContain('Ver respuestas de Dirección que cambiaron');
    expect(body).toContain('Primera versión: Algo propio');
    expect(body).toContain('Segunda versión: Familia y estabilidad');
    expect(body).toContain('Diagnóstico de la Matriz');
    expect(body).toContain('Se mantiene igual en las dos versiones.');
    expect(body).toContain('Ámbito prioritario');
    expect(body).toContain('Mentalidad');
    expect(body).toContain('Estado por ámbito: sin cambios');
    expect(body).toContain('Alertas: sin cambios');
    expect(body).toContain('Ruta: sin cambios');
    expect(body).toContain('Ver detalle del diagnóstico');
    expect(body).toContain('Lo que necesitamos revisar');
    expect(body).not.toContain('Caso A');
    expect(body).not.toContain('Caso B');
    expect(body).not.toContain('Igual en ambos casos');
    expect(body).not.toContain('Comparar los dos casos');
    expect(body).not.toContain('Ámbito privilegiario');
    expect(body).not.toContain('SIGNAL_AVAILABLE');
    expect(body).not.toContain('DIR-01');
  });
});
