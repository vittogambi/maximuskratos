/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; className?: string; 'aria-label'?: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { JourneyMatrix } from '@/components/member/JourneyMatrix';
import type { MatrixRow } from '@/lib/journey-api';

function row(partial: Partial<MatrixRow> & Pick<MatrixRow, 'territory' | 'label'>): MatrixRow {
  return {
    discover: { state: 'NOT_STARTED', settled: 0, required: 11, exceptionCount: 0 },
    planCount: 0,
    plan: null,
    ...partial,
  };
}

const rows: MatrixRow[] = [
  row({ territory: 'MENTALIDAD', label: 'Mentalidad' }),
  row({ territory: 'FINANZAS', label: 'Finanzas' }),
  row({ territory: 'RELACIONES', label: 'Relaciones' }),
  row({ territory: 'SALUD_FISICA', label: 'Salud física' }),
];

describe('JourneyMatrix', () => {
  it('renders a semantic 4×3 table with phase headers', () => {
    render(<JourneyMatrix rows={rows} weekStart="2026-10-26" />);
    expect(screen.getByRole('heading', { name: 'Tus ámbitos' })).toBeTruthy();
    const table = screen.getByRole('table', { name: 'Tus ámbitos por fase' });
    expect(table.querySelectorAll('tbody tr').length).toBe(4);
    expect(screen.getByRole('columnheader', { name: 'Descubre' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Diseña' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Actúa' })).toBeTruthy();
    expect(screen.getByRole('rowheader', { name: /Mentalidad/ })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Empezar Descubre en/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Crear plan de/ }).length).toBeGreaterThan(0);
  });

  it('shows discover progress, exceptions and focus chip copy', () => {
    const focused = rows.map((item, index) =>
      index === 0
        ? {
            ...item,
            discover: { state: 'PARTIAL' as const, settled: 3, required: 11, exceptionCount: 2 },
            planCount: 1,
            plan: {
              id: 'p1',
              title: 'Plan',
              stage: 'PREPARING' as const,
              isFocus: true,
              nextOccasion: null,
              week: null,
            },
          }
        : item,
    );
    render(<JourneyMatrix rows={focused} weekStart="2026-10-26" />);
    expect(screen.getByText('27% completado')).toBeTruthy();
    expect(screen.getByText('2 respuestas sin respuesta directa')).toBeTruthy();
    expect(screen.getByRole('link', { name: '2 respuestas sin respuesta directa' }).getAttribute('href')).toBe(
      '/ambito/MENTALIDAD?fase=descubre&excepciones=1',
    );
    expect(screen.getByText('Plan principal')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Continuar plan de Mentalidad/ })).toBeTruthy();
  });
});
