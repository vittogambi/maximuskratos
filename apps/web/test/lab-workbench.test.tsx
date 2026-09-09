import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DomainChip, SafetyChip } from '@/components/admin/lab/domain-chip';
import { LAB_DOMAIN_TOKENS, domainToken } from '@/lib/lab-ui/domain';
import {
  CASE_VERDICT_OPTIONS,
  DEFINITION_STATUS,
  PROBLEM_OPTIONS,
  PURPOSE_STAGES,
  labUiLabels,
} from '@/lib/lab-ui/labels';
import { parseFacilitatorBrief } from '@/lib/lab-ui/facilitator';
import { STEP_LABELS } from '@/lib/lab-ui/status';

describe('DOMAIN-01 to DOMAIN-06 tokens', () => {
  it('DOMAIN-01 Mentalidad token/icon', () => {
    expect(domainToken('MENTALIDAD')?.icon).toBe('scan-eye');
    expect(LAB_DOMAIN_TOKENS.MENTALIDAD.css).toBe('mind');
  });
  it('DOMAIN-02 Relaciones', () => {
    expect(domainToken('RELACIONES')?.icon).toBe('handshake');
  });
  it('DOMAIN-03 Finanzas', () => {
    expect(domainToken('FINANZAS')?.icon).toBe('wallet');
  });
  it('DOMAIN-04 Cuerpo', () => {
    expect(domainToken('CUERPO')?.icon).toBe('heart-pulse');
  });
  it('DOMAIN-05 Propósito', () => {
    expect(domainToken('PROPÓSITO')?.icon).toBe('compass');
  });
  it('DOMAIN-06 Safety visually distinct', () => {
    expect(domainToken('SAFETY')?.icon).toBe('shield-alert');
    expect(domainToken('SAFETY')?.css).toBe('safety');
    expect(domainToken('SAFETY')?.css).not.toBe(domainToken('CUERPO')?.css);
  });
  it('DOMAIN-07 colors do not encode status alone', () => {
    const markup =
      renderToStaticMarkup(<DomainChip domain="MENTALIDAD" />) + renderToStaticMarkup(<SafetyChip />);
    expect(markup).toContain('Mentalidad');
    expect(markup).toContain('Seguridad');
    expect(markup).not.toContain('PASS');
    expect(markup).not.toContain('FAIL');
  });
});

describe('PUR-UX labels', () => {
  it('PUR-UX-03 insufficient information is available', () => {
    expect(PROBLEM_OPTIONS.some((item) => item.label === 'No tengo suficiente información')).toBe(true);
  });
  it('PUR-UX-06 no Purpose score label in stages', () => {
    for (const stage of PURPOSE_STAGES) {
      expect(stage.label.toLowerCase()).not.toContain('score');
      expect(stage.label.toLowerCase()).not.toContain('puntaje');
    }
  });
});

describe('visual labels', () => {
  it('uses Tu criterio and Matriz wording', () => {
    expect(labUiLabels.source('RAFA_JUDGMENT')).toBe('Tu decisión');
    expect(CASE_VERDICT_OPTIONS[0].label).toBe('Sí, está bien');
    expect(STEP_LABELS.prediction).toBe('Tu lectura');
    expect(STEP_LABELS.change).toBe('Cambio en evaluación');
    expect(DEFINITION_STATUS.CANDIDATE).toBe('En evaluación');
    expect(labUiLabels.contract('PASS')).toBe('Correcto');
    expect(STEP_LABELS.responses).toBe('Respuestas');
    expect(STEP_LABELS.review).toBe('Revisión');
    expect(STEP_LABELS.verdict).toBe('Cierre');
  });
});

describe('facilitator brief', () => {
  it('parses the four Rafa blocks', () => {
    const blocks = parseFacilitatorBrief(
      [
        '## Lo que estamos poniendo a prueba',
        'Empate.',
        '',
        '## Lo que hace la Matriz actual',
        'Pone Mentalidad primero.',
        '',
        '## La decisión que queremos revisar',
        '¿Sirve el orden fijo?',
        '',
        '## Por qué importa',
        'Se repetirá.',
      ].join('\n'),
    );
    expect(blocks).toHaveLength(4);
    expect(blocks?.[0].body).toBe('Empate.');
    expect(parseFacilitatorBrief('texto suelto')).toBeNull();
  });
});
