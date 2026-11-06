import { randomUUID } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootApi, loadCompiled } from './journey-http-app';
import { activatePlanBody } from './plan-activation-body';

type Spec =
  | { kind: 'activity'; field: string; ambit: string; option: string; answer: string }
  | { kind: 'choice'; value: string }
  | { kind: 'multi'; values: string[] }
  | { kind: 'text'; value: string };
type Question = {
  id: string;
  sourceRef?: string | null;
  type: string;
  textEs: string;
  allowedExceptions?: string[];
  options: { id: string; value: string; textEs: string }[];
  capture?: { kind: string; field?: string; ambits?: { label: string; options: string[] }[] } | null;
  answerRevision?: number;
};
type Step = { type: string; data?: Question & { moduleSlug?: string } };

const scenario = JSON.parse(readFileSync(resolve(__dirname, 'journey-scenario.json'), 'utf8')) as { version: string; answers: Record<string, Spec> };
const catalog = JSON.parse(readFileSync(resolve(__dirname, '../../../packages/database/definitions/formulario-completo@5.json'), 'utf8')) as {
  modules: { questions: { sourceRef: string; instrument: string }[] }[];
};

process.env.MK_CLOCK_DAY = '2026-10-12';
process.env.MK_TRACE_HTTP = '1';
process.env.MK_TRACE_FILE = resolve(__dirname, 'artifacts/http-trace.jsonl');
mkdirSync(resolve(__dirname, 'artifacts'), { recursive: true });
const clock = {
  get day() { return process.env.MK_CLOCK_DAY ?? '2026-10-12'; },
  set day(value: string) { process.env.MK_CLOCK_DAY = value; },
  today() { return process.env.MK_CLOCK_DAY ?? '2026-10-12'; },
};
const responseHook = { beforeUpsert: async () => undefined as void };

let app: INestApplication;
const shared: { token?: string; userId?: string; planId?: string; actionId?: string; email?: string; password?: string } = {};

function server() {
  return app.getHttpServer();
}

function trace(entry: Record<string, unknown>) {
  appendFileSync(process.env.MK_TRACE_FILE as string, `${JSON.stringify({ at: new Date().toISOString(), caseId: 'journey-http', ...entry })}\n`);
}

function responseFacts(res: { status?: number; res?: { statusCode?: number; httpVersion?: string; rawHeaders?: string[]; socket?: { remoteAddress?: string; remotePort?: number; localPort?: number } | null }; req?: { path?: string; host?: string; protocol?: string } }) {
  const raw = res.res;
  const hasRawMessage = Boolean(raw && typeof raw.statusCode === 'number');
  const listen = server().address();
  return {
    hasRawMessage,
    rawStatus: hasRawMessage ? raw?.statusCode ?? null : null,
    wrapperStatus: typeof res.status === 'number' ? res.status : null,
    httpVersion: raw?.httpVersion ?? null,
    headerNames: Array.isArray(raw?.rawHeaders) ? raw.rawHeaders.filter((_, index) => index % 2 === 0) : [],
    remoteAddress: raw?.socket?.remoteAddress ?? null,
    remotePort: raw?.socket?.remotePort ?? null,
    localPort: raw?.socket?.localPort ?? null,
    listen: listen && typeof listen === 'object' ? { address: listen.address, port: listen.port } : listen,
    url: res.req?.path ?? null,
    host: res.req?.host ?? null,
  };
}

async function call(token: string | null, method: 'get' | 'post' | 'patch', path: string, body?: unknown) {
  const testId = randomUUID();
  const started = Date.now();
  const req = request(server())[method](`/api/v1${path}`).set('Connection', 'close').set('x-mk-test-id', testId).set('Authorization', token ? `Bearer ${token}` : '');
  try {
    const res = body === undefined ? await req : await req.send(body);
    const text = typeof res.text === 'string' ? res.text : '';
    const facts = responseFacts(res);
    trace({
      testId,
      method,
      path,
      ms: Date.now() - started,
      requestId: res.headers['x-request-id'] ?? null,
      seenByServer: Boolean(res.headers['x-request-id']),
      bodyBytes: Buffer.byteLength(text),
      category: !facts.hasRawMessage ? 'wrapper_status' : text.length === 0 ? 'empty_http' : (facts.rawStatus ?? 0) >= 400 ? 'http_error' : 'ok',
      ...facts,
    });
    return res;
  } catch (err) {
    trace({
      testId,
      method,
      path,
      url: req.url,
      ms: Date.now() - started,
      status: null,
      category: 'transport',
      error: err instanceof Error ? err.message : 'unknown',
      code: err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code ?? null : null,
      hasResponse: Boolean(err && typeof err === 'object' && 'response' in err && (err as { response?: unknown }).response),
    });
    throw err;
  }
}

