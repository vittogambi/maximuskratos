/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HomeBoardView } from '@/lib/journey-api';

const journeyStateMock = vi.hoisted(() => vi.fn());

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock('@/components/auth-session-provider', () => ({
  useAuthSession: () => ({ status: 'member', user: { email: 'a@fixtures.mk.invalid' } }),
}));
vi.mock('@/lib/auth-storage', () => ({ getAccessToken: () => 'token-test' }));
vi.mock('@/lib/journey-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/journey-api')>('@/lib/journey-api');
  return { ...actual, journeyState: journeyStateMock };
});

import { AmbitStage } from '@/components/journey/AmbitStage';

function board(partial: Partial<HomeBoardView> = {}): HomeBoardView {
  return {
    situation: 'JUST_CLOSED',
    reading: {
      name: 'Índice de alineación MK',
      methodVersion: 'ia-mk-cuest@0.1',
      general: 42,
      pillars: { espiritu: 10, mente: 20, cuerpo: 30 },
      coverage: { eligible: 20, required: 20 },
      computedAt: '2026-10-13T15:00:00.000Z',
      explanation: 'Lectura inicial del cuestionario.',
    },
    synthesis: { text: 'Texto editado.', source: 'EDITED' },
    direction: { status: 'PROVISIONAL', goalText: null, experiment: null },
    plan: null,
    occasion: null,
    review: null,
    depth: null,
    evolution: { status: 'INITIAL', delta: null, points: [], note: 'Estado inicial. Una medición no es una tendencia.' },
    territories: { figure: null, method: null, note: 'No hay un índice de ámbito ni una serie en el tiempo.', items: [] },
    ...partial,
  };
}

function state(next: HomeBoardView) {
  return {
    timezone: 'America/Santiago',
    weekStart: '2026-10-12',
    weekClosed: false,
    purposeConfirmed: false,
    activePlanId: null,
    form: { auditTotal: 1 },
    alignment: {
      status: 'saved',
      total: 50,
      pillars: { E: 100, M: 50, C: 0 },
      savedAt: '2026-10-13T02:30:00.000Z',
      methodVersion: 'iad-mk-0.1-borrador',
      coverage: { answered: 9, required: 9 },
      revision: 2,
      directionStatus: 'PROVISIONAL',
    },
    nextAction: { href: '/planes', label: 'Crear el plan', detail: 'Ya hay una dirección.' },
    board: next,
  };
}

describe('inicio integrado', () => {
  beforeEach(() => { journeyStateMock.mockReset(); });
  afterEach(() => { cleanup(); });

  it('separa el índice del cuestionario y la ficha declarada', async () => {
    journeyStateMock.mockResolvedValue(state(board()));
    render(<AmbitStage />);
    expect(await screen.findByRole('heading', { name: 'Cuestionario cerrado' })).toBeTruthy();
    expect(screen.getByText('Índice de alineación MK')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Ficha declarada' }).textContent).toContain('50');
    expect(screen.getByText(/Esta ficha no es el índice del cuestionario/)).toBeTruthy();
    expect(screen.getByText('Texto editado.')).toBeTruthy();
    expect(screen.getByText(/referencia vigente/)).toBeTruthy();
  });

  it('adapta exploración, plan propio, guía, pausa y retorno', async () => {
    journeyStateMock.mockResolvedValue(state(board({ situation: 'EXPLORING', direction: { status: 'EXPLORANDO', goalText: null, experiment: { hypothesis: 'Mostrar un paso.', status: 'ACTIVE' } } })));
    render(<AmbitStage />);
    expect(await screen.findByRole('heading', { name: 'Exploración' })).toBeTruthy();
    expect(screen.getByText(/Mostrar un paso/)).toBeTruthy();
    cleanup();

    journeyStateMock.mockResolvedValue(state(board({
      situation: 'OWN',
      plan: { id: 'p1', title: 'Escribir a mi modo', outcome: 'Hay un párrafo.', priorityNote: 'El lunes.', linkKind: 'DIRECT', status: 'ACTIVE', guided: false },
      occasion: { day: '2026-10-13', title: 'Escribir a mi modo', criterion: 'Hay un párrafo.' },
    })));
    render(<AmbitStage />);
    expect(await screen.findByRole('heading', { name: 'Plan propio' })).toBeTruthy();
    expect(screen.getAllByText('Escribir a mi modo').length).toBeGreaterThan(0);
    expect(screen.getByText(/Criterio: Hay un párrafo/)).toBeTruthy();
    cleanup();

    journeyStateMock.mockResolvedValue(state(board({ situation: 'GUIDED' })));
    render(<AmbitStage />);
    expect(await screen.findByRole('heading', { name: 'Plan guiado' })).toBeTruthy();
    cleanup();

    journeyStateMock.mockResolvedValue(state(board({ situation: 'PAUSED', occasion: null })));
    render(<AmbitStage />);
    expect(await screen.findByRole('heading', { name: 'Pausa' })).toBeTruthy();
    expect(screen.getByText('Sin ocasión mientras la pausa sigue.')).toBeTruthy();
    cleanup();

    journeyStateMock.mockResolvedValue(state(board({ situation: 'RETURN', direction: { status: 'PROVISIONAL', goalText: 'Explicar el oficio.', experiment: null } })));
    render(<AmbitStage />);
    expect(await screen.findByRole('heading', { name: 'Retorno' })).toBeTruthy();
    expect(screen.getByText(/Explicar el oficio/)).toBeTruthy();
  });

  it('una medición parcial no se presenta como tendencia', async () => {
    journeyStateMock.mockResolvedValue(state(board({
      reading: {
        name: 'Índice de alineación MK',
        methodVersion: 'ia-mk-cuest@0.1',
        general: null,
        pillars: { espiritu: 10, mente: null, cuerpo: null },
        coverage: { eligible: 4, required: 20 },
        computedAt: '2026-10-13T15:00:00.000Z',
        explanation: 'Falta cobertura para el general.',
      },
      evolution: { status: 'INITIAL', delta: null, points: [], note: 'Estado inicial. Una medición no es una tendencia.' },
    })));
    render(<AmbitStage />);
    expect(await screen.findByText(/Sin general. No es cero/)).toBeTruthy();
    expect(screen.getByText('Estado inicial. Una medición no es una tendencia.')).toBeTruthy();
    expect(screen.getAllByText('No disponible').length).toBeGreaterThan(0);
  });
});
