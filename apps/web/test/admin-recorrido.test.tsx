/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const journeyMock = vi.hoisted(() => vi.fn());
const alertsMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api', () => ({ apiAdminJourney: journeyMock, apiAdminAlerts: alertsMock, apiAdminResponses: vi.fn() }));
vi.mock('next/navigation', () => ({
  useParams: () => ({ userId: 'user-1' }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/admin/users/user-1/recorrido',
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock('@/lib/auth-storage', () => ({ getAccessToken: () => 'token' }));

import { RecorridoScreen } from '@/components/admin/recorrido-screen';
import { RecorridoView } from '@/components/admin/recorrido-view';
import { patchRecorridoQuery, presentActivity, presentReading, presentSheetItem } from '@/components/admin/recorrido-reading';
import type { AdminJourney } from '@/lib/api';

afterEach(() => cleanup());

function journey(patch: Partial<AdminJourney> = {}): AdminJourney {
  return {
    account: { id: 'user-1', email: 'ana@example.com', role: 'USER', onboardingStep: 'PROFILE_COMPLETE' },
    sessions: [{ id: 'session-1', status: 'ACTIVE', version: 'formulario-completo@6', definitionRef: 'formulario-completo', startedAt: '2026-10-01T00:00:00.000Z', completedAt: null, lastActivityAt: '2026-10-16T15:00:00.000Z', responseCount: 3 }],
    selectedSessionId: 'session-1',
    modules: [
      { slug: 'e-aud-s1', phase: 'FASE1', title: 'Auditoría inicial', intro: 'Objetivo del módulo.', answered: 1, total: 5 },
      { slug: 'e-per-ikigai', phase: 'FASE2', title: 'Actividades', intro: 'Campo de actividades.', answered: 1, total: 4 },
    ],
    profile: {
      auditTotal: 0,
      auditMax: 115,
      auditDiagnostic: 'Sin desarrollo',
      relationTotal: null,
      relationNote: 'Sin pareja. El círculo íntimo queda fuera. El total de 60 no se calcula.',
      financeTotal: 40,
      financeDiagnostic: 'Nivel de alerta. Estancamiento o techo de valor',
      identityTotal: 22,
      identityMax: 40,
      senseTotal: null,
      difficulties: { PR: { value: 0, calculable: true }, ER: { value: null, calculable: false }, IN: { value: 9, calculable: true } },
      personality: {
        Apertura: { descriptor: 'Apertura: lectura intermedia.', calculable: true },
        'Sensibilidad emocional': { descriptor: 'Sensibilidad moderada, reacciona según el contexto', value: 3.1, calculable: true },
      },
    },
    alertState: 'HISTORY_UNAVAILABLE',
    alignment: [{
      id: 'reading-1',
      kind: 'INITIAL',
      methodVersion: 'ia-mk-cuest@0.1',
      sessionId: 'session-1',
      computedAt: '2026-10-16T15:00:00.000Z',
      output: { general: 52.1605, pillars: { ESPIRITU: null, MENTE: 46.76, CUERPO: 0 }, coverage: { eligible: 20, required: 20 } },
    }],
    declared: null,
    direction: { revision: 2, confirmedAt: null, status: 'EXPLORANDO', statement: 'Borrador posterior.', name: 'Ana' },
    signed: {
      revision: 1,
      confirmedAt: '2026-10-16T16:45:00.000Z',
      name: 'Ana',
      contract: 'TEXTO ENTERO FIRMADO',
      contractView: {
        introTitle: 'El Manifiesto de su Propósito: Su Contrato Soberano',
        intro: 'La exploración de su historia, su mente y sus aspiraciones culmina en este documento. Lo que sigue a continuación no es un texto genérico.',
        articles: [{
          title: 'IV. Las relaciones',
          items: [{
            label: 'Círculo íntimo',
            category: 'Calibración',
            descriptor: 'Relación cordial.',
            commitment: 'Dedicaré 8 horas.',
            text: 'Calibración. Relación cordial. Dedicaré 8 horas.',
          }],
        }],
      },
    },
    draftIsLater: true,
    rules: [],
    ikigai: {
      activities: [{
        sourceRef: 'formulario-v1:E-PER-000!R220',
        field: 'pasion',
        ambit: 'Crear',
        option: 'Enseñar',
        answer: 'Resolver problemas',
        recognized: true,
        raw: null,
      }],
      synthesis: {
        activities: [
          { sourceRef: 'formulario-v1:E-PER-000!R220', answer: 'Enseñar' },
          { sourceRef: 'formulario-v1:E-PER-000!R241', answer: 'Resolver problemas' },
        ],
        links: [{
          id: 'l1',
          fromRef: 'formulario-v1:E-PER-000!R220',
          toRef: 'formulario-v1:E-PER-000!R241',
          combinationId: 'c1',
          reason: 'Esta mezcla',
          status: 'ACTIVE',
        }],
        combinations: [{ id: 'c1', reason: 'Esta mezcla', valuation: 'PARTIAL', experiment: 'Mostrar un paso.' }],
      },
      experiments: [],
    },
    ...patch,
  };
}

const quiet = { onVista: () => undefined, onApartado: () => undefined, onModule: () => undefined, onPage: () => undefined, onRetryAlerts: () => undefined };

describe('admin recorrido', () => {
  it('discards a journey response that arrives after leaving the account', async () => {
    let resolveJourney: (value: AdminJourney) => void = () => undefined;
    journeyMock.mockReturnValue(new Promise((resolve) => { resolveJourney = resolve; }));
    alertsMock.mockResolvedValue({ state: 'READY', page: 1, total: 0, items: [] });
    const view = render(<RecorridoScreen />);
    view.unmount();
    resolveJourney(journey());
    await Promise.resolve();
    expect(screen.queryByText('ana@example.com')).toBeNull();
  });

  it('opens one view at a time and keeps the signed sheet apart from the draft', async () => {
    const user = userEvent.setup();
    const onVista = vi.fn();
    render(<RecorridoView journey={journey()} responses={null} alerts={{ state: 'READY', page: 1, total: 0, items: [] }} error="" vista="resumen" apartado="direccion" modulo={null} pagina={1} {...quiet} onVista={onVista} />);
    expect(screen.getByRole('heading', { name: 'Ana' })).toBeTruthy();
    expect(screen.getByText('En curso')).toBeTruthy();
    expect(screen.queryByLabelText('Sesión')).toBeNull();
    expect(screen.queryByText(/versión 6/)).toBeNull();
    expect(screen.getByText('E-AUD-001')).toBeTruthy();
    expect(screen.getByText('0 de 115')).toBeTruthy();
    expect(screen.getByText('Sin desarrollo')).toBeTruthy();
    expect(screen.getAllByText('No disponible').length).toBeGreaterThan(0);
    expect(screen.getByText(/Sin pareja/)).toBeTruthy();
    expect(screen.queryByText('Texto firmado')).toBeNull();
    expect(screen.queryByText(/TEXTO ENTERO/)).toBeNull();
    await user.click(screen.getByRole('tab', { name: 'Propósito y hoja' }));
    expect(onVista).toHaveBeenCalledWith('proposito');
  });

  it('shows the sheet once and keeps a text-only snapshot', () => {
    render(<RecorridoView journey={journey()} responses={null} alerts={null} error="" vista="proposito" apartado="hoja" modulo={null} pagina={1} {...quiet} />);
    expect(screen.getByRole('heading', { name: 'Hoja de ruta de propósito' })).toBeTruthy();
    expect(screen.queryByText(/La exploración de su historia/)).toBeNull();
    expect(screen.queryByText(/Manifiesto de su Propósito/)).toBeNull();
    expect(screen.getAllByText('Relación cordial.').length).toBe(1);
    expect(screen.getAllByText('Dedicaré 8 horas.').length).toBe(1);
    expect(screen.queryByText(/Calibración\. Relación cordial/)).toBeNull();
    cleanup();
    render(<RecorridoView journey={journey({ signed: { revision: 1, confirmedAt: '2026-10-16T16:45:00.000Z', name: 'Ana', contract: 'TEXTO ENTERO FIRMADO', contractView: null } })} responses={null} alerts={null} error="" vista="proposito" apartado="hoja" modulo={null} pagina={1} {...quiet} />);
    expect(screen.getByText('TEXTO ENTERO FIRMADO')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Firmar' })).toBeNull();
  });

  it('reads a recognized activity and keeps unknown text', () => {
    const known = presentActivity({ field: 'pasion', ambit: 'Crear', option: 'Enseñar', answer: 'Resolver problemas', recognized: true, raw: null });
    expect(known.field).toBe('Pasión');
    expect(known.raw).toBeNull();
    const loose = presentActivity('{"answer":"Enseñar","ambit":"Crear","option":"Oficio"}');
    expect(loose.answer).toBe('Enseñar');
    expect(loose.field).toBe('Campo no identificado');
    const plain = presentActivity('Texto libre de la persona');
    expect(plain.answer).toBe('Texto libre de la persona');
    expect(plain.raw).toBeNull();
    const broken = presentActivity('{esto no es json');
    expect(broken.answer).toContain('esto no es json');
    expect(broken.raw).toContain('{');
    const line = presentSheetItem({ descriptor: 'Relación cordial.', commitment: 'Dedicaré 8 horas.', text: 'Calibración. Relación cordial. Dedicaré 8 horas.', category: 'Calibración' });
    expect(line.text).toBeNull();
    expect(line.parts).toContain('Dedicaré 8 horas.');
  });

  it('shows an alert failure once and distinguishes a missing ficha from a zero', async () => {
    render(<RecorridoView journey={journey({ rules: [
      { questionId: 'q-fired', questionRef: 'ref-fired', text: 'Duermo poco.', value: '1', status: 'FIRED', rule: 'Se gatilla con respuesta 1 en la escala.', moduleSlug: 'e-aud-s1' },
      { questionId: 'q-clear', questionRef: 'ref-clear', text: 'Cumplo lo que digo.', value: '5', status: 'NOT_FIRED', rule: 'Se gatilla con respuesta 1 en la escala.', moduleSlug: 'e-aud-s1' },
    ] })} responses={null} alerts={{ state: 'ERROR', page: 1, total: 0, items: [] }} error="" vista="alertas" apartado="direccion" modulo={null} pagina={1} {...quiet} />);
    expect(screen.getByText('Duermo poco.')).toBeTruthy();
    expect(screen.getByText('Cumplo lo que digo.')).toBeTruthy();
    expect(screen.getByText(/alertas gatilladas/)).toBeTruthy();
    expect(screen.getByText(/preguntas evaluadas sin alerta/)).toBeTruthy();
    expect(screen.getByText('Alerta gatillada')).toBeTruthy();
    expect(screen.getAllByText('Respuesta guardada').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Se gatilla con respuesta 1 en la escala/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/No se pudo consultar las alertas/)).toBeNull();
    expect(screen.queryByRole('columnheader', { name: 'Pregunta' })).toBeNull();
    cleanup();
    render(<RecorridoView journey={journey()} responses={null} alerts={null} error="" vista="alertas" apartado="direccion" modulo={null} pagina={1} {...quiet} />);
    expect(screen.getByText('No hay respuestas de auditoría evaluadas en el cuestionario.')).toBeTruthy();
    expect(screen.queryByText(/No se pudo consultar las alertas/)).toBeNull();
    cleanup();
    render(<RecorridoView journey={journey()} responses={null} alerts={null} error="" vista="perfil" apartado="direccion" modulo={null} pagina={1} {...quiet} />);
    expect(screen.getByText('No hay ficha declarada. El índice de arriba no la reemplaza.')).toBeTruthy();
    expect(screen.getByText('52')).toBeTruthy();
    expect(screen.getByText('Sensibilidad moderada, reacciona según el contexto')).toBeTruthy();
    expect(screen.getByText(/Factores de la personalidad \(OCEAN\)/)).toBeTruthy();
    expect(screen.getByText('3,1 de 5')).toBeTruthy();
    expect(screen.queryByText('intermedia.')).toBeNull();
    expect(screen.queryByText(/52\.1605/)).toBeNull();
    expect(screen.getByText('Patrones repetitivos')).toBeTruthy();
    expect(screen.getByText('0 de 18')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Capacidades que reconoces' })).toBeTruthy();
    expect(screen.getByText('9 de 18')).toBeTruthy();
    expect(screen.getByText('Recursos en rango medio')).toBeTruthy();
    expect(screen.getByText(/Pendiente. Hace falta cerrar los cinco bloques/)).toBeTruthy();
    expect(screen.getByText(/Lectura inicial/)).toBeTruthy();
    expect(screen.queryByText(/^INITIAL$/)).toBeNull();
  });

  it('selects a module from the responses view and resets the page in the query', async () => {
    const user = userEvent.setup();
    const onModule = vi.fn();
    render(<RecorridoView journey={journey()} responses={{ module: { slug: 'e-aud-s1', title: 'Auditoría inicial', intro: 'Objetivo del módulo.' }, page: 2, pageSize: 30, total: 40, items: [
      { questionId: 'q1', text: 'Pregunta larga de auditoría.', type: 'SCALE_1_5', status: 'UNKNOWN', anchors: [{ label: 'Nunca', value: '1' }], selected: [], freeText: null, answeredAt: null, revision: 1 },
      { questionId: 'q2', text: 'Qué te entusiasma.', type: 'FREE_TEXT', status: 'ANSWERED', anchors: [], selected: [], freeText: '{"ambit":"Bienestar","answer":"Probar herramientas nuevas","option":"Tecnología"}', answeredAt: null, revision: 1 },
    ] }} alerts={null} error="" vista="respuestas" apartado="direccion" modulo="e-aud-s1" pagina={2} {...quiet} onModule={onModule} />);
    expect(screen.getAllByText('E-AUD-001. Auditoría inicial').length).toBeGreaterThan(0);
    expect(screen.getByText('E-PER-000. Perfil')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Auditoría inicial/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Actividades/ })).toBeTruthy();
    expect(screen.getByText('Estado: No lo sé')).toBeTruthy();
    expect(screen.getByText('Probar herramientas nuevas')).toBeTruthy();
    expect(screen.getByText('Ámbito: Bienestar')).toBeTruthy();
    expect(screen.queryByText(/"answer"/)).toBeNull();
    expect(screen.getByText('Preguntas 31 a 40 de 40')).toBeTruthy();
    await user.type(screen.getByLabelText('Buscar módulo'), 'e-per');
    expect(screen.queryByRole('button', { name: /Auditoría inicial/ })).toBeNull();
    expect(screen.getByText('Pregunta larga de auditoría.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Actividades/ }));
    expect(onModule).toHaveBeenCalledWith('e-per-ikigai');
    const params = new URLSearchParams('vista=respuestas&sessionId=session-1&modulo=e-aud-s1&pagina=4');
    expect(patchRecorridoQuery(params, { modulo: 'e-per-ikigai' })).toContain('pagina=1');
    expect(patchRecorridoQuery(params, { sessionId: 'session-2' })).not.toContain('modulo=');
    expect(patchRecorridoQuery(params, { vista: 'perfil' })).toContain('sessionId=session-1');
  });

  it('keeps the account header when a module fails and retries that module', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<RecorridoView journey={journey()} responses={null} alerts={null} error="" responsesError="No se pudo leer el módulo." onRetryResponses={onRetry} vista="respuestas" apartado="direccion" modulo="e-aud-s1" pagina={1} {...quiet} />);
    expect(screen.getByRole('heading', { name: 'Ana' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Respuestas' })).toBeTruthy();
    expect(screen.getByText('No se pudo leer el módulo.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Reintentar módulo' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('does not paint a page that does not match the requested page', () => {
    render(<RecorridoView journey={journey()} responses={{ module: { slug: 'e-aud-s1', title: 'Auditoría inicial', intro: '' }, page: 2, pageSize: 30, total: 40, items: [{ questionId: 'late', text: 'Página anterior.', type: 'FREE_TEXT', status: 'ANSWERED', anchors: [], selected: [], freeText: 'texto tardío', answeredAt: null, revision: 1 }] }} alerts={null} error="" vista="respuestas" apartado="direccion" modulo="e-aud-s1" pagina={1} {...quiet} />);
    expect(screen.queryByText('texto tardío')).toBeNull();
  });

  it('moves the selected tab with the keyboard', async () => {
    const user = userEvent.setup();
    const onVista = vi.fn();
    render(<RecorridoView journey={journey()} responses={null} alerts={null} error="" vista="resumen" apartado="direccion" modulo={null} pagina={1} {...quiet} onVista={onVista} />);
    screen.getByRole('tab', { name: 'Resumen' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onVista).toHaveBeenCalledWith('respuestas');
  });

  it('keeps a late module page from replacing the selected reader', () => {
    render(<RecorridoView journey={journey()} responses={{ module: { slug: 'otro', title: 'Otra', intro: 'No es este módulo.' }, page: 1, pageSize: 30, total: 1, items: [{ questionId: 'late', text: 'Texto de otra sesión.', type: 'FREE_TEXT', status: 'ANSWERED', anchors: [], selected: [], freeText: 'secreto tardío', answeredAt: null, revision: 1 }] }} alerts={null} error="" vista="respuestas" apartado="direccion" modulo="e-aud-s1" pagina={1} {...quiet} />);
    expect(screen.queryByText('secreto tardío')).toBeNull();
    expect(screen.queryByText('No es este módulo.')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Auditoría inicial' })).toBeTruthy();
  });

  it('separates a recognized scale and keeps an unrecognized stem whole', () => {
    const stem = '¿Mis decisiones diarias reflejan al hombre que digo que quiero llegar a ser?';
    const stored = `${stem}  1 = Casi nunca. 5 = Casi siempre.`;
    const anchors = [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
      { label: '5', value: '5' },
    ];
    const numeric = presentReading({ text: stored, type: 'SCALE_1_5', status: 'ANSWERED', sourceRef: 'formulario-v1:E-AUD-001!R6', anchors, selected: [{ label: '3', value: '3' }], freeText: null });
    expect(numeric.title).toBe(stem);
    expect(numeric.plainTitle).toBe(false);
    expect(numeric.headline).toBe('Respuesta guardada: 3 de 5');
    expect(numeric.lines).toEqual([]);
    expect(numeric.captureText).toBe(stored);
    expect(numeric.marks?.find((mark) => mark.token === '3')?.chosen).toBe(true);

    const labeled = presentReading({
      text: stored,
      type: 'SCALE_1_5',
      status: 'ANSWERED',
      sourceRef: 'formulario-v1:E-AUD-001!R6',
      anchors: anchors.map((anchor) => anchor.value === '2' ? { ...anchor, label: 'Conciencia básica, sin sistema' } : anchor),
      selected: [{ label: 'Conciencia básica, sin sistema', value: '2' }],
      freeText: null,
    });
    expect(labeled.headline).toBe('Respuesta guardada: 2 de 5');
    expect(labeled.lines).toEqual(['Conciencia básica, sin sistema']);
    expect(labeled.longScale).toBe(false);

    const long = presentReading({
      text: '¿Planifico mi semana?',
      type: 'SCALE_1_5',
      status: 'ANSWERED',
      sourceRef: null,
      anchors: [
        { label: 'Solo reacciono; no planifico nada de la semana.', value: '1' },
        { label: '3', value: '3' },
        { label: 'Planifico con claridad y propósito cada semana.', value: '5' },
      ],
      selected: [{ label: '3', value: '3' }],
      freeText: null,
    });
    expect(long.title).toBe('¿Planifico mi semana?');
    expect(long.plainTitle).toBe(true);
    expect(long.limitation).toBe('El texto de captura no separa el enunciado de los anclajes.');
    expect(long.longScale).toBe(true);
    expect(long.headline).toBe('Respuesta guardada: 3 de 3');

    const intact = presentReading({
      text: 'En el punto 1: el plan sigue entero y no es una escala.',
      type: 'FREE_TEXT',
      status: 'ANSWERED',
      sourceRef: 'formulario-v1:E-AUD-001!R6',
      anchors: [],
      selected: [],
      freeText: 'En el punto 1: el plan sigue entero y no es una escala.',
    });
    expect(intact.title).toBe('En el punto 1: el plan sigue entero y no es una escala.');
    expect(intact.plainTitle).toBe(true);
    expect(intact.lines.join(' ')).toContain('1: el plan');

    const zero = presentReading({ text: 'Conteo', type: 'SCALE_1_5', status: 'ANSWERED', anchors: [{ label: '0', value: '0' }, { label: '1', value: '1' }], selected: [{ label: '0', value: '0' }], freeText: null });
    expect(zero.headline).toBe('Respuesta guardada: 0 de 2');
    expect(presentReading({ text: 'Pendiente', type: 'SCALE_1_5', status: 'PENDING', anchors, selected: [], freeText: null }).headline).toBe('Estado: Pendiente');
    expect(presentReading({ text: 'Duda', type: 'SINGLE_CHOICE', status: 'UNKNOWN', anchors: [], selected: [], freeText: null }).headline).toBe('Estado: No lo sé');
    expect(presentReading({ text: 'No aplica', type: 'SINGLE_CHOICE', status: 'NOT_APPLICABLE', anchors: [], selected: [], freeText: null }).headline).toBe('Estado: No aplica');
    expect(presentReading({ text: 'Declina', type: 'SINGLE_CHOICE', status: 'DECLINED', anchors: [], selected: [], freeText: null }).headline).toBe('Estado: Prefiero no responder');

    const many = presentReading({ text: 'Elige', type: 'MULTI_CHOICE', status: 'ANSWERED', anchors: [], selected: [{ label: 'Orden', value: 'a' }, { label: 'Calma', value: 'b' }], freeText: null });
    expect(many.lines).toEqual(['Orden', 'Calma']);
    const unknown = presentReading({ text: 'Nota', type: 'FREE_TEXT', status: 'ANSWERED', anchors: [], selected: [], freeText: '{esto no es json' });
    expect(unknown.lines[0]).toContain('{esto no es json');
    expect(unknown.limitation).toBe('El formato de la respuesta no se reconoce.');
  });
});