async function register(label: string) {
  const email = `mk.http.${label}.${Date.now()}@fixtures.mk.invalid`;
  const password = 'Recorrido2026';
  const res = await request(server()).post('/api/v1/auth/register').send({ email, password });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return { email, password, token: res.body.accessToken as string, userId: res.body.user.id as string };
}

function payloadFor(question: Question, exceptions: Record<string, string>) {
  const ref = question.sourceRef ?? '';
  const exception = exceptions[ref];
  if (exception) {
    if (!question.allowedExceptions?.includes(exception)) {
      throw new Error(`${ref} no admite ${exception}`);
    }
    return { exceptionKind: exception };
  }
  const spec = scenario.answers[ref];
  if (!spec) throw new Error(`sin escenario para ${ref}`);
  if (spec.kind === 'activity') {
    if (question.capture?.kind !== 'activity' || question.capture.field !== spec.field) {
      throw new Error(`${ref} no ofrece el campo ${spec.field}`);
    }
    const ambit = question.capture.ambits?.find((item) => item.label === spec.ambit);
    if (!ambit) throw new Error(`${ref} no tiene el ámbito ${spec.ambit}`);
    if (!ambit.options.includes(spec.option)) throw new Error(`${ref} no tiene la opción dependiente`);
    if (spec.field === 'profesion' && ambit.label.includes('Creación y Expresión')) {
      throw new Error('profesión recibió un ámbito de pasión');
    }
    return { freeText: JSON.stringify({ ambit: spec.ambit, option: spec.option, answer: spec.answer }) };
  }
  if (spec.kind === 'choice') {
    const option = question.options.find((item) => item.value === spec.value);
    if (!option) throw new Error(`${ref} no tiene la opción ${spec.value}`);
    return { selectedOptionIds: [option.id] };
  }
  if (spec.kind === 'multi') {
    const ids = spec.values.map((value) => {
      const option = question.options.find((item) => item.value === value);
      if (!option) throw new Error(`${ref} no tiene la opción ${value}`);
      return option.id;
    });
    return { selectedOptionIds: ids };
  }
  return { freeText: spec.value };
}

async function walk(token: string, exceptions: Record<string, string>, stopAfter = Number.POSITIVE_INFINITY) {
  const started = await call(token, 'post', '/diagnostic/start', {});
  if (started.status >= 400) throw new Error(`start ${started.status} ${JSON.stringify(started.body)}`);
  let state = started.body;
  if (state.sessionState?.showWelcomeScreen || !state.nextStep) {
    await call(token, 'post', '/diagnostic/welcome-seen', {});
    const loaded = await call(token, 'get', '/diagnostic/state');
    if (loaded.status >= 400) throw new Error(`state ${loaded.status} ${JSON.stringify(loaded.body)}`);
    state = loaded.body;
  }
  const first = state.nextStep?.data?.id as string | undefined;
  let seen = '';
  let repeats = 0;
  let answered = 0;
  for (let step = 0; step < 450; step += 1) {
    const next = state.nextStep as Step;
    if (next?.type === 'diagnostic_complete') return { answered, first };
    if (next?.type === 'module_outro') {
      const res = await call(token, 'post', `/diagnostic/outro-seen/${next.data?.moduleSlug}`, {});
      if (res.status >= 400) throw new Error(`outro ${next.data?.moduleSlug} ${res.status} ${JSON.stringify(res.body)}`);
      state = (await call(token, 'get', '/diagnostic/state')).body;
      continue;
    }
    if (next?.type !== 'question' || !next.data) throw new Error(`paso inesperado ${JSON.stringify(state)?.slice(0, 500)}`);
    if (next.data.id === seen) repeats += 1;
    else { seen = next.data.id; repeats = 0; }
    if (repeats > 1) throw new Error(`sin progreso en ${next.data.sourceRef}`);
    const res = await call(token, 'post', '/diagnostic/response', {
      questionId: next.data.id,
      expectedRevision: next.data.answerRevision ?? 0,
      ...payloadFor(next.data, exceptions),
    });
    if (res.status >= 400) {
      throw new Error(`respuesta ${next.data.sourceRef} ${res.status} ${res.text?.slice(0, 500)}`);
    }
    state = res.body;
    answered += 1;
    if (answered >= stopAfter) return { answered, first, done: false };
  }
  throw new Error('demasiados pasos');
}

