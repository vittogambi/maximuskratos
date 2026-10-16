/** @vitest-environment jsdom */
import type { ReactNode } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiagnosticState, QuestionDto } from '@/lib/api';
import { JourneyApiError, type AlignmentReading, type SynthesisPayload } from '@/lib/journey-api';

const pushMock = vi.hoisted(() => vi.fn());
const stateMock = vi.hoisted(() => vi.fn());
const submitMock = vi.hoisted(() => vi.fn());
const outroMock = vi.hoisted(() => vi.fn());
const plansMock = vi.hoisted(() => vi.fn());
const contractMock = vi.hoisted(() => vi.fn());
const synthesisMock = vi.hoisted(() => vi.fn());
const createPlanMock = vi.hoisted(() => vi.fn());
const addActionMock = vi.hoisted(() => vi.fn());
const calendarMock = vi.hoisted(() => vi.fn());
const weeksMock = vi.hoisted(() => vi.fn());
const journeyStateMock = vi.hoisted(() => vi.fn());
const previewMock = vi.hoisted(() => vi.fn());
const closeMock = vi.hoisted(() => vi.fn());
const recordMock = vi.hoisted(() => vi.fn());
const purposeMock = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock('@/components/auth-session-provider', () => ({
  useAuthSession: () => ({ status: 'member', user: { email: 'a@fixtures.mk.invalid' } }),
}));

vi.mock('@/lib/auth-storage', () => ({ getAccessToken: () => 'token-test' }));

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    apiDiagnosticState: stateMock,
    apiDiagnosticSubmitResponse: submitMock,
    apiDiagnosticOutroSeen: outroMock,
  };
});

vi.mock('@/lib/journey-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/journey-api')>('@/lib/journey-api');
  return {
    ...actual,
    journeyPlans: plansMock,
    journeyContract: contractMock,
    journeySynthesis: synthesisMock,
    createPlan: createPlanMock,
    addAction: addActionMock,
    journeyCalendar: calendarMock,
    journeyWeeks: weeksMock,
    journeyState: journeyStateMock,
    previewWeek: previewMock,
    closeWeek: closeMock,
    saveRecord: recordMock,
    journeyPurpose: purposeMock,
  };
});

import { DiagnosticPlayer } from '@/components/diagnostico/DiagnosticPlayer';
import { AmbitStage } from '@/components/journey/AmbitStage';
import { CalendarScreen } from '@/components/journey/CalendarScreen';
import { IkigaiCross } from '@/components/journey/IkigaiCross';
import { PlansScreen } from '@/components/journey/PlansScreen';
import { PurposeScreen } from '@/components/journey/PurposeScreen';
import { ExcelProfile } from '@/components/profile/ExcelProfile';

const NOTE = 'Nota interna del evaluador: no mostrar esta frase.';
const SAVED_AT = '2026-10-13T02:30:00.000Z';

const savedAlignment: AlignmentReading = {
  status: 'saved',
  total: 50,
  pillars: { E: 100, M: 50, C: 0 },
  savedAt: SAVED_AT,
  methodVersion: 'iad-mk-0.1-borrador',
  coverage: { answered: 9, required: 9 },
  revision: 2,
  directionStatus: 'PROVISIONAL',
};

const partialAlignment: AlignmentReading = {
  status: 'partial',
  total: null,
  pillars: { E: 100, M: null, C: null },
  savedAt: SAVED_AT,
  methodVersion: 'iad-mk-0.1-borrador',
  coverage: { answered: 3, required: 9 },
  revision: 1,
  directionStatus: 'EXPLORANDO',
};

function session(question: QuestionDto, intro: boolean): DiagnosticState {
  return {
    sessionState: {
      phase: 'FASE1',
      completionPct: 0,
      currentModuleSlug: 'e-aud-s1',
      currentModuleTitle: 'Mentalidad e identidad',
      currentModuleIntro: 'El objetivo aquí es medir la brecha entre el yo ideal y el yo real.',
      currentModuleIcon: null,
      moduleProgress: 0,
      selfKnowledgePct: 0,
      isModuleStart: intro,
      currentQuestionIndex: 1,
      moduleQuestionCount: 5,
      showWelcomeScreen: false,
      currentModuleOrder: 1,
      totalModules: 31,
      currentModuleEstimatedMinutes: 4,
    },
    nextStep: { type: 'question', data: question },
  };
}

