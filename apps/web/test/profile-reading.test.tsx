/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { IndexSummary } from '@/components/journey/IndexSummary';
import { ExcelProfile } from '@/components/profile/ExcelProfile';
import type { AlignmentReading, IndexCard } from '@/lib/journey-api';

const WHEN = '2026-10-16T15:00:00.000Z';

function indexCard(patch: Partial<IndexCard> = {}): IndexCard {
  return {
    name: 'Índice de alineación MK',
    methodVersion: 'ia-mk-cuest@0.1',
    kind: 'INITIAL',
    general: 52.16,
    partial: null,
    pillars: { espiritu: 56.94, mente: 46.76, cuerpo: 52.78 },
    coverage: { eligible: 20, required: 20 },
    pending: [],
    answeredAt: null,
    computedAt: WHEN,
    explanation: 'Índice de alineación MK. Lectura inicial del cuestionario. Método en revisión.',
    delta: null,
    ...patch,
  };
}

const captureForm = {
  auditTotal: 76,
  auditMax: 115,
  auditNote: 'Categoría del formulario: de 69 a 91.',
  relationTotal: 34,
  relationBand: 'ALERTA',
  financeTotal: 40,
  financeBand: 'ALERTA',
  identityTotal: 22,
  identityMax: 40,
  identityNote: 'Total de identidad de 10 a 40. La categoría formal está en definición.',
  senseTotal: 30,
  difficulties: {
    IN: { value: 9, calculable: true },
    PY: { value: 10, calculable: true },
    D: { value: 10, calculable: true },
    ER: { value: 10, calculable: true },
    PR: { value: 8, calculable: true },
    ZZ: { value: 4, calculable: true, descriptor: 'Clave no catalogada.' },
  },
  personalityOverall: 2.9,
  personality: {
    Amabilidad: { descriptor: 'Empatía selectiva, cuida sus límites personales', calculable: true, value: 3 },
    'Sensibilidad emocional': { descriptor: 'Sensibilidad moderada, reacciona según el contexto', calculable: true, value: 3 },
    Extraversión: { descriptor: 'Ambivalente, disfruta lo social con pausas a solas', calculable: true, value: 3 },
    Apertura: { descriptor: 'Equilibrio entre creatividad y sentido práctico', calculable: true, value: 3 },
    Responsabilidad: { descriptor: 'Flexible en ejecución, organizada sin rigidez', calculable: true, value: 3 },
    Otro: { descriptor: 'Rasgo no catalogado.', calculable: true },
  },
};

function text(): string {
  return document.body.textContent ?? '';
}