function auditExpectation(exceptions: Record<string, string>) {
  let sum = 0;
  let answered = 0;
  for (const mod of catalog.modules) {
    for (const question of mod.questions) {
      if (question.instrument !== 'audit') continue;
      if (exceptions[question.sourceRef]) continue;
      const spec = scenario.answers[question.sourceRef];
      if (!spec || spec.kind !== 'choice') throw new Error(`auditoría sin ancla ${question.sourceRef}`);
      sum += Number(spec.value);
      answered += 1;
    }
  }
  return { sum, answered, required: 23 };
}

beforeAll(async () => {
  app = await bootApi({ clock, responseHook });
});

afterAll(async () => {
  await app?.close();
});

describe('recorrido HTTP A', () => {
  it('closes a new account on the active catalog and keeps a future change', async () => {
    const account = await register('a');
    const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    const started = await call(account.token, 'post', '/diagnostic/start', {});
    expect(started.status).toBeLessThan(400);
    const session = await prisma.diagnosticSession.findFirst({
      where: { userId: account.userId },
      include: { version: true },
    });
    expect(session?.version.version).toBe('formulario-completo@6');
    expect(session?.version.isActive).toBe(true);

    const partial = await walk(account.token, {}, 3);
    const paused = await call(account.token, 'get', '/diagnostic/state');
    const earlyQuestion = paused.body.nextStep?.data?.id as string | undefined;
    expect(earlyQuestion).not.toBe(partial.first);
    await request(server()).post('/api/v1/auth/logout').set('Authorization', `Bearer ${account.token}`);
    const logged = await request(server()).post('/api/v1/auth/login').send({ email: account.email, password: account.password });
    expect(logged.status).toBeLessThan(400);
    const token = logged.body.accessToken as string;
    const resumed = await call(token, 'get', '/diagnostic/state');
    expect(resumed.body.nextStep.data.id).toBe(earlyQuestion);
    const walked = await walk(token, {});
    expect(walked.answered + partial.answered).toBeGreaterThan(200);

    const state = await call(token, 'get', '/journey/state');
    const expected = auditExpectation({});
    expect(expected.answered).toBe(expected.required);
    expect(state.body.form.auditTotal).toBe(expected.sum);
    expect(state.body.form.auditCoverage).toEqual({ answered: 23, required: 23 });
    expect(state.body.indexes.alignment.methodVersion).toBe('ia-mk-cuest@0.1');
    expect(state.body.indexes.alignment.coverage).toEqual({ eligible: 20, required: 20 });
    expect(state.body.indexes.alignment.general).not.toBeNull();
    expect(state.body.indexes.depth.name).toBe('Índice de profundidad MK');
    const alignmentIndex = state.body.indexes.alignment.general;

    const synthesis = await call(token, 'get', '/journey/synthesis');
    const activities = synthesis.body.activities as { sourceRef: string; field: string; answer: string }[];
    const fields = new Set(activities.map((item) => item.field));
    expect(fields).toEqual(new Set(['pasion', 'vocacion', 'mision', 'profesion']));
    const passion = activities.find((item) => item.field === 'pasion');
    const profession = activities.find((item) => item.field === 'profesion');
    if (!passion || !profession) throw new Error('faltan actividades de pasión o profesión');
    const saved = await call(token, 'post', '/journey/synthesis', {
      activities,
      combinations: [
        { id: 'c1', reason: 'Primera', valuation: 'PARTIAL', valuationReason: 'Aún no', experiment: '' },
        { id: 'c2', reason: 'Segunda', valuation: null, valuationReason: '', experiment: 'Probar una conversación' },
      ],
      links: [
        { id: 'l1', fromRef: passion.sourceRef, toRef: profession.sourceRef, combinationId: 'c1', reason: 'Misma persona', status: 'ACTIVE' },
        { id: 'l2', fromRef: passion.sourceRef, toRef: profession.sourceRef, combinationId: 'c2', reason: 'Otra hipótesis', status: 'ACTIVE' },
      ],
      purpose: {
        status: 'PROVISIONAL',
        parts: { pasion: passion.sourceRef, profesion: profession.sourceRef },
        edited: 'Quiero probar escribir para equipos.',
      },
    });
    expect(saved.status, JSON.stringify(saved.body)).toBeLessThan(400);
    expect(saved.body.purpose.edited).toBe('Quiero probar escribir para equipos.');
    expect(saved.body.links).toHaveLength(2);
    await call(token, 'post', '/journey/purpose', { content: { directionStatus: 'PROVISIONAL', statement: 'Quiero probar escribir para equipos.' } });

    const plan = await call(token, 'post', '/journey/plans', {
      title: 'Un ensayo usable',
      outcome: 'Hay un texto que otra persona puede leer.',
      priorityNote: 'Esta semana escribo un párrafo porque quiero claridad mental.',
      linkKind: 'DIRECT',
      valueRef: 'Claridad mental',
      purposeRevisionId: saved.body.purposeRevisionId,
    });
    expect(plan.status, JSON.stringify(plan.body)).toBeLessThan(400);
    const action = await call(token, 'post', `/journey/plans/${plan.body.id}/actions`, {
      title: 'Escribir el ensayo',
      doneWhen: 'Hay un párrafo leíble.',
      weekday: 1,
    });
    expect(action.status, JSON.stringify(action.body)).toBeLessThan(400);
    const activated = await call(token, 'patch', `/journey/plans/${plan.body.id}`, activatePlanBody());
    expect(activated.status, JSON.stringify(activated.body)).toBeLessThan(400);

    const firstOccasions = await call(token, 'get', '/journey/calendar');
    const secondOccasions = await call(token, 'get', '/journey/calendar');
    expect(secondOccasions.body.occasions).toEqual(firstOccasions.body.occasions);
    const days = firstOccasions.body.occasions[0].days as string[];
    expect(new Set(days).size).toBe(days.length);
    expect(days.length).toBeGreaterThan(1);

    const past = '2026-10-05';
    const recorded = await call(token, 'post', '/journey/records', {
      actionId: action.body.id,
      day: past,
      status: 'DONE',
      resultNote: 'El párrafo quedó escrito.',
    });
    expect(recorded.status).toBeLessThan(400);
    const pastWeek = '2026-10-05';
    const kept = await call(token, 'post', '/journey/weeks/close', { weekStart: pastWeek, decisions: { [action.body.id]: 'KEEP' } });
    expect(kept.status).toBeLessThan(400);

    const preview = await call(token, 'post', '/journey/weeks/preview', {
      weekStart: '2026-10-12',
      decisions: { [action.body.id]: 'REDUCE' },
      revisions: { [action.body.id]: { intervalDays: 14, weekday: 3 } },
    });
    expect(preview.status, JSON.stringify(preview.body)).toBeLessThan(400);
    expect(preview.body.effects[0].summary).toContain('El criterio sigue');
    expect(preview.body.effects[0].summary).toContain('14');
    const applied = await call(token, 'post', '/journey/weeks/close', {
      weekStart: '2026-10-12',
      decisions: { [action.body.id]: 'REDUCE' },
      revisions: { [action.body.id]: { intervalDays: 14, weekday: 3 } },
    });
    expect(applied.status).toBeLessThan(400);
    const retry = await call(token, 'post', '/journey/weeks/close', {
      weekStart: '2026-10-12',
      decisions: { [action.body.id]: 'CLOSE' },
    });
    expect(retry.status).toBe(409);
    expect(retry.body.code).toBe('STALE_REVIEW');

    const after = await call(token, 'get', '/journey/calendar');
    const updated = after.body.plans.flatMap((item: { actions: { id: string; weekday: number; intervalDays: number; doneWhen: string }[] }) => item.actions).find((item: { id: string }) => item.id === action.body.id);
    expect(updated.weekday).toBe(3);
    expect(updated.intervalDays).toBe(14);
    expect(updated.doneWhen).toBe('Hay un párrafo leíble.');
    const record = await prisma.actionRecord.findFirst({ where: { actionId: action.body.id, day: past } });
    expect(record?.status).toBe('DONE');
    expect(record?.resultNote).toBe('El párrafo quedó escrito.');

    const answers = Object.fromEntries(['E1', 'E2', 'E3', 'M1', 'M2', 'M3', 'C1', 'C2', 'C3'].map((id) => [id, { value: id.startsWith('E') ? 5 : 1, unknown: false }]));
    const alignment = await call(token, 'post', '/journey/alignment', { answers });
    expect(alignment.status).toBeLessThan(400);
    const beforeReview = (await call(token, 'get', '/journey/state')).body.alignment;
    clock.day = '2026-10-19';
    await call(token, 'post', '/journey/weeks/close', { weekStart: '2026-10-19', decisions: { [action.body.id]: 'KEEP' } });
    const afterReview = (await call(token, 'get', '/journey/state')).body.alignment;
    expect(afterReview.total).toBe(beforeReview.total);
    expect(afterReview.savedAt).toBe(beforeReview.savedAt);
    expect((await call(token, 'get', '/journey/state')).body.indexes.alignment.general).toBe(alignmentIndex);

    const fresh = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    const planRow = await fresh.personalPlan.findFirst({ where: { userId: account.userId } });
    expect(planRow?.linkKind).toBe('DIRECT');
    expect(planRow?.valueRef).toBe('Claridad mental');
    expect(planRow?.purposeRevisionId).toBe(saved.body.purposeRevisionId);
    await fresh.$disconnect();
    shared.token = token;
    shared.userId = account.userId;
    shared.planId = plan.body.id;
    shared.actionId = action.body.id;
    shared.email = account.email;
    shared.password = account.password;
    await prisma.$disconnect();
  });
});

