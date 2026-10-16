/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccompanimentFlow } from '@/components/journey/AccompanimentFlow';
import { DevolucionView } from '@/components/journey/DevolucionView';
import { ExperimentObservations } from '@/components/journey/ExperimentObservations';

vi.mock('@/lib/auth-storage', () => ({ getAccessToken: () => 'token' }));

const preview = {
  proposal: {
    familyId: 'MEN-EXP',
    mode: 'EXPANSION',
    modeStatus: 'PROVISIONAL',
    situation: 'NONE',
    requiresAction: true,
    reasons: [{ text: 'La meta es enseñar.', refs: ['USER_GOAL'] }],
    missing: [{ key: 'destinatario', question: '¿Hay alguien que pueda escuchar la explicación?' }],
    alternative: null,
    urgency: null,
  },
  help: {
    cycleResult: { text: 'Explicar el oficio.', from: 'USER_GOAL' },
    reasons: [{ text: 'La meta es enseñar.', refs: ['USER_GOAL'] }],
    missing: [{ key: 'destinatario', question: '¿Hay alguien que pueda escuchar la explicación?' }],
    mode: { value: 'EXPANSION', status: 'PROVISIONAL', territory: 'MENTALIDAD', pillar: 'ESPIRITU' },
    action: 'Prepara la secuencia de una tarea.',
    artifact: { kind: 'GUION', fields: [{ key: 'tarea', label: 'Tarea', value: null, pending: true }] },
    occasion: { text: '1 ocasiones de 45 minutos. Sin día ni hora inventados.' },
    doneWhen: 'Quedó la secuencia.',
    minimumVersion: 'Una tarea.',
    alternative: { text: 'Sin destinatario, preparar no prueba utilidad.', requiresApproval: false },
    learning: { question: '¿Se entendió?', expectedEvidence: 'La secuencia.' },
    futureEffect: 'Confirmar escribe el paso en el futuro del plan.',
    forbids: ['Tomar la preparación como utilidad'],
    urgency: null,
  },
  digest: 'abc',
  headVersion: 0,
  plan: null,
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('flujo de acompañamiento', () => {
  it('pide la ayuda, muestra lo pendiente y confirma sin perder el texto', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes('/preview')) {
        return { ok: true, json: async () => preview };
      }
      return { ok: true, json: async () => ({ id: 'd1', repeated: false, help: preview.help }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<AccompanimentFlow />);
    await user.type(screen.getByLabelText('Meta'), 'Explicar el oficio');
    await user.click(screen.getByRole('button', { name: 'Ver ayuda' }));
    expect(await screen.findByText(/secuencia de una tarea/)).toBeTruthy();
    expect(screen.getByText(/Pendiente/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByText(/Quedó confirmado/)).toBeTruthy();
    expect((screen.getByLabelText('Meta') as HTMLInputElement).value).toBe('Explicar el oficio');
  });

  it('muestra el error y conserva el borrador', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({ message: 'La propuesta cambió.', code: 'STALE_PREVIEW' }) })));
    render(<AccompanimentFlow />);
    await user.type(screen.getByLabelText('Meta'), 'Un borrador');
    await user.click(screen.getByRole('button', { name: 'Ver ayuda' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect((screen.getByLabelText('Meta') as HTMLInputElement).value).toBe('Un borrador');
  });
});

describe('devolución y preferencia', () => {
  it('elegir un camino y volver a ver la preferencia guardada', async () => {
    const user = userEvent.setup();
    const chosen: string[] = [];
    const { rerender } = render(<DevolucionView paths={[
      { id: 'PREPARAR', title: 'Preparar la meta que ya elegiste', personalized: true, firstStep: 'Una parte revisable.' },
      { id: 'SEGUIR', title: 'Seguir tu propio plan', personalized: false, firstStep: 'La guía queda apagada.' },
    ]} chosen="" onChoose={(id) => chosen.push(id)} />);
    await user.click(screen.getAllByRole('button', { name: 'Elegir este camino' })[1]);
    expect(chosen).toEqual(['SEGUIR']);
    rerender(<AccompanimentFlow initialPreference="PROPIO" path="SEGUIR" />);
    expect((screen.getByLabelText('Preferencia de ayuda') as HTMLSelectElement).value).toBe('PROPIO');
  });
});

describe('observaciones de experimento', () => {
  it('separa el aspecto y no envía utilidad sin que la persona lo elija', async () => {
    const user = userEvent.setup();
    const seen: unknown[] = [];
    render(<ExperimentObservations onObserve={async (draft) => { seen.push(draft); }} onReview={async () => undefined} />);
    await user.selectOptions(screen.getByLabelText('Aspecto'), 'USEFULNESS');
    await user.selectOptions(screen.getByLabelText('Respuesta del destinatario'), 'NO_RESPONSE');
    await user.type(screen.getByLabelText('Texto de la observación'), 'No contestó');
    await user.click(screen.getByRole('button', { name: 'Guardar observación' }));
    expect(seen[0]).toMatchObject({ aspect: 'USEFULNESS', recipient: 'NO_RESPONSE', observed: 'No contestó' });
  });
});
