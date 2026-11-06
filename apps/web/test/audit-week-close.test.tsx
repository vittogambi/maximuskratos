/** @vitest-environment jsdom */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InterventionReviewDecision } from '@/components/journey/InterventionReviewDecision';
import { InterventionWeekApplyPanel } from '@/components/journey/InterventionWeekApplyPanel';
import type { InterventionPlanView } from '@/lib/intervention-api';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock('@/lib/auth-storage', () => ({ getAccessToken: () => 'token-test' }));

vi.mock('@/lib/journey-api', () => ({
  transitionPlanStage: vi.fn(),
}));

vi.mock('@/lib/intervention-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/intervention-api')>('@/lib/intervention-api');
  return {
    ...actual,
    fetchPendingInterventionWeek: vi.fn(async () => ({
      weekStart: '2026-10-26',
      appliesFrom: '2026-11-02',
      weekClosed: false,
      pending: [
        { planId: 'a', planTitle: 'Plan A', territory: 'MENTALIDAD', choice: 'KEEP', previewSummary: 'Se mantiene.' },
        { planId: 'b', planTitle: 'Plan B', territory: 'MENTALIDAD', choice: 'REDUCE', previewSummary: 'Baja a 1 ocasión.' },
      ],
    })),
    confirmInterventionReview: vi.fn(),
    applyInterventionWeekReview: vi.fn(),
  };
});

const view = {
  horizonReached: true,
  reviewAt: '2026-10-28',
  observableOutcome: 'El bloque sirvió',
  changeTitle: 'Bloque',
  template: { action: 'Reservar el bloque', doneWhen: 'Ocurrió' },
  review: {
    outcomeText: 'El resultado ocurrió.',
    text: 'Puedes mantener o aligerar.',
    choices: ['KEEP', 'REDUCE'],
    lastChoice: null,
    pendingThisWeek: null,
  },
  execution: { coverage: 'COMPLETE', ratioOfResolved: 100, resolved: 2, noInformation: 0 },
} as unknown as InterventionPlanView;

describe('cierre conjunto frente a revisión de un plan', () => {
  afterEach(() => cleanup());

  it('la decisión de un plan no muestra el botón de aplicar todas', async () => {
    render(
      <InterventionReviewDecision territory="mentalidad" planId="a" view={view} weekStart="2026-10-26" onSaved={() => undefined} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sí, sigue importándome' }));
    expect(screen.getByRole('button', { name: 'Guardar decisión' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Aplicar semana/ })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Cierre conjunto' })).toBeNull();
  });

  it('el panel de la semana sí ofrece aplicar las decisiones pendientes', async () => {
    render(<InterventionWeekApplyPanel weekStart="2026-10-26" />);
    expect(await screen.findByRole('button', { name: 'Aplicar cambios de la semana' })).toBeTruthy();
  });

  it('la revisión monta el mismo panel de cierre y Diseña activa por el contrato de intervención', () => {
    const revision = readFileSync(resolve(__dirname, '../app/(member)/semana/revision/page.tsx'), 'utf8');
    const calendar = readFileSync(resolve(__dirname, '../components/journey/CalendarScreen.tsx'), 'utf8');
    const review = readFileSync(resolve(__dirname, '../components/journey/WeekReviewScreen.tsx'), 'utf8');
    const studio = readFileSync(resolve(__dirname, '../components/member/design/StepReview.tsx'), 'utf8');
    const logro = readFileSync(resolve(__dirname, '../app/(member)/planes/[planId]/logro/page.tsx'), 'utf8');
    expect(revision.includes('WeekReviewScreen')).toBe(true);
    expect(review.includes('InterventionWeekApplyPanel')).toBe(true);
    expect(review.includes('IndicatorCheckin')).toBe(true);
    expect(calendar.includes('InterventionWeekApplyPanel')).toBe(false);
    expect(studio.includes('activateInterventionPlan')).toBe(true);
    expect(logro.includes('/mantener')).toBe(false);
  });
});
