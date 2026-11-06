/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DiagnosticCross, type CrossActivity } from '@/components/diagnostico/DiagnosticCross';

const activities: CrossActivity[] = [
  { sourceRef: 'formulario-v1:E-PER-000!R220', field: 'pasion', ambit: 'Casa', option: 'Cocinar', answer: 'Cocinar con los hijos' },
  { sourceRef: 'formulario-v1:E-PER-000!R227', field: 'vocacion', ambit: 'Oficio', option: 'Enseñar', answer: 'Explicar con calma' },
  { sourceRef: 'formulario-v1:E-PER-000!R234', field: 'mision', ambit: 'Otros', option: 'Acompañar', answer: 'Acompañar a quien empieza' },
  { sourceRef: 'formulario-v1:E-PER-000!R241', field: 'profesion', ambit: 'Oficio', option: 'Cobrar', answer: 'Cobrar por una clase' },
];

afterEach(() => cleanup());

describe('cruce IKIGAI', () => {
  it('pide una actividad por fila, confirma el guardado y no borra la posibilidad si se elige otra vez', () => {
    render(<DiagnosticCross activities={activities} step={0} onDraft={() => undefined} />);
    const save = screen.getByRole('button', { name: 'Guardar esta posibilidad' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toContain('Falta elegir en Lo que amas');

    for (const row of ['Lo que amas', 'En lo que eres hábil', 'Lo que necesita', 'Por lo que te pueden pagar']) {
      const group = screen.getByRole('group', { name: row });
      fireEvent.click(group.querySelector('button') as HTMLButtonElement);
      expect(group.querySelector('button')?.getAttribute('aria-pressed')).toBe('true');
    }

    expect(save.disabled).toBe(false);
    expect(screen.getByText(/Guarda la posibilidad para poder seguir/)).toBeTruthy();
    fireEvent.click(save);

    expect(screen.getByText(/Posibilidad guardada/)).toBeTruthy();
    expect(screen.getByText(/Posibilidad 1/)).toBeTruthy();
    expect(save.disabled).toBe(true);

    const again = screen.getByRole('group', { name: 'Lo que amas' }).querySelector('button') as HTMLButtonElement;
    fireEvent.click(again);
    expect(screen.getByText(/Posibilidad 1/)).toBeTruthy();
    expect(screen.getByText(/La guardada sigue en la lista/)).toBeTruthy();
  });
});