describe('recorrido HTTP B', () => {
  it('keeps a partial reading and an experiment without a finished purpose', async () => {
    const account = await register('b');
    const exceptions = {
      'formulario-v1:E-AUD-001!R6': 'UNKNOWN',
      'formulario-v1:F-RAD-001!R20': 'UNKNOWN',
      'formulario-v1:E-PER-000!R221': 'NOT_APPLICABLE',
    };
    await walk(account.token, exceptions);
    const state = await call(account.token, 'get', '/journey/state');
    expect(state.body.form.auditTotal).toBeNull();
    expect(state.body.form.auditCoverage).toEqual({ answered: 22, required: 23 });
    const detail = await app.getHttpServer();
    void detail;
    const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    const pending = await prisma.response.findFirst({
      where: { session: { userId: account.userId }, question: { sourceRef: 'formulario-v1:F-RAD-001!R21' } },
    });
    if (pending) {
      expect(pending.exceptionKind).toBe('PENDING');
      expect(pending.freeText).toBeNull();
    }

    const synthesis = await call(account.token, 'get', '/journey/synthesis');
    const activities = (synthesis.body.activities as { sourceRef: string; field: string }[]).filter((item) => item.field === 'pasion');
    expect(activities.length).toBeGreaterThan(0);
    expect((synthesis.body.activities as { field: string }[]).some((item) => item.field === 'profesion' && item.sourceRef.endsWith('R241'))).toBe(true);
    const saved = await call(account.token, 'post', '/journey/synthesis', {
      activities: synthesis.body.activities,
      combinations: [{ id: 'h1', reason: 'Hipótesis', valuation: 'INSUFFICIENT', valuationReason: 'Falta información', experiment: 'Caminar diez minutos' }],
      links: [],
      purpose: { status: 'EXPLORANDO', parts: {}, edited: '' },
    });
    expect(saved.status, JSON.stringify(saved.body)).toBeLessThan(400);
    expect(saved.body.purpose.generated ?? '').not.toContain('Mi propósito es poner');
    await call(account.token, 'post', '/journey/purpose', { content: { directionStatus: 'EXPLORANDO' } });
    const plan = await call(account.token, 'post', '/journey/plans', {
      title: 'Probar un cuidado',
      outcome: 'Anoté qué ocurrió.',
      priorityNote: 'Cuidado de diez minutos.',
      linkKind: 'PROTECTIVE',
    });
    expect(plan.status, JSON.stringify(plan.body)).toBeLessThan(400);
    const action = await call(account.token, 'post', `/journey/plans/${plan.body.id}/actions`, {
      title: 'Caminar diez minutos',
      doneWhen: 'Salí y volví.',
      weekday: 1,
    });
    expect(action.status).toBeLessThan(400);
    expect((await call(account.token, 'patch', `/journey/plans/${plan.body.id}`, activatePlanBody())).status).toBeLessThan(400);
    await call(account.token, 'post', '/journey/records', {
      actionId: action.body.id,
      day: '2026-10-12',
      status: 'DONE',
      resultNote: 'El ánimo no cambió.',
    });
    const replaced = await call(account.token, 'post', '/journey/weeks/close', {
      weekStart: '2026-10-12',
      decisions: { [action.body.id]: 'SUBSTITUTE' },
      revisions: { [action.body.id]: { title: 'Sentarme cinco minutos' } },
    });
    expect(replaced.status, JSON.stringify(replaced.body)).toBeLessThan(400);
    const calendar = await call(account.token, 'get', '/journey/calendar');
    const titles = calendar.body.plans.flatMap((item: { actions: { title: string; active: boolean }[] }) => item.actions);
    expect(titles.some((item: { title: string; active: boolean }) => item.title === 'Sentarme cinco minutos' && item.active !== false)).toBe(true);
    expect(titles.filter((item: { title: string; active: boolean }) => item.active !== false && item.title === 'Caminar diez minutos')).toHaveLength(0);
    await prisma.$disconnect();
  });
});

