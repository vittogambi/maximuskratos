import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WhyTree } from '@/components/admin/lab/why-tree';
import { r04WhyResultFixture, r11WhyResultFixture, insufficientResultFixture } from './fixtures';

function text(markup: string) {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');
}

describe('LAB-021 WhyTree', () => {
  it('shows the R04 Cuerpo calculation chain', () => {
    const markup = renderToStaticMarkup(
      <WhyTree
        result={r04WhyResultFixture()}
        domainKey="CUERPO"
        defaultOpenDimension="CUE.seguridad_y_restricciones"
      />,
    );
    const body = text(markup);
    expect(body).toContain('Cuerpo');
    expect(body).toContain('cuentan por igual');
    expect(body).toContain('39');
    expect(markup).toContain('is-active');
    expect(body).toContain('Contención 0 a 39');
    expect(body).not.toContain('Ninguna alerta modifica este estado');
    expect(body).not.toContain('pasaría a');
    expect(body).not.toContain('puntos queda en');
    expect(body).toContain('Nunca');
    expect(body).toContain('0');
    expect(body).not.toContain('La Matriz la interpretó');
    expect(body).not.toContain('/ 100');
    expect(body).not.toContain('Peso 25%');
    expect(body).not.toContain('domain_formula');
  });

  it('shows the R11 safety override and blocked route', () => {
    const body = text(
      renderToStaticMarkup(<WhyTree result={r11WhyResultFixture()} domainKey="CUERPO" />),
    );
    expect(body).toContain('fuerza Contención');
    expect(body).toContain('Recomendación bloqueada');
    expect(body).not.toContain('D-CUE-05');
    expect(body).not.toContain('R-OVR-01');
  });

  it('lists unanswered questions as rows, not glued to the prompt', () => {
    const result = r04WhyResultFixture();
    const sample = result.lab_reading.item_trace![0];
    result.lab_reading.item_trace = [
      sample,
      {
        ...sample,
        question_id: 'AUD-CUE-02',
        text: 'Después de una dificultad, recupero mi funcionamiento en un plazo razonable.',
        excluded_reason: 'SKIPPED_BY_USER',
        answer_label: null,
        normalized_score: null,
      },
    ];
    const body = text(
      renderToStaticMarkup(
        <WhyTree result={result} domainKey="CUERPO" defaultOpenDimension="CUE.seguridad_y_restricciones" />,
      ),
    );
    expect(body).toContain('No entran al cálculo');
    expect(body).toContain('Sin respuesta');
    expect(body).not.toMatch(/razonable\.\s*No entra en el cálculo/);
  });

  it('does not print the engine coverage reason when there is no priority', () => {
    const body = text(
      renderToStaticMarkup(<WhyTree result={insufficientResultFixture()} domainKey="CUERPO" />),
    );
    expect(body).toContain('La Matriz no eligió un ámbito');
    expect(body).not.toContain('INSUFFICIENT_COVERAGE');
    expect(body).not.toContain('Sin dato porque');
  });
});