const scaleQuestion = {
  id: 'q-scale',
  type: 'SCALE_1_5',
  textEs: 'Puedo elegir una respuesta deliberada',
  contextEs: NOTE,
  maxSelections: null,
  scaleType: 'BEHAVIORAL',
  reasonPromptEs: null,
  reasonThreshold: null,
  options: [
    { id: 'o1', order: 1, textEs: 'Casi nunca', value: '1' },
    { id: 'o3', order: 3, textEs: 'Puedo sostenerla', value: '3' },
    { id: 'o5', order: 5, textEs: 'Casi siempre', value: '5' },
  ],
  allowedExceptions: [],
  answerRevision: 4,
} as QuestionDto;

const numberQuestion = {
  id: 'q-number',
  type: 'FREE_TEXT',
  textEs: 'Cintura',
  contextEs: NOTE,
  maxSelections: null,
  scaleType: null,
  reasonPromptEs: null,
  reasonThreshold: null,
  options: [],
  capture: { kind: 'number', unit: 'cm', min: 0, max: 250 },
  allowedExceptions: ['UNKNOWN'],
} as QuestionDto;

const multiQuestion = {
  id: 'q-multi',
  type: 'MULTI_CHOICE',
  textEs: 'Valores que eliges',
  contextEs: null,
  maxSelections: 2,
  scaleType: null,
  reasonPromptEs: null,
  reasonThreshold: null,
  options: [
    { id: 'a', order: 1, textEs: 'Claridad', value: 'claridad' },
    { id: 'b', order: 2, textEs: 'Cuidado', value: 'cuidado' },
    { id: 'c', order: 3, textEs: 'Oficio', value: 'oficio' },
  ],
  allowedExceptions: [],
} as QuestionDto;

function journey(alignment: AlignmentReading) {
  return {
    timezone: 'America/Santiago',
    weekStart: '2026-10-12',
    weekClosed: false,
    purposeConfirmed: false,
    activePlanId: null,
    form: null,
    alignment,
    nextAction: { href: '/calendario', label: 'Seguir', detail: '' },
  };
}

const emptyContract = {
  name: null,
  lead: '',
  closing: '',
  articles: [],
  confirmed: false,
  revision: null,
  text: null,
  directionStatus: null,
  statement: null,
};

function openCalendar(done: boolean) {
  return {
    timezone: 'America/Santiago',
    weekStart: '2026-10-12',
    plans: [{
      id: 'plan-1',
      title: 'Un ensayo',
      outcome: 'Hay un párrafo.',
      priorityNote: null,
      linkKind: 'DIRECT',
      valueRef: 'Claridad mental',
      purposeRevisionId: 'rev-9',
      status: 'ACTIVE' as const,
      actions: [{
        id: 'act-1',
        title: 'Caminar diez minutos',
        doneWhen: 'Salí y volví.',
        weekday: 1,
        intervalDays: 7,
        domain: null,
        active: true,
      }],
    }],
    records: done ? [{ id: 'rec-1', actionId: 'act-1', day: '2026-10-12', status: 'DONE', note: null, resultNote: 'El ánimo no cambió.' }] : [],
  };
}

afterEach(() => cleanup());

beforeEach(() => {
  pushMock.mockReset();
  stateMock.mockReset();
  submitMock.mockReset();
  outroMock.mockReset();
  plansMock.mockResolvedValue([]);
  contractMock.mockResolvedValue(emptyContract);
  synthesisMock.mockResolvedValue(null);
  createPlanMock.mockReset();
  addActionMock.mockReset();
  calendarMock.mockResolvedValue({ timezone: 'America/Santiago', weekStart: '2026-10-12', plans: [], records: [] });
  weeksMock.mockResolvedValue([]);
  journeyStateMock.mockResolvedValue(journey(savedAlignment));
  previewMock.mockReset();
  closeMock.mockReset();
  recordMock.mockResolvedValue({});
  purposeMock.mockResolvedValue(null);
});