describe('concurrency and guards', () => {
  it('rejects a foreign plan and a repeated close, and rolls back a failed apply', async () => {
    if (!shared.token || !shared.planId || !shared.userId || !shared.actionId) throw new Error('el recorrido A no dejó una cuenta');
    const owner = { token: shared.token, userId: shared.userId };
    const other = await register('other');
    await call(other.token, 'post', '/diagnostic/start', {});
    const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    const plan = { body: { id: shared.planId }, status: 201 };
    const foreign = await call(other.token, 'post', `/journey/plans/${plan.body.id}/actions`, { title: 'Ajena', doneWhen: 'No' });
    expect(foreign.status).toBe(404);
    const blocked = await call(owner.token, 'post', `/journey/plans/${plan.body.id}/actions`, {
      title: 'Invertir',
      doneWhen: 'No',
      contentTags: ['INVESTMENT'],
    });
    expect(blocked.status).toBe(403);
    const allowed = await call(owner.token, 'post', `/journey/plans/${plan.body.id}/actions`, {
      title: 'Conversar',
      doneWhen: 'Hay un pedido.',
      weekday: 1,
      contentTags: ['CONFRONTATION'],
      conversation: 'VIABLE',
    });
    expect(allowed.status, JSON.stringify(allowed.body)).toBeLessThan(400);
    expect(allowed.body.contentTags).toEqual(['CONFRONTATION']);
    const patched = await call(owner.token, 'patch', `/journey/actions/${allowed.body.id}`, { title: 'Conversar el martes' });
    expect(patched.body.contentTags).toEqual(['CONFRONTATION']);
    expect(patched.body.conversationOutcome).toBe('VIABLE');

    const alignmentBefore = (await call(owner.token, 'get', '/journey/state')).body.alignment;
    const purposeBefore = await call(owner.token, 'get', '/journey/purpose');
    const revisedLink = await call(owner.token, 'patch', `/journey/plans/${shared.planId}`, {
      valueRef: 'Cuidado del tiempo',
      linkKind: 'ENABLING',
    });
    expect(revisedLink.status, JSON.stringify(revisedLink.body)).toBeLessThan(400);
    expect(revisedLink.body.valueRef).toBe('Cuidado del tiempo');
    expect(revisedLink.body.linkKind).toBe('ENABLING');
    const alignmentAfterLink = (await call(owner.token, 'get', '/journey/state')).body.alignment;
    expect(alignmentAfterLink.total).toBe(alignmentBefore.total);
    expect(alignmentAfterLink.savedAt).toBe(alignmentBefore.savedAt);
    const purposeAfter = await call(owner.token, 'get', '/journey/purpose');
    expect(purposeAfter.body.id).toBe(purposeBefore.body.id);
    expect(purposeAfter.body.content?.iad?.savedAt).toBe(purposeBefore.body.content?.iad?.savedAt);

    clock.day = '2026-10-26';
    const probe = await call(owner.token, 'get', '/journey/calendar');
    expect(probe.body.today, 'el reloj de la aplicación de prueba').toBe('2026-10-26');
    const nextOutcome = 'Un párrafo que otra persona puede usar.';
    const outcomeClose = await call(owner.token, 'post', '/journey/weeks/close', {
      weekStart: '2026-10-26',
      outcomes: { [shared.planId as string]: nextOutcome },
    });
    expect(outcomeClose.status, JSON.stringify(outcomeClose.body)).toBeLessThan(400);
    expect(outcomeClose.body.snapshot.plans[0].outcome).toBe('Hay un texto que otra persona puede leer.');
    expect(outcomeClose.body.snapshot.outcomeChanges[0].next).toBe(nextOutcome);
    expect((await prisma.personalPlan.findUnique({ where: { id: shared.planId } }))?.outcome).toBe(nextOutcome);
    expect((await call(owner.token, 'get', '/journey/state')).body.alignment.savedAt).toBe(alignmentBefore.savedAt);

    process.env.MK_WEEK_HOOK = 'throw';
    clock.day = '2026-11-02';
    const failed = await call(owner.token, 'post', '/journey/weeks/close', {
      weekStart: '2026-11-02',
      decisions: { [allowed.body.id]: 'PAUSE' },
    });
    expect(failed.status).toBeGreaterThanOrEqual(400);
    const unchanged = await prisma.planAction.findUnique({ where: { id: allowed.body.id } });
    expect(unchanged?.pausedAt).toBeNull();
    expect(await prisma.weekReview.count({ where: { userId: owner.userId, weekStart: '2026-11-02' } })).toBe(0);
    delete process.env.MK_WEEK_HOOK;
    (await loadCompiled<{ resetWeekHookForTests: () => void }>('journey/journey-clock.js')).resetWeekHookForTests();
    process.env.MK_WEEK_HOOK = 'race';
    const [firstClose, secondClose] = await Promise.all([
      call(owner.token, 'post', '/journey/weeks/close', { weekStart: '2026-11-02', decisions: { [shared.actionId as string]: 'KEEP' } }),
      call(owner.token, 'post', '/journey/weeks/close', { weekStart: '2026-11-02', decisions: { [shared.actionId as string]: 'KEEP' } }),
    ]);
    delete process.env.MK_WEEK_HOOK;
    expect(firstClose.status, JSON.stringify(firstClose.body)).toBeLessThan(400);
    expect(secondClose.status, JSON.stringify(secondClose.body)).toBeLessThan(400);
    expect(firstClose.body.id).toBe(secondClose.body.id);
    expect(await prisma.weekReview.count({ where: { userId: owner.userId, weekStart: '2026-11-02' } })).toBe(1);
    expect(await prisma.planAction.count({ where: { planId: shared.planId, title: 'Escribir el ensayo' } })).toBe(1);

    clock.day = '2026-11-09';
    const paused = await call(owner.token, 'post', '/journey/weeks/close', {
      weekStart: '2026-11-09',
      decisions: { [allowed.body.id]: 'PAUSE' },
    });
    expect(paused.status, JSON.stringify(paused.body)).toBeLessThan(400);
    expect((await prisma.planAction.findUnique({ where: { id: allowed.body.id } }))?.pausedAt).not.toBeNull();
    expect((await prisma.planAction.findUnique({ where: { id: allowed.body.id } }))?.doneWhen).toBe('Hay un pedido.');
    clock.day = '2026-11-16';
    const resumed = await call(owner.token, 'post', '/journey/weeks/close', {
      weekStart: '2026-11-16',
      decisions: { [allowed.body.id]: 'RESUME' },
    });
    expect(resumed.status, JSON.stringify(resumed.body)).toBeLessThan(400);
    const resumedRow = await prisma.planAction.findUnique({ where: { id: allowed.body.id } });
    expect(resumedRow?.pausedAt).toBeNull();
    expect(resumedRow?.doneWhen).toBe('Hay un pedido.');
    expect(resumedRow?.active).toBe(true);

    const physical = await call(owner.token, 'post', `/journey/plans/${shared.planId}/actions`, {
      title: 'Cargar cajas',
      doneWhen: 'Las moví.',
      weekday: 2,
      contentTags: ['PHYSICAL_EXERTION'],
      healthLimit: 'NO_CURRENT_LIMIT',
    });
    expect(physical.status, JSON.stringify(physical.body)).toBeLessThan(400);
    const limited = await call(owner.token, 'post', `/journey/plans/${shared.planId}/actions`, {
      title: 'Otra carga',
      doneWhen: 'No.',
      contentTags: ['PHYSICAL_EXERTION'],
      healthLimit: 'CURRENT_LIMIT',
    });
    expect(limited.status).toBe(403);
    clock.day = '2026-11-23';
    const refusedWeek = await call(owner.token, 'post', '/journey/weeks/close', {
      weekStart: '2026-11-23',
      decisions: { [physical.body.id]: 'KEEP' },
    });
    expect(refusedWeek.status).toBe(403);
    expect(await prisma.weekReview.count({ where: { userId: owner.userId, weekStart: '2026-11-23' } })).toBe(0);
    expect((await prisma.planAction.findUnique({ where: { id: physical.body.id } }))?.active).toBe(true);

    const gate: { release?: () => void; pending: Promise<void> } = { pending: Promise.resolve() };
    let entered = 0;
    responseHook.beforeUpsert = async () => {
      entered += 1;
      if (entered === 1) {
        gate.pending = new Promise<void>((resolve) => { gate.release = resolve; });
        await gate.pending;
      } else {
        gate.release?.();
      }
    };
    const question = await prisma.question.findFirst({ where: { module: { version: { version: 'formulario-completo@5' } }, type: 'SCALE_1_5' } });
    if (!question) throw new Error('sin pregunta');
    const option = await prisma.answerOption.findFirst({ where: { questionId: question.id, value: '3' } });
    const session = await prisma.diagnosticSession.findFirst({ where: { userId: other.userId, status: 'ACTIVE' } })
      ?? await prisma.diagnosticSession.create({ data: { userId: other.userId, versionId: (await prisma.diagnosticVersion.findFirstOrThrow({ where: { version: 'formulario-completo@5' } })).id, status: 'ACTIVE' } });
    const body = { questionId: question.id, selectedOptionIds: [option?.id], expectedRevision: 0 };
    const [left, right] = await Promise.all([
      call(other.token, 'post', '/diagnostic/response', body),
      call(other.token, 'post', '/diagnostic/response', body),
    ]);
    const statuses = [left.status, right.status].sort();
    expect(statuses).toContain(409);
    expect(await prisma.response.count({ where: { sessionId: session.id, questionId: question.id } })).toBe(1);
    responseHook.beforeUpsert = async () => undefined;
    await prisma.$disconnect();
    await app.close();
    app = await bootApi({ clock, responseHook });
    const again = await request(server()).post('/api/v1/auth/login').send({ email: shared.email, password: shared.password });
    const restored = await call(again.body.accessToken, 'get', '/journey/calendar');
    expect(restored.body.plans[0].actions.some((item: { doneWhen: string }) => item.doneWhen === 'Hay un párrafo leíble.')).toBe(true);
  });
});