describe('profile reading', () => {
  afterEach(() => cleanup());

  it('puts the index and pillars before the questionnaire readings', () => {
    render(<ExcelProfile form={captureForm} alignment={null} indexes={{ alignment: indexCard(), depth: null }} />);
    const body = text();
    expect(screen.getByRole('heading', { name: 'Tu lectura' })).toBeTruthy();
    expect(screen.getByText('Una vista de tus respuestas, tus índices y las lecturas de tu cuestionario.')).toBeTruthy();
    expect(screen.getByText('52')).toBeTruthy();
    expect(screen.getByText('de 100')).toBeTruthy();
    expect(screen.getByText('57')).toBeTruthy();
    expect(screen.getByText('47')).toBeTruthy();
    expect(screen.getByText('53')).toBeTruthy();
    expect(screen.getByText(/Cobertura 20 de 20/)).toBeTruthy();
    expect(screen.getByText(/16 oct 2026/)).toBeTruthy();
    expect(screen.getByText('Método en revisión.')).toBeTruthy();
    expect(screen.queryByText(/Índice de alineación MK: 52,16/)).toBeNull();
    expect(body.indexOf('Índice de alineación MK')).toBeLessThan(body.indexOf('Lecturas del cuestionario'));
    expect(body.indexOf('Lecturas del cuestionario')).toBeLessThan(body.indexOf('76 de 115'));
    expect(body.indexOf('76 de 115')).toBeLessThan(body.indexOf('Sombra y recursos'));
    expect(body.indexOf('Sombra y recursos')).toBeLessThan(body.indexOf('Factores de la personalidad'));
    expect(body.indexOf('Factores de la personalidad')).toBeLessThan(body.indexOf('Alineación declarada'));
    expect(screen.queryByRole('heading', { name: 'Índice de profundidad MK' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Ir a mi hoja de ruta' }).getAttribute('href')).toBe('/diagnostico/resultado');
    expect(screen.queryByRole('link', { name: 'Ir a mi hoja de ruta' })?.getAttribute('href')).not.toBe('/proposito');
  });

  it('keeps instrument totals and does not turn them into the index scale', () => {
    render(<ExcelProfile form={captureForm} alignment={null} indexes={{ alignment: indexCard(), depth: null }} />);
    expect(screen.getByText('76 de 115')).toBeTruthy();
    expect(screen.getByText('Categoría del formulario: de 69 a 91.')).toBeTruthy();
    expect(screen.getByText('34 de 60')).toBeTruthy();
    expect(screen.getByText('40 de 60')).toBeTruthy();
    expect(screen.getAllByText('Calibración').length).toBe(2);
    expect(screen.getByText('22 de 40')).toBeTruthy();
    expect(screen.getByText('Total de identidad de 10 a 40. La categoría formal está en definición.')).toBeTruthy();
    expect(screen.getByText('30 de 50')).toBeTruthy();
    expect(screen.getByText('Lectura aparte de la auditoría')).toBeTruthy();
    expect(screen.queryByText('76%')).toBeNull();
  });

  it('orders difficulty groups and personality factors with band labels', () => {
    render(<ExcelProfile form={{ ...captureForm, personalityOverall: null }} alignment={null} />);
    const body = text();
    const spots = [
      'Patrones repetitivos',
      'Emociones rechazadas',
      'Proyección',
      'Excusas y autoengaño',
      'Capacidades que reconoces',
    ].map((label) => body.indexOf(label));
    expect(spots.every((spot) => spot >= 0)).toBe(true);
    expect(spots).toEqual([...spots].sort((left, right) => left - right));
    expect(body.indexOf('8 de 18')).toBeGreaterThan(body.indexOf('Patrones repetitivos'));
    expect(body.indexOf('ZZ')).toBeGreaterThan(body.indexOf('Capacidades que reconoces'));
    expect(screen.getByText('Clave no catalogada.')).toBeTruthy();
    expect(screen.getByText(/Cuatro familias de sombra/)).toBeTruthy();
    expect(screen.getByText(/Límites, talento y manejo del error/)).toBeTruthy();
    expect(body.indexOf('A. Apertura')).toBeGreaterThan(0);
    expect(screen.getByText('Equilibrio entre creatividad y sentido práctico')).toBeTruthy();
    expect(screen.getByText('Sensibilidad moderada, reacciona según el contexto')).toBeTruthy();
    expect(screen.getByText('Rasgo no catalogado.')).toBeTruthy();
    expect(screen.queryByText(/promedio/i)).toBeNull();
  });

  it('shows a null general, a valid zero and a null pillar from the same card', () => {
    render(
      <ExcelProfile
        form={{}}
        alignment={null}
        indexes={{
          alignment: indexCard({
            general: null,
            partial: 10,
            pillars: { espiritu: 0, mente: null, cuerpo: 12 },
            coverage: { eligible: 8, required: 20 },
          }),
          depth: null,
          initial: indexCard({ general: 99.99, pillars: { espiritu: 1, mente: 1, cuerpo: 1 } }),
        }}
      />,
    );
    expect(screen.getByText('Sin total')).toBeTruthy();
    expect(screen.queryByText('de 100')).toBeNull();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getAllByText('No disponible').length).toBeGreaterThan(0);
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText(/Cobertura 8 de 20/)).toBeTruthy();
    expect(screen.queryByText('99,99')).toBeNull();
    expect(screen.queryByText('10')).toBeNull();
  });

  it('keeps a zero total and a partial audit apart from a published sum', () => {
    render(
      <ExcelProfile
        form={{
          auditTotal: 0,
          auditMax: 115,
          auditNote: 'Categoría del formulario: por debajo de 46.',
          relationTotal: 0,
          relationBand: 'DETRIMENTO',
          financeTotal: null,
          identityTotal: 0,
          identityMax: 40,
          senseTotal: 0,
          difficulties: { D: { value: 0, calculable: true }, PR: { calculable: false, value: null } },
        }}
        alignment={null}
      />,
    );
    expect(screen.getByText('0 de 115')).toBeTruthy();
    expect(screen.getByText('0 de 60')).toBeTruthy();
    expect(screen.getByText('Detrimento')).toBeTruthy();
    expect(screen.getByText('0 de 40')).toBeTruthy();
    expect(screen.getByText('0 de 50')).toBeTruthy();
    expect(screen.getByText(/0 de 18\./)).toBeTruthy();
    expect(screen.getAllByText('Pendiente').length).toBeGreaterThan(0);
    expect(screen.getAllByText('No disponible').length).toBeGreaterThan(0);
  });

  it('shows audit coverage when the total is not published', () => {
    render(
      <ExcelProfile
        form={{ auditTotal: null, auditCoverage: { answered: 10, required: 23 }, auditNote: 'Suma parcial. Sin categoría.' }}
        alignment={null}
      />,
    );
    expect(screen.getByText('Pendiente. 10 de 23')).toBeTruthy();
    expect(screen.getByText('Suma parcial. Sin categoría.')).toBeTruthy();
    expect(screen.queryByText(/\d+ de 115/)).toBeNull();
  });

  it('keeps the partner gate out of a total of 60', () => {
    render(
      <ExcelProfile
        form={{
          relationTotal: null,
          relationBand: null,
          relationBandPending: false,
          relationNote: 'Sin pareja. El círculo íntimo queda fuera. El total de 60 no se calcula.',
        }}
        alignment={null}
      />,
    );
    expect(screen.getByText('No se calcula')).toBeTruthy();
    expect(screen.getByText('Sin pareja. El círculo íntimo queda fuera. El total de 60 no se calcula.')).toBeTruthy();
    expect(screen.queryByText(/\d+ de 60/)).toBeNull();
  });

  it('separates a missing index, a failed index read, and the declared ficha states', () => {
    const missing = render(<ExcelProfile form={{}} alignment={null} />);
    expect(screen.getByText('No hay una lectura guardada.')).toBeTruthy();
    expect(screen.getByText('Pendiente')).toBeTruthy();
    expect(screen.queryByText('No se pudo leer el índice.')).toBeNull();
    missing.unmount();

    const failedIndex = render(<ExcelProfile form={{}} alignment={null} indexesError />);
    expect(screen.getByRole('alert').textContent).toBe('No se pudo leer el índice.');
    expect(screen.queryByText('No hay una lectura guardada.')).toBeNull();
    expect(screen.queryByText('Sin total')).toBeNull();
    failedIndex.unmount();

    const failedFicha = render(<ExcelProfile form={{}} alignment={null} alignmentError />);
    expect(screen.getByRole('alert').textContent).toBe('No se pudo leer la ficha.');
    expect(screen.queryByText('Pendiente')).toBeNull();
    failedFicha.unmount();

    const partial: AlignmentReading = {
      status: 'partial',
      total: null,
      pillars: { E: 80, M: null, C: 0 },
      savedAt: null,
      methodVersion: 'iad-mk-0.1-borrador',
      coverage: { answered: 4, required: 9 },
      revision: 3,
      directionStatus: null,
    };
    const partialView = render(<ExcelProfile form={{}} alignment={partial} />);
    expect(screen.getByText('Sin total')).toBeTruthy();
    expect(screen.getByText(/Cobertura 4 de 9/)).toBeTruthy();
    expect(screen.getByText('80')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText(/Revisión 3/)).toBeTruthy();
    partialView.unmount();

    const saved: AlignmentReading = {
      status: 'saved',
      total: 40,
      pillars: { E: 40, M: 40, C: 40 },
      savedAt: WHEN,
      methodVersion: 'iad-mk-0.1-borrador',
      coverage: { answered: 9, required: 9 },
      revision: 4,
      directionStatus: null,
    };
    render(<ExcelProfile form={{}} alignment={saved} />);
    expect(screen.getAllByText('40').length).toBeGreaterThan(0);
    expect(screen.getByText(/16 oct 2026/)).toBeTruthy();
    expect(screen.getByText(/Revisión 4/)).toBeTruthy();
  });

  it('shows depth only when that card exists', () => {
    const { unmount } = render(<ExcelProfile form={{}} alignment={null} indexes={{ alignment: indexCard(), depth: null }} />);
    expect(screen.queryByRole('heading', { name: 'Índice de profundidad MK' })).toBeNull();
    unmount();

    render(
      <ExcelProfile
        form={{}}
        alignment={null}
        indexes={{
          alignment: indexCard(),
          depth: indexCard({
            name: 'Índice de profundidad MK',
            methodVersion: 'profundidad-mk@0.1',
            kind: 'DOCUMENTED',
            general: null,
            partial: 25,
            pillars: null,
            coverage: { scored: 4, required: 9 },
            explanation: 'Índice de profundidad MK. Mide trabajo documentado de la hoja, no profundidad psicológica. Método en revisión.',
          }),
        }}
      />,
    );
    const body = text();
    expect(screen.getByRole('heading', { name: 'Índice de profundidad MK' })).toBeTruthy();
    expect(screen.getByText('Parcial 25. No sustituye al total.')).toBeTruthy();
    expect(screen.getByText(/Cobertura 4 de 9/)).toBeTruthy();
    expect(screen.getByText(/trabajo documentado de la hoja/)).toBeTruthy();
    expect(body.indexOf('Índice de profundidad MK')).toBeLessThan(body.indexOf('Alineación declarada'));
    expect(screen.queryByText('0 de 100')).toBeNull();
  });

  it('does not show the declared ficha as pending after the sheet is signed', () => {
    render(<ExcelProfile form={{}} alignment={null} sheetSigned />);
    expect(screen.getByText('La hoja de ruta está firmada.')).toBeTruthy();
    expect(screen.queryByText('Pendiente')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Alineación declarada' })).toBeNull();
    expect(screen.queryByText(/Puedes continuar sin completarla/)).toBeNull();
    expect(screen.getByRole('link', { name: 'Ir a mi hoja de ruta' }).getAttribute('href')).toBe('/diagnostico/resultado');
  });

  it('leaves the default index summary as a paragraph', () => {
    render(<IndexSummary alignment={indexCard({ delta: 1.25 })} depth={null} />);
    expect(screen.getByRole('heading', { name: 'Índices' })).toBeTruthy();
    expect(screen.getByText(/Índice de alineación MK: 52/)).toBeTruthy();
    expect(screen.getByText(/Diferencia con la lectura inicial comparable: 1\./)).toBeTruthy();
  });
});