describe('player without a browser', () => {
  it('shows the section title and objective, and hides the evaluator note', async () => {
    const user = userEvent.setup();
    stateMock.mockResolvedValue(session(scaleQuestion, true));
    render(<DiagnosticPlayer />);
    expect(await screen.findByRole('heading', { name: 'Mentalidad e identidad' })).toBeTruthy();
    expect(screen.getByText('El objetivo aquí es medir la brecha entre el yo ideal y el yo real.')).toBeTruthy();
    expect(screen.queryByText(NOTE)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Comenzar' }));
    expect(await screen.findByRole('heading', { name: scaleQuestion.textEs })).toBeTruthy();
    expect(screen.queryByText(NOTE)).toBeNull();
    const group = screen.getByRole('radiogroup', { name: scaleQuestion.textEs });
    expect(group.getAttribute('aria-labelledby')).toBe('dk-question-title');
  });

  it('la introducción de desarrollo y sentido explica la escala, sin la frase anterior', async () => {
    const start = session(scaleQuestion, true);
    start.sessionState = {
      ...start.sessionState,
      currentModuleSlug: 'e-aud-s6',
      currentModuleTitle: 'Desarrollo y sentido',
      currentModuleIntro: 'Desarrollo y sentido, con la escala de Brooks. Esta lectura queda aparte de la auditoría.',
    };
    stateMock.mockResolvedValue(start);
    render(<DiagnosticPlayer />);
    expect(await screen.findByRole('heading', { name: 'Desarrollo y sentido' })).toBeTruthy();
    expect(screen.getByText(/profesor de Harvard Arthur Brooks/)).toBeTruthy();
    expect(screen.getByText('Totalmente falso / casi nunca.')).toBeTruthy();
    expect(screen.getByText('Totalmente verdadero / casi siempre.')).toBeTruthy();
    expect(screen.queryByText(/queda aparte de la auditoría/)).toBeNull();
  });

  it('sigue a la sección siguiente sin mostrar el cierre del módulo', async () => {
    const user = userEvent.setup();
    const next = session({ ...scaleQuestion, id: 'q-next', textEs: 'Siguiente frase' }, true);
    next.sessionState = {
      ...next.sessionState,
      currentModuleSlug: 'e-aud-s2',
      currentModuleTitle: 'Energía y cuerpo',
      isModuleStart: true,
    };
    let finished = false;
    stateMock.mockImplementation(() => Promise.resolve(finished ? next : session(scaleQuestion, false)));
    outroMock.mockResolvedValue({ success: true });
    submitMock.mockImplementation(async () => {
      finished = true;
      return {
        ...session(scaleQuestion, false),
        nextStep: {
          type: 'module_outro',
          data: {
            moduleSlug: 'e-aud-s1',
            titleEs: 'Mentalidad e identidad',
            outroText: 'Así queda esta sección.',
            readings: [{ label: 'Suma', detail: '16 de 25' }],
          },
        },
      };
    });
    render(<DiagnosticPlayer />);
    await user.click(await screen.findByRole('radio', { name: '3. Puedo sostenerla' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByRole('heading', { name: 'Energía y cuerpo' })).toBeTruthy();
    expect(screen.queryByText('Módulo completo')).toBeNull();
    expect(screen.queryByText('Así queda esta sección.')).toBeNull();
    expect(screen.queryByText('16 de 25')).toBeNull();
    expect(outroMock).toHaveBeenCalledWith('token-test', 'e-aud-s1');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('blocks continue until the number is inside the unit range, and until a scale answer exists', async () => {
    const user = userEvent.setup();
    stateMock.mockResolvedValue(session(numberQuestion, false));
    const view = render(<DiagnosticPlayer />);
    expect(await screen.findByRole('spinbutton', { name: 'cm' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Continuar' }) as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByRole('spinbutton', { name: 'cm' }), '300');
    expect((screen.getByRole('spinbutton', { name: 'cm' }) as HTMLInputElement).value).toBe('300');
    await waitFor(() => expect((screen.getByRole('button', { name: 'Continuar' }) as HTMLButtonElement).disabled).toBe(true));
    await user.clear(screen.getByRole('spinbutton', { name: 'cm' }));
    await user.type(screen.getByRole('spinbutton', { name: 'cm' }), '80');
    await waitFor(() => expect((screen.getByRole('button', { name: 'Continuar' }) as HTMLButtonElement).disabled).toBe(false));
    view.unmount();

    stateMock.mockResolvedValue(session(multiQuestion, false));
    render(<DiagnosticPlayer />);
    await screen.findByRole('option', { name: 'Claridad' });
    await user.click(screen.getByRole('option', { name: 'Claridad' }));
    await user.click(screen.getByRole('option', { name: 'Cuidado' }));
    expect((screen.getByRole('option', { name: 'Oficio' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByLabelText('2 de 2 seleccionadas').textContent).toContain('2 de 2');
  });

  it('keeps the draft on a late write and on a failed write, and sends the revision it loaded', async () => {
    const user = userEvent.setup();
    stateMock.mockResolvedValue(session(scaleQuestion, false));
    render(<DiagnosticPlayer />);
    await user.click(await screen.findByRole('radio', { name: '3. Puedo sostenerla' }));
    let release: (value: DiagnosticState) => void = () => undefined;
    const pending = new Promise<DiagnosticState>((resolve) => { release = resolve; });
    submitMock.mockReturnValueOnce(pending);
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeTruthy();
    expect(submitMock).toHaveBeenCalledWith('token-test', expect.objectContaining({
      questionId: 'q-scale',
      selectedOptionIds: ['o3'],
      expectedRevision: 4,
    }));
    release(session({ ...scaleQuestion, id: 'q-next', textEs: 'Siguiente frase' }, false));
    const nextHeading = await screen.findByRole('heading', { name: 'Siguiente frase' });
    expect(nextHeading).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(nextHeading));
    // The confirmation belongs to the answer just saved, not to the unanswered question now on screen.
    expect(screen.queryByText('Guardado')).toBeNull();
    expect(screen.getByText('Elige una opción para continuar.')).toBeTruthy();
  });

  it('a late response does not replace the question on screen', async () => {
    const user = userEvent.setup();
    stateMock.mockResolvedValue(session(scaleQuestion, false));
    render(<DiagnosticPlayer />);
    await user.click(await screen.findByRole('radio', { name: '3. Puedo sostenerla' }));
    submitMock.mockResolvedValueOnce(session({ ...scaleQuestion, id: 'q-next', textEs: 'Siguiente frase' }, false));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByRole('heading', { name: 'Siguiente frase' })).toBeTruthy();
    await user.click(screen.getByRole('radio', { name: '3. Puedo sostenerla' }));
    let release: (value: DiagnosticState) => void = () => undefined;
    submitMock.mockReturnValueOnce(new Promise<DiagnosticState>((resolve) => { release = resolve; }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(screen.getByRole('heading', { name: 'Siguiente frase' })).toBeTruthy();
    release(session({ ...scaleQuestion, id: 'q-late', textEs: 'Llegó tarde' }, false));
    expect(await screen.findByRole('heading', { name: 'Llegó tarde' })).toBeTruthy();
    expect(screen.queryByText('Guardado')).toBeNull();
  });

  it('keeps the chosen answer when the save fails or another session wrote first', async () => {
    const user = userEvent.setup();
    stateMock.mockResolvedValue(session(scaleQuestion, false));
    render(<DiagnosticPlayer />);
    await user.click(await screen.findByRole('radio', { name: '3. Puedo sostenerla' }));
    submitMock.mockRejectedValueOnce(Object.assign(new Error('down'), { status: 500 }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'No se pudo guardar. El texto sigue aquí. Puedes reintentar.');
    expect(screen.getByRole('radio', { name: '3. Puedo sostenerla' }).getAttribute('aria-checked')).toBe('true');

    submitMock.mockRejectedValueOnce(Object.assign(new Error('stale'), { status: 409 }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Otra sesión escribió después');
    expect(screen.getByRole('radio', { name: '3. Puedo sostenerla' }).getAttribute('aria-checked')).toBe('true');
  });

  it('does not change the answer or start another write while the first one is in flight', async () => {
    const user = userEvent.setup();
    stateMock.mockResolvedValue(session(scaleQuestion, false));
    render(<DiagnosticPlayer />);
    await user.click(await screen.findByRole('radio', { name: '3. Puedo sostenerla' }));
    let release: (value: DiagnosticState) => void = () => undefined;
    submitMock.mockReturnValueOnce(new Promise<DiagnosticState>((resolve) => { release = resolve; }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('radio', { name: '5. Casi siempre' }));
    await user.click(screen.getByRole('button', { name: 'Guardar y salir' }));
    expect(screen.getByRole('radio', { name: '3. Puedo sostenerla' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: '5. Casi siempre' }).getAttribute('aria-checked')).toBe('false');
    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(pushMock).not.toHaveBeenCalled();
    release(session({ ...scaleQuestion, id: 'q-next', textEs: 'Siguiente frase' }, false));
    expect(await screen.findByRole('heading', { name: 'Siguiente frase' })).toBeTruthy();
  });

  it('keeps an incomplete form on screen when leaving, until the person discards it', async () => {
    const user = userEvent.setup();
    const measures = {
      id: 'q-measures',
      type: 'FREE_TEXT',
      textEs: 'Medidas',
      contextEs: null,
      maxSelections: null,
      scaleType: null,
      reasonPromptEs: null,
      reasonThreshold: null,
      options: [],
      capture: {
        kind: 'measures',
        fields: [
          { key: 'age', label: 'Edad', unit: 'años', min: 0, max: 120 },
          { key: 'height', label: 'Altura', unit: 'cm', min: 0, max: 250 },
          { key: 'weight', label: 'Peso', unit: 'kg', min: 0, max: 300 },
        ],
      },
      allowedExceptions: [],
      answerRevision: 0,
    } as QuestionDto;
    stateMock.mockResolvedValue(session(measures, false));
    render(<DiagnosticPlayer />);
    await user.type(await screen.findByRole('spinbutton', { name: 'Edad' }), '40');
    await user.click(screen.getByRole('button', { name: 'Guardar y salir' }));
    expect(submitMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('no se guarda');
    expect((screen.getByRole('spinbutton', { name: 'Edad' }) as HTMLInputElement).value).toBe('40');
    await user.click(screen.getByRole('button', { name: 'Salir sin guardar' }));
    expect(pushMock).toHaveBeenCalledWith('/panel');
  });

  it('saves a previous answer again with the revision produced by the last write', async () => {
    const user = userEvent.setup();
    stateMock.mockResolvedValue(session(scaleQuestion, false));
    render(<DiagnosticPlayer />);
    await user.click(await screen.findByRole('radio', { name: '3. Puedo sostenerla' }));
    submitMock.mockResolvedValueOnce(session({ ...scaleQuestion, id: 'q-next', textEs: 'Siguiente frase', answerRevision: 0 }, false));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByRole('heading', { name: 'Siguiente frase' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(await screen.findByRole('heading', { name: scaleQuestion.textEs })).toBeTruthy();
    submitMock.mockResolvedValueOnce(session({ ...scaleQuestion, id: 'q-next', textEs: 'Siguiente frase' }, false));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(submitMock).toHaveBeenLastCalledWith('token-test', expect.objectContaining({
      questionId: 'q-scale',
      expectedRevision: 5,
    }));
  });
});

describe('cross, plan and review without a browser', () => {
  it('recovers a partial combination and does not overwrite the free edit', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const received = {
      version: 'cruce-cualitativo@1',
      activities: [
        { sourceRef: 'R220', field: 'pasion', ambit: '', option: '', answer: 'Escribir ensayos' },
        { sourceRef: 'R241', field: 'profesion', ambit: 'Consultoría', option: 'Diagnóstico', answer: 'Diagnosticar' },
      ],
      links: [{ id: 'l1', fromRef: 'R220', toRef: 'R241', combinationId: 'c1', reason: 'Prueba', status: 'ACTIVE' }],
      combinations: [{ id: 'c1', reason: '', valuation: null, valuationReason: '', experiment: '' }],
      purpose: { status: 'EXPLORANDO', parts: { pasion: 'R220' }, generated: '', edited: 'Mi frase', open: [] },
      catalog: {
        pasion: { sourceName: 'Pasión', question: '', ambits: [{ label: 'Creación y Expresión', options: ['Escribir'] }] },
        profesion: { sourceName: 'Profesión', question: '', ambits: [] },
      },
      values: [],
      standards: [],
      purposeRevisionId: 'rev-9',
      revision: 2,
    } as SynthesisPayload;
    render(<IkigaiCross data={received} saving={false} onSave={onSave} />);
    expect((screen.getByLabelText(/Edición libre/) as HTMLTextAreaElement).value).toBe('Mi frase');
    expect(screen.getByText(/Escribir ensayos con Diagnosticar/)).toBeTruthy();
    expect(screen.getByText('Completa el ámbito de: Escribir ensayos')).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Valoración de la combinación seleccionada'), 'PARTIAL');
    await user.click(screen.getByRole('button', { name: 'Retirar vínculo' }));
    await user.click(screen.getByRole('button', { name: 'Nueva combinación' }));
    expect(screen.getByRole('heading', { name: /Combinación 2/ })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Guardar cruce' }));
    const saved = onSave.mock.calls[0][0] as SynthesisPayload;
    expect(saved.purpose.edited).toBe('Mi frase');
    expect(saved.links[0]?.status).toBe('RETIRED');
    expect(saved.combinations).toHaveLength(2);
    expect(saved.combinations[0]?.valuation).toBe('PARTIAL');
  });

  it('sends the chosen link and value, and keeps the draft when the gate refuses', async () => {
    const user = userEvent.setup();
    synthesisMock.mockResolvedValue({
      version: 'cruce-cualitativo@1',
      activities: [],
      links: [],
      combinations: [],
      purpose: { status: 'PROVISIONAL', parts: {}, generated: '', edited: 'Quiero probar escribir.', open: [] },
      catalog: {},
      values: ['Claridad mental'],
      standards: [],
      purposeRevisionId: 'rev-9',
      revision: 2,
    });
    createPlanMock.mockRejectedValueOnce(new JourneyApiError(
      'Falta cerrar el cuestionario.',
      403,
      'FORMULARIO_REQUIRED',
      '/diagnostico',
      ['Terminar el cuestionario'],
    ));
    render(<PlansScreen />);
    await user.type(await screen.findByLabelText('Resultado buscado'), 'Un ensayo usable');
    await user.type(screen.getByLabelText('Cómo sabrás que ocurrió'), 'Hay un párrafo leíble.');
    await user.selectOptions(screen.getByLabelText('Vínculo con tu dirección'), 'DIRECT');
    await user.selectOptions(screen.getByLabelText('Valor o estándar que orienta esta decisión'), 'Claridad mental');
    await user.clear(screen.getByLabelText('Entregable delimitado'));
    await user.type(screen.getByLabelText('Entregable delimitado'), 'Texto propio de ayuda');
    await user.click(screen.getByRole('button', { name: 'Crear plan' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Terminar el cuestionario');
    expect((screen.getByLabelText('Resultado buscado') as HTMLInputElement).value).toBe('Un ensayo usable');
    expect((screen.getByLabelText('Entregable delimitado') as HTMLTextAreaElement).value).toBe('Texto propio de ayuda');
    createPlanMock.mockResolvedValueOnce({ id: 'plan-1' });
    await user.click(screen.getByRole('button', { name: 'Crear plan' }));
    await waitFor(() => expect(createPlanMock).toHaveBeenCalledTimes(2));
    expect(createPlanMock.mock.calls[1]).toEqual(['token-test', {
      title: 'Un ensayo usable',
      outcome: 'Hay un párrafo leíble.',
      priorityNote: 'Texto propio de ayuda',
      linkKind: 'DIRECT',
      valueRef: 'Claridad mental',
      purposeRevisionId: 'rev-9',
    }]);
  });

  it('shows a restriction alternative and keeps the action draft', async () => {
    const user = userEvent.setup();
    plansMock.mockResolvedValue([{
      id: 'plan-1',
      title: 'Un ensayo',
      outcome: 'Hay un párrafo.',
      priorityNote: 'Texto propio de ayuda',
      linkKind: 'DIRECT',
      valueRef: 'Claridad mental',
      purposeRevisionId: 'rev-9',
      status: 'ACTIVE',
      actions: [],
    }]);
    addActionMock.mockRejectedValueOnce(new JourneyApiError(
      'Esta acción está restringida.',
      403,
      'RESTRICTED',
      null,
      ['Elige otra acción', 'Aclara el límite'],
    ));
    render(<PlansScreen />);
    await user.type(await screen.findByLabelText('Acción'), 'Invertir el ahorro');
    await user.type(screen.getByLabelText('Criterio'), 'Moví el dinero.');
    await user.click(screen.getByRole('checkbox', { name: 'Inversión' }));
    await user.click(screen.getByRole('button', { name: 'Agregar acción' }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Elige otra acción');
    expect(alert.textContent).toContain('Aclara el límite');
    expect((screen.getByLabelText('Acción') as HTMLInputElement).value).toBe('Invertir el ahorro');
  });

  it('keeps the plan draft when the guide example still has gaps', async () => {
    const user = userEvent.setup();
    render(<PlansScreen />);
    await user.type(await screen.findByLabelText('Resultado buscado'), 'Un ensayo usable');
    await user.type(screen.getByLabelText('Cómo sabrás que ocurrió'), 'Hay un párrafo.');
    await user.click(screen.getByRole('button', { name: 'Crear plan' }));
    expect((await screen.findByRole('alert')).textContent).toContain('huecos');
    expect(createPlanMock).not.toHaveBeenCalled();
    expect((screen.getByLabelText('Resultado buscado') as HTMLInputElement).value).toBe('Un ensayo usable');
  });

  it('previews a frequency change, reports a conflict, and keeps the selection', async () => {
    const user = userEvent.setup();
    calendarMock.mockResolvedValue(openCalendar(true));
    previewMock.mockResolvedValue({ effects: [{ summary: 'El criterio sigue. Cada 14 días, el miércoles.' }] });
    closeMock.mockRejectedValueOnce(Object.assign(new Error('conflict'), { status: 409, message: 'Otra sesión cerró esta semana.' }));
    render(<CalendarScreen />);
    await screen.findByLabelText('Decisión para Caminar diez minutos');
    expect((screen.getByRole('button', { name: 'Aplicar' }) as HTMLButtonElement).disabled).toBe(true);
    await user.selectOptions(screen.getByLabelText('Qué pasó con el resultado'), 'STUCK');
    expect(screen.getByText(/Varias acciones quedaron hechas y el resultado que observas no se movió/)).toBeTruthy();
    expect(screen.getByText(/Nada de esto se aplica solo/)).toBeTruthy();
    expect(previewMock).not.toHaveBeenCalled();
    await user.selectOptions(screen.getByLabelText('Decisión para Caminar diez minutos'), 'REDUCE');
    await user.selectOptions(screen.getByLabelText('Frecuencia futura de Caminar diez minutos'), '14');
    await user.selectOptions(screen.getByLabelText('Día futuro de Caminar diez minutos'), '3');
    await user.click(screen.getByRole('button', { name: 'Ver efecto' }));
    expect(await screen.findByText(/El criterio sigue/)).toBeTruthy();
    expect(previewMock).toHaveBeenCalledWith('token-test', '2026-10-12', '', { 'act-1': 'REDUCE' }, {
      'act-1': { weekday: 3, intervalDays: 14 },
    }, {});
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Otra sesión cerró esta semana.');
    expect((screen.getByLabelText('Frecuencia futura de Caminar diez minutos') as HTMLSelectElement).value).toBe('14');
    expect((screen.getByLabelText('Decisión para Caminar diez minutos') as HTMLSelectElement).value).toBe('REDUCE');
  });

  it('shows the closed week from its snapshot and the next week from the new revision', async () => {
    const user = userEvent.setup();
    let closed = false;
    calendarMock.mockImplementation(async () => (closed ? {
      ...openCalendar(false),
      plans: [{
        ...openCalendar(false).plans[0],
        outcome: 'Un párrafo que se puede usar.',
        actions: [{
          id: 'act-2',
          title: 'Sentarme cinco minutos',
          doneWhen: 'Salí y volví.',
          weekday: 3,
          intervalDays: 14,
          domain: null,
          active: true,
        }],
      }],
    } : openCalendar(true)));
    weeksMock.mockImplementation(async () => (closed ? [{
      id: 'week-1',
      weekStart: '2026-10-12',
      note: null,
      snapshot: {
        plans: [{
          id: 'plan-1',
          outcome: 'Hay un párrafo.',
          actions: [{
            id: 'act-1',
            title: 'Caminar diez minutos',
            doneWhen: 'Salí y volví.',
            weekday: 1,
            intervalDays: 7,
            records: [{ day: '2026-10-12', status: 'DONE', resultNote: 'El ánimo no cambió.' }],
          }],
        }],
      },
    }] : []));
    previewMock.mockResolvedValue({ effects: [{ summary: 'La ocasión futura usa la estrategia nueva.' }], plans: [{ planId: 'plan-1', summary: 'El resultado observable pasa a: Un párrafo que se puede usar.' }] });
    closeMock.mockImplementation(async () => { closed = true; return { id: 'week-1' }; });
    render(<CalendarScreen />);
    await screen.findByLabelText('Decisión para Caminar diez minutos');
    await user.type(screen.getByLabelText('Resultado futuro de Un ensayo'), 'Un párrafo que se puede usar.');
    await user.selectOptions(screen.getByLabelText('Decisión para Caminar diez minutos'), 'SUBSTITUTE');
    await user.type(screen.getByLabelText('Estrategia nueva de Caminar diez minutos'), 'Sentarme cinco minutos');
    await user.click(screen.getByRole('button', { name: 'Ver efecto' }));
    await screen.findByText('La ocasión futura usa la estrategia nueva.');
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(await screen.findByText('Esta semana conserva el criterio con el que se cerró.')).toBeTruthy();
    expect(screen.getByText('Resultado de esa semana: Hay un párrafo.')).toBeTruthy();
    expect(screen.getByText(/Resultado: El ánimo no cambió/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Caminar diez minutos' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByRole('heading', { name: 'Sentarme cinco minutos' })).toBeTruthy();
    expect(screen.getByText('Resultado vigente: Un párrafo que se puede usar.')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Caminar diez minutos' })).toBeNull();
  });
});

describe('alignment card without a browser', () => {
  it('shows the same revision, values, date and coverage on each consumer', async () => {
    render(<ExcelProfile form={{}} alignment={savedAlignment} />);
    expect(screen.getByText(/Revisión 2/)).toBeTruthy();
    expect(screen.getByText(/12 oct 2026/)).toBeTruthy();
    expect(screen.getByText('100')).toBeTruthy();
    expect(screen.getAllByText('50').length).toBeGreaterThan(0);
    expect(screen.getByText('0')).toBeTruthy();
    cleanup();

    render(<AmbitStage />);
    expect(await screen.findByText(/Revisión 2/)).toBeTruthy();
    expect(screen.getByText(/12 oct 2026/)).toBeTruthy();
    expect(screen.getByText('50')).toBeTruthy();
    expect(screen.getByText(/Espíritu 100/)).toBeTruthy();
    cleanup();

    render(<PurposeScreen />);
    expect(await screen.findByText(/Medición guardada: 50/)).toBeTruthy();
    expect(screen.getByText(/Cobertura 9 de 9/)).toBeTruthy();
    expect(screen.getByText(/12 oct 2026/)).toBeTruthy();
    expect(screen.getByText(/Revisión 2/)).toBeTruthy();
    cleanup();

    render(<CalendarScreen />);
    expect(await screen.findByText(/Alineación declarada: 50/)).toBeTruthy();
    expect(screen.getByText(/Cobertura 9 de 9/)).toBeTruthy();
    expect(screen.getByText(/12 oct 2026/)).toBeTruthy();
    expect(screen.getByText(/Revisión 2/)).toBeTruthy();
  });

  it('shows a partial card without a total, and an error apart from an empty card', async () => {
    render(<ExcelProfile form={{}} alignment={partialAlignment} />);
    expect(screen.getByText(/Cobertura 3 de 9/)).toBeTruthy();
    expect(screen.getByText(/Sin total/)).toBeTruthy();
    expect(screen.queryByText(/^100\./)).toBeNull();
    cleanup();

    journeyStateMock.mockResolvedValueOnce(journey(partialAlignment));
    render(<AmbitStage />);
    expect(await screen.findByText('3 de 9')).toBeTruthy();
    expect(screen.getByText(/Sin total/)).toBeTruthy();
    cleanup();

    render(<ExcelProfile form={{}} alignment={null} />);
    expect(screen.getByText('Pendiente')).toBeTruthy();
    expect(screen.getByText('Pendiente')).toBeTruthy();
    expect(screen.getByText(/Puedes continuar sin completarla/)).toBeTruthy();
    expect(document.body.textContent).toContain('el plan no queda bloqueado');
    cleanup();

    render(<ExcelProfile form={{}} alignment={null} alignmentError />);
    expect(screen.getByText('No se pudo leer la ficha.')).toBeTruthy();
    expect(screen.queryByText(/Ficha pendiente/)).toBeNull();
    cleanup();

    journeyStateMock.mockRejectedValueOnce(new Error('down'));
    render(<PurposeScreen />);
    expect(await screen.findByText('No se pudo leer la ficha.')).toBeTruthy();
    expect(screen.queryByText('Sin ficha guardada.')).toBeNull();
    cleanup();

    journeyStateMock.mockRejectedValueOnce(new Error('down'));
    render(<CalendarScreen />);
    expect(await screen.findByText('No se pudo leer la ficha.')).toBeTruthy();
    expect(screen.queryByText('Sin ficha guardada.')).toBeNull();
  });

  it('does not change the saved card when a task is marked done', async () => {
    const user = userEvent.setup();
    calendarMock.mockResolvedValue(openCalendar(false));
    render(<CalendarScreen />);
    expect(await screen.findByText(/Alineación declarada: 50/)).toBeTruthy();
    const before = screen.getByText(/Alineación declarada: 50/).textContent;
    await user.click(screen.getByRole('button', { name: 'Hecho' }));
    await waitFor(() => expect(recordMock).toHaveBeenCalled());
    expect(recordMock.mock.calls[0][1]).toEqual(expect.objectContaining({ actionId: 'act-1', status: 'DONE' }));
    expect(recordMock.mock.calls[0][1].alignment).toBeUndefined();
    expect(screen.getByText(/Alineación declarada: 50/).textContent).toBe(before);
    expect(screen.getByText(/Revisión 2/)).toBeTruthy();
  });
});