describe('published catalog compatibility', () => {
  it('reads a formulario-completo@4 session without rewriting its answers or questions', async () => {
    const account = await register('hist');
    const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    const published = await prisma.diagnosticVersion.findUniqueOrThrow({ where: { version: 'formulario-completo@4' } });
    const active = await prisma.diagnosticVersion.findFirstOrThrow({ where: { isActive: true } });
    expect(published.isActive).toBe(false);
    expect(active.version).toBe('formulario-completo@6');
    const question = await prisma.question.findFirstOrThrow({
      where: { sourceRef: 'formulario-v1:E-PER-000!R241', module: { versionId: published.id, slug: 'e-per-ikigai' } },
    });
    expect(question.contextEs).toBe('@actividad:pasion');
    const stored = JSON.stringify({
      ambit: 'Creación y Expresión',
      option: 'Escribir',
      answer: 'Ensayo histórico de profesión',
    });
    const session = await prisma.diagnosticSession.create({
      data: {
        userId: account.userId,
        versionId: published.id,
        status: 'COMPLETED',
        completedAt: new Date('2026-10-01T15:00:00.000Z'),
        metadata: {},
      },
    });
    const response = await prisma.response.create({
      data: {
        sessionId: session.id,
        questionId: question.id,
        freeText: stored,
        selectedOptionIds: [],
        rankingOrder: [],
      },
    });
    const reading = await call(account.token, 'get', '/journey/synthesis');
    expect(reading.status, JSON.stringify(reading.body)).toBeLessThan(400);
    const activity = (reading.body.activities as { sourceRef: string; field: string; answer: string; fieldReview?: string | null }[])
      .find((item) => item.sourceRef === question.sourceRef);
    expect(activity?.answer).toBe('Ensayo histórico de profesión');
    expect(activity?.field).toBe('pasion');
    expect(activity?.fieldReview ?? '').toContain('pasion');
    expect(activity?.fieldReview ?? '').toContain('profesion');
    expect((await prisma.response.findUniqueOrThrow({ where: { id: response.id } })).freeText).toBe(stored);
    expect((await prisma.question.findUniqueOrThrow({ where: { id: question.id } })).contextEs).toBe('@actividad:pasion');
    const fresh = await register('hist-new');
    const started = await call(fresh.token, 'post', '/diagnostic/start', {});
    expect(started.status).toBeLessThan(400);
    const opened = await prisma.diagnosticSession.findFirstOrThrow({
      where: { userId: fresh.userId, status: 'ACTIVE' },
      include: { version: true },
    });
    expect(opened.version.version).toBe('formulario-completo@6');
    expect(opened.versionId).not.toBe(published.id);
    await prisma.$disconnect();
  });
});

