import { describe, expect, it } from 'vitest';
import { buildHdrpContract, hdrpGaps } from '../src/journey/hdrp-contract';

describe('buildHdrpContract', () => {
  it('builds the v2 contract from answers and leaves gaps visible', () => {
    const contract = buildHdrpContract({
      name: 'Mateo',
      heritage: 'Quiero romper el silencio familiar.',
      values: ['Lealtad', 'Orden'],
      standards: [{ label: 'Trabajo', text: 'Cuatro bloques a la semana.' }],
      vision: 'Un hombre que cumple lo que dice.',
      lenses: { vivo: 'enseñar', bueno: 'ordenar', necesita: 'la gente perdida', pagan: 'la consultoría' },
      ocean: [3, 4, 3, 2, 4, 2, 2, 4, 3, 4, 3, 4, 4, 2, 3],
      relation: [5, 5, 5, 2, 2, 2, 3, 3, 3, 4, 4, 4],
      finance: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    });
    const text = [contract.lead, contract.closing, ...contract.articles.flatMap((article) => article.items.map((row) => `${row.label} ${row.text}`))].join('\n');
    expect(text).toContain('Yo, Mateo');
    expect(text).toContain('Lealtad');
    expect(text).toContain('Orden');
    expect(text).toContain('Mi propósito es poner mi enseñar y mi talento en ordenar');
    expect(text).not.toMatch(/\d+ de 15/);
    expect(text).not.toContain('pendiente de nombre');
    expect(text).toContain('Relaciones saludables y liberadas');
    expect(text).toContain('6 horas al mes');
    expect(text).toContain('3 horas al mes');
    expect(text).toContain('Plan financiero integrado. Calibración.');
    expect(text).toContain('0% a 5%');
    expect(text).not.toContain('asesor financiero');
    expect(text).not.toContain('—');
    expect(text).not.toMatch(/\d+-\d+/);
    expect(text).toContain('Como testimonio de aceptación de mi propio diseño y como orden directa hacia mi voluntad, firmo este manifiesto en pleno uso de mi soberanía personal.');
    expect(text).toContain('Equilibrio entre creatividad y sentido práctico');
    expect(text).toContain('requiere estructura externa');
    expect(text).toContain('declaro solemnemente los pilares');
    expect(text).toContain('Apertura');
  });

  it('uses the reestructuración branch when cash flow or debt is in that band', () => {
    const contract = buildHdrpContract({
      finance: [1, 1, 1, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    });
    const text = contract.articles.find((article) => article.title === 'V. Las finanzas')?.items.map((row) => row.text).join(' ');
    expect(text).toContain('Plan financiero integrado. Reestructuración.');
    expect(text).toContain('90%');
    expect(text).toContain('asesor financiero');
    expect(text).not.toContain('55%');
    const relation = contract.articles.find((article) => article.title === 'IV. Las relaciones')?.items.map((row) => row.text).join(' ');
    expect(relation).toContain('faltan las tres respuestas');
    expect(relation).not.toContain('horas');
  });

  it('uses the fluido plan only when the four finance blocks are fluido', () => {
    const contract = buildHdrpContract({
      finance: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    });
    const text = contract.articles.find((article) => article.title === 'V. Las finanzas')?.items.map((row) => row.text).join(' ');
    expect(text).toContain('Plan financiero integrado. Fluido.');
    expect(text).toContain('15% a 20%');
    expect(text).toContain('cartera diversificada');
  });

  it('lists the sheet pieces that are still empty', () => {
    const gaps = hdrpGaps({ finance: [5, 5, 5, null, null, null, 5, 5, 5, 5, 5, 5] });
    expect(gaps.map((gap) => gap.id)).toContain('finanza-1');
    expect(gaps.map((gap) => gap.moduleSlug)).toContain('f-rad-003-s2');
    expect(gaps.map((gap) => gap.id)).toContain('proposito');
    const filled = hdrpGaps({
      heritage: 'Una historia',
      values: ['Lealtad'],
      standards: [{ label: 'Trabajo', text: 'Cuatro bloques.' }],
      identity: 'Una frase',
      pattern: 'Un patrón',
      vision: 'Una visión',
      seal: 'Una huella',
      lenses: { vivo: 'enseñar', bueno: 'ordenar', necesita: 'alguien', pagan: 'un oficio' },
      ocean: [3, 4, 3, 2, 4, 2, 2, 4, 3, 4, 3, 4, 4, 2, 3],
      relation: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      finance: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    });
    expect(filled).toEqual([]);
  });

  it('does not treat a skipped couple block as a missing answer', () => {
    const contract = buildHdrpContract({
      partner: 'never',
      relation: [null, null, null, 5, 5, 5, 4, 4, 4, 3, 3, 3],
    });
    const text = contract.articles.find((article) => article.title === 'IV. Las relaciones')?.items[0]?.text;
    expect(text).toBe('Sin pareja. Esta parte no se responde.');
    expect(hdrpGaps({ partner: 'never', relation: [null, null, null, 5, 5, 5, 4, 4, 4, 3, 3, 3] }).some((gap) => gap.id === 'relacion-0')).toBe(false);
  });
});
