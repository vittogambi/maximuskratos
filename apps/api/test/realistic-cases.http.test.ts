import { randomUUID } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootApi } from './journey-http-app';

type Spec = { kind: 'activity'; field: string; ambit: string; option: string; answer: string } | { kind: 'choice'; value: string } | { kind: 'text'; value: string };
type Question = {
  id: string;
  sourceRef?: string | null;
  type: string;
  allowedExceptions?: string[];
  options: { id: string; value: string; textEs: string }[];
  capture?: { kind: string; field?: string; ambits?: { label: string; options: string[] }[] } | null;
  answerRevision?: number;
};
type Step = { type: string; data?: Question & { moduleSlug?: string } };
type CaseFile = {
  cases: Array<{
    id: string;
    context: Record<string, unknown>;
    user_goal: string;
    must_not: string[];
    core_answers: Record<string, number | null>;
    core_exceptions: Record<string, string>;
    capture: { mode: string };
    weeks: Array<{ step: number; expect: string }>;
  }>;
  mutations: Array<{ id: string; base: string; change: string; expect: string }>;
};
type RefFile = { tolerance: number; cases: Array<{ case_id: string; initial: { general: number | null; pillars: { E: number | null; M: number | null; C: number | null } } }> };

const pack = JSON.parse(readFileSync(resolve(__dirname, 'fixtures/casos-realistas/casos.json'), 'utf8')) as CaseFile;
const reference = JSON.parse(readFileSync(resolve(__dirname, 'fixtures/casos-realistas/referencia_indices.json'), 'utf8')) as RefFile;
const scenario = JSON.parse(readFileSync(resolve(__dirname, 'journey-scenario.json'), 'utf8')) as { answers: Record<string, Spec> };

process.env.MK_CLOCK_DAY = '2026-10-12';
const clock = {
  today() { return process.env.MK_CLOCK_DAY ?? '2026-10-12'; },
};
const responseHook = { beforeUpsert: async () => undefined as void };
let app: INestApplication;
const accounts = new Map<string, { token: string; userId: string; general: number | null }>();
const observed: Record<string, unknown> = {};
process.env.MK_TRACE_HTTP = '1';
process.env.MK_TRACE_FILE = resolve(__dirname, 'artifacts/http-trace.jsonl');
mkdirSync(resolve(__dirname, 'artifacts'), { recursive: true });
let activeCase = 'boot';
let traceStep = 0;
let pendingIds: { questionId?: string; sourceRef?: string; moduleSlug?: string; sessionId?: string } = {};

function server() { return app.getHttpServer(); }

function trace(entry: Record<string, unknown>) {
  appendFileSync(process.env.MK_TRACE_FILE as string, `${JSON.stringify({ at: new Date().toISOString(), caseId: activeCase, ...entry })}\n`);
}

function responseFacts(res: { status?: number; res?: { statusCode?: number; httpVersion?: string; rawHeaders?: string[]; socket?: { remoteAddress?: string; remotePort?: number; localPort?: number } | null }; req?: { path?: string; host?: string; protocol?: string } }) {
  const raw = res.res;
  const hasRawMessage = Boolean(raw && typeof raw.statusCode === 'number');
  const socket = raw?.socket ?? null;
  const listen = server().address();
  return {
    hasRawMessage,
    rawStatus: hasRawMessage ? raw?.statusCode ?? null : null,
    wrapperStatus: typeof res.status === 'number' ? res.status : null,
    httpVersion: raw?.httpVersion ?? null,
    headerNames: Array.isArray(raw?.rawHeaders) ? raw.rawHeaders.filter((_, index) => index % 2 === 0) : [],
    remoteAddress: socket?.remoteAddress ?? null,
    remotePort: socket?.remotePort ?? null,
    localPort: socket?.localPort ?? null,
    listen: listen && typeof listen === 'object' ? { address: listen.address, port: listen.port } : listen,
    url: res.req?.path ?? null,
    host: res.req?.host ?? null,
    protocol: res.req?.protocol ?? null,
  };
}

async function call(token: string | null, method: 'get' | 'post' | 'patch', path: string, body?: unknown) {
  const step = traceStep;
  traceStep += 1;
  const ids = pendingIds;
  pendingIds = {};
  const testId = randomUUID();
  const started = Date.now();
  const req = request(server())[method](`/api/v1${path}`).set('Connection', 'close').set('x-mk-test-id', testId).set('Authorization', token ? `Bearer ${token}` : '');
  try {
    const res = body === undefined ? await req : await req.send(body);
    const text = typeof res.text === 'string' ? res.text : '';
    const facts = responseFacts(res);
    const contentType = String(res.headers['content-type'] ?? '');
    let category = 'ok';
    if (!facts.hasRawMessage) category = 'wrapper_status';
    else if (!text) category = 'empty_http';
    else if ((facts.rawStatus ?? 0) >= 400) category = 'http_error';
    else if (text && !contentType.includes('json') && !text.startsWith('{') && !text.startsWith('[')) category = 'non_json';
    trace({
      step,
      testId,
      method,
      path,
      requestId: res.headers['x-request-id'] ?? null,
      seenByServer: Boolean(res.headers['x-request-id']),
      status: facts.rawStatus,
      ms: Date.now() - started,
      contentType,
      bodyBytes: Buffer.byteLength(text),
      category,
      ...facts,
      ...ids,
    });
    return res;
  } catch (err) {
    const response = err && typeof err === 'object' && 'response' in err ? (err as { response?: unknown }).response : null;
    trace({
      step,
      testId,
      method,
      path,
      status: null,
      wrapperStatus: err && typeof err === 'object' && 'status' in err ? (err as { status?: number }).status ?? null : null,
      ms: Date.now() - started,
      category: 'transport',
      url: req.url,
      error: err instanceof Error ? err.message : 'unknown',
      code: err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code ?? null : null,
      hasResponse: Boolean(response),
      ...ids,
    });
    throw err;
  }
}

function sourceRef(key: string): string {
  const [sheet, row] = key.split('!row=');
  return `formulario-v1:${sheet}!R${row}`;
}

function directionOf(raw: string): string {
  if (raw === 'CONFIRMADA') return 'CONFIRMADO_POR_USUARIO';
  return raw;
}

function overridesFor(item: CaseFile['cases'][number]): Record<string, string> {
  const exceptions: Record<string, string> = {};
  for (const [key, kind] of Object.entries(item.core_exceptions)) exceptions[sourceRef(key)] = kind;
  if (item.context.beliefs === 'DECLINED') exceptions['formulario-v1:E-AUD-001!R65'] = 'DECLINED';
  if (item.context.partner === 'NOT_APPLICABLE') {
    for (const ref of ['R6', 'R7', 'R8']) exceptions[`formulario-v1:F-RAD-002!${ref}`] = 'NOT_APPLICABLE';
  }
  if (item.context.lineage === 'PARTLY_UNKNOWN') {
    for (const ref of ['R7', 'R8', 'R9', 'R10', 'R12', 'R13', 'R14', 'R15', 'R17', 'R18', 'R19', 'R20', 'R22', 'R23']) {
      exceptions[`formulario-v1:E-PER-000!${ref}`] = 'UNKNOWN';
    }
  }
  for (const ref of ['R46', 'R47', 'R48']) exceptions[`formulario-v1:F-RAD-003!${ref}`] = 'DECLINED';
  return exceptions;
}

function choiceOverrides(item: CaseFile['cases'][number]): Record<string, string> {
  const choices: Record<string, string> = {};
  for (const [key, value] of Object.entries(item.core_answers)) {
    if (value == null) continue;
    choices[sourceRef(key)] = String(value);
  }
  const health = item.context.health_limit;
  if (health === 'CURRENT_RESTRICTION') choices['formulario-v1:F-RAD-001!R27'] = 'Sí';
  if (health === 'NONE_DECLARED') choices['formulario-v1:F-RAD-001!R27'] = 'No';
  return choices;
}

function payloadFor(question: Question, item: CaseFile['cases'][number]) {
  const ref = question.sourceRef ?? '';
  const exception = overridesFor(item)[ref];
  if (exception) {
    if (!question.allowedExceptions?.includes(exception)) throw new Error(`${ref} no admite ${exception}`);
    return { exceptionKind: exception };
  }
  const forced = choiceOverrides(item)[ref];
  if (forced) {
    const option = question.options.find((row) => row.value === forced);
    if (!option) throw new Error(`${ref} no tiene el valor ${forced}`);
    return { selectedOptionIds: [option.id] };
  }
  const spec = scenario.answers[ref];
  if (!spec) throw new Error(`sin supuesto para ${ref}`);
  if (spec.kind === 'activity') {
    return { freeText: JSON.stringify({ ambit: spec.ambit, option: spec.option, answer: spec.answer }) };
  }
  if (spec.kind === 'choice') {
    const option = question.options.find((row) => row.value === spec.value);
    if (!option) throw new Error(`${ref} no tiene la opción ${spec.value}`);
    return { selectedOptionIds: [option.id] };
  }
  return { freeText: spec.value };
}

async function walk(token: string, item: CaseFile['cases'][number]) {
  const started = await call(token, 'post', '/diagnostic/start', {});
  if (started.status >= 400) throw new Error(`start ${started.status} ${JSON.stringify(started.body)}`);
  let state = started.body;
  if (state.sessionState?.showWelcomeScreen || !state.nextStep) {
    await call(token, 'post', '/diagnostic/welcome-seen', {});
    const loaded = await call(token, 'get', '/diagnostic/state');
    if (loaded.status >= 400 || !loaded.text) {
      throw new Error(`estado ${loaded.status || 'sin status'} categoria=${loaded.text ? 'http_error' : 'empty_body'}`);
    }
    state = loaded.body;
  }
  let seen = '';
  let repeats = 0;
  for (let step = 0; step < 450; step += 1) {
    const next = state.nextStep as Step;
    if (next?.type === 'diagnostic_complete') return;
    if (next?.type === 'module_outro') {
      const res = await call(token, 'post', `/diagnostic/outro-seen/${next.data?.moduleSlug}`, {});
      if (res.status >= 400) throw new Error(`outro ${res.status}`);
      const loaded = await call(token, 'get', '/diagnostic/state');
      if (loaded.status >= 400 || !loaded.text) {
        throw new Error(`estado ${loaded.status || 'sin status'} categoria=${loaded.text ? 'http_error' : 'empty_body'}`);
      }
      state = loaded.body;
      continue;
    }
    if (next?.type !== 'question' || !next.data) {
      throw new Error(`paso tipo=${next?.type ?? 'sin'} cuerpo=${JSON.stringify(state).slice(0, 500)}`);
    }
    if (next.data.id === seen) repeats += 1;
    else { seen = next.data.id; repeats = 0; }
    if (repeats > 1) throw new Error(`sin progreso en ${next.data.sourceRef}`);
    const sent = {
      questionId: next.data.id,
      expectedRevision: next.data.answerRevision ?? 0,
      ...payloadFor(next.data, item),
    };
    pendingIds = { questionId: next.data.id, sourceRef: next.data.sourceRef ?? undefined, moduleSlug: next.data.moduleSlug, sessionId: state.session?.id };
    const res = await call(token, 'post', '/diagnostic/response', sent);
    if (res.status >= 400) {
      const probe = await request(server()).get('/api/v1/diagnostic/state').set('Authorization', `Bearer ${token}`);
      throw new Error(`respuesta ${next.data.sourceRef} ${res.status} ${res.text?.slice(0, 400)} estado=${probe.status} ${JSON.stringify(probe.body)?.slice(0, 300)}`);
    }
    state = res.body;
  }
  throw new Error('demasiados pasos');
}

function near(actual: number | null, expected: number | null) {
  if (expected == null || actual == null) {
    expect(actual).toBe(expected);
    return;
  }
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(reference.tolerance + 1e-8);
}

beforeAll(async () => {
  trace({
    category: 'boot',
    runId: process.env.MK_RUN_ID ?? 'unset',
    node: process.version,
    pid: process.pid,
    throttle: process.env.MK_THROTTLE_DEFAULT_LIMIT ?? 'unset',
    database: (process.env.DATABASE_URL ?? '').replace(/\/\/.*@/, '//'),
  });
  app = await bootApi({ clock, responseHook });
  const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
  const active = await prisma.diagnosticVersion.findMany({ where: { isActive: true }, select: { version: true } });
  trace({ category: 'boot', activeVersions: active.map((row) => row.version) });
  await prisma.$disconnect();
});

afterAll(async () => {
  writeFileSync(resolve(__dirname, 'realistic-observed.json'), `${JSON.stringify(observed, null, 2)}\n`);
  await app.close();
});

describe('casos realistas por HTTP', () => {
  for (const item of pack.cases.filter((row) => row.capture.mode !== 'LEGACY_MANIFEST')) {
    it(item.id, async () => {
      activeCase = item.id;
      process.env.MK_CLOCK_DAY = '2026-10-12';
      const email = `mk.case.${item.id}.${Date.now()}@fixtures.mk.invalid`;
      const password = 'Recorrido2026';
      const registered = await request(server()).post('/api/v1/auth/register').send({ email, password });
      expect(registered.status).toBe(201);
      const token = registered.body.accessToken as string;
      const userId = registered.body.user.id as string;
      await walk(token, item);
      const state = await call(token, 'get', '/journey/state');
      const alignment = state.body.indexes.alignment;
      const expected = reference.cases.find((row) => row.case_id === item.id)!;
      near(alignment.general, expected.initial.general);
      near(alignment.pillars.espiritu, expected.initial.pillars.E);
      near(alignment.pillars.mente, expected.initial.pillars.M);
      near(alignment.pillars.cuerpo, expected.initial.pillars.C);
      const before = alignment.general;
      await call(token, 'post', '/journey/purpose', {
        content: {
          directionStatus: directionOf(String(item.context.direction)),
          ...(item.context.value ? { value: String(item.context.value) } : {}),
        },
      });
      const requestBody = {
        goalText: item.user_goal,
        interest: item.context.interest,
        territory: item.context.territory,
        occasions: item.context.occasions,
        weeklyMinutes: item.context.weekly_minutes,
        reviewMinutes: 0,
        weekday: 1,
        limits: item.context.health_limit === 'CURRENT_RESTRICTION' ? [{ subjectRef: 'salud', outcome: 'CURRENT_LIMIT' }] : undefined,
      };
      let preview = await call(token, 'post', '/journey/accompaniment/preview', requestBody);
      expect(preview.status, JSON.stringify(preview.body)).toBeLessThan(400);
      if (item.id === 'MK-S09') {
        expect(String(preview.body.help.action ?? '')).not.toMatch(/diseño final/);
        const named = await call(token, 'post', '/journey/accompaniment/preview', {
          ...requestBody,
          barrier: { kind: 'PULIR_ANTES_DE_MOSTRAR', choice: 'RECOGNIZE', detail: 'Rehacer el formato desplaza la escritura.' },
        });
        expect(named.status).toBeLessThan(400);
        expect(String(named.body.help.action)).toMatch(/legible/);
        preview = named;
      }
      if (item.id === 'MK-S06') {
        expect(preview.body.proposal.familyId).toBe('MEN-EXP');
        expect(preview.body.proposal.mode).toBe('EXPANSION');
        expect(preview.body.proposal.indexUsed).toBe(false);
        expect(preview.body.help.action).toBeTruthy();
      }
      if (item.id === 'MK-S10') {
        expect(preview.body.proposal.situation).toBe('RETURN');
        expect(preview.body.proposal.mode).not.toBe('CONTENCION');
        expect(preview.body.help.futureEffect).toMatch(/futuro/);
      }
      if (item.id === 'MK-S02') {
        expect(preview.body.proposal.familyId).toBe('X-IKIGAI');
        expect(preview.body.help.artifact.kind).toBe('FICHA_EXPERIMENTO');
        expect(preview.body.proposal.requiresAction).toBe(true);
      }
      if (item.id === 'MK-S04') {
        expect(preview.body.proposal.situation).toBe('PAUSE');
        expect(preview.body.proposal.requiresAction).toBe(false);
      }
      if (item.id === 'MK-S01') {
        expect(JSON.stringify(preview.body.proposal.reasons)).toContain('Claridad');
        expect(preview.body.proposal.familyId).toBe('MEN-EST');
        const shorter = await call(token, 'post', '/journey/accompaniment/preview', {
          ...requestBody,
          occasions: 1,
          weeklyMinutes: 30,
          minutesPerOccasion: 30,
        });
        expect(shorter.status).toBeLessThan(400);
        expect(shorter.body.proposal.familyId).toBe(preview.body.proposal.familyId);
        expect(shorter.body.proposal.indexUsed).toBe(false);
        expect(shorter.body.help.occasion.minutesPerOccasion).toBe(30);
        expect(preview.body.help.occasion.minutesPerOccasion).not.toBe(30);
        expect((await call(token, 'get', '/journey/state')).body.indexes.alignment.general).toBe(before);
        mkdirSync(resolve(__dirname, 'artifacts/previews'), { recursive: true });
        writeFileSync(resolve(__dirname, 'artifacts/previews/MK-V09.json'), `${JSON.stringify({ id: 'MK-V09', body: shorter.body }, null, 2)}\n`);
      }
      if (item.id === 'MK-S06') {
        expect(JSON.stringify(preview.body.proposal.reasons)).not.toMatch(/origen|linaje/i);
      }
      if (item.id === 'MK-S08') {
        expect(preview.body.proposal.indexUsed).toBe(false);
      }
      mkdirSync(resolve(__dirname, 'artifacts/previews'), { recursive: true });
      writeFileSync(resolve(__dirname, `artifacts/previews/${item.id}.json`), `${JSON.stringify(preview.body, null, 2)}\n`);
      const help = preview.body.help;
      expect(help.source).toBe('SYSTEM_GENERATED');
      const confirmBody = {
        ...requestBody,
        barrier: item.id === 'MK-S09' ? { kind: 'PULIR_ANTES_DE_MOSTRAR', choice: 'RECOGNIZE', detail: 'Rehacer el formato desplaza la escritura.' } : undefined,
        digest: preview.body.digest,
        headVersion: preview.body.headVersion,
        choice: 'ACCEPT',
        commandKey: `acc-${item.id}-${userId}`,
      };
      const confirmed = await call(token, 'post', '/journey/accompaniment', confirmBody);
      expect(confirmed.status, JSON.stringify(confirmed.body)).toBeLessThan(400);
      const repeated = await call(token, 'post', '/journey/accompaniment', confirmBody);
      expect(repeated.body.id).toBe(confirmed.body.id);
      expect(repeated.body.repeated).toBe(true);
      let planId: string | null = confirmed.body.effect?.planId ?? null;
      let actionId: string | null = confirmed.body.effect?.actionId ?? null;
      if (preview.body.proposal.requiresAction && help.action) {
        expect(planId).toBeTruthy();
        expect(actionId).toBeTruthy();
        if (item.context.health_limit === 'CURRENT_RESTRICTION') {
          const blocked = await call(token, 'post', `/journey/plans/${planId}/actions`, {
            title: 'Entrenar con carga',
            doneWhen: 'Completé una sesión fuerte',
            contentTags: ['PHYSICAL_EXERTION'],
          });
          expect(blocked.status).toBe(403);
        }
        await call(token, 'post', '/journey/records', {
          actionId,
          day: '2026-10-12',
          status: 'DONE',
          resultNote: 'El paso ocurrió. El resultado pedido no está observado.',
          resultStatus: 'NOT_OBSERVED',
        });
        const guidance = await call(token, 'post', '/journey/weeks/preview', {
          weekStart: '2026-10-12',
          decisions: { [actionId!]: 'SUBSTITUTE' },
          revisions: { [actionId!]: { title: 'Una estrategia distinta, con el mismo criterio de poder mostrarla.', preparation: 'Empiezo por el entregable, no por ordenar referencias.' } },
        });
        expect(guidance.body.guidance.situation).toBe('STUCK_RESULT');
        const closed = await call(token, 'post', '/journey/weeks/close', {
          weekStart: '2026-10-12',
          decisions: { [actionId!]: 'SUBSTITUTE' },
          revisions: { [actionId!]: { title: 'Una estrategia distinta, con el mismo criterio de poder mostrarla.', preparation: 'Empiezo por el entregable, no por ordenar referencias.' } },
        });
        expect(closed.status).toBeLessThan(400);
        process.env.MK_CLOCK_DAY = '2026-10-19';
        const later = await call(token, 'get', '/journey/calendar');
        const titles = JSON.stringify(later.body.plans);
        expect(titles).toContain('Una estrategia distinta');
        expect(titles).toContain(help.action.slice(0, 80));
      } else {
        expect(preview.body.proposal.requiresAction).toBe(false);
      }
      const replay = await call(token, 'post', '/journey/accompaniment', confirmBody);
      expect(replay.body.id).toBe(confirmed.body.id);
      expect(replay.body.repeated).toBe(true);
      const after = await call(token, 'get', '/journey/state');
      expect(after.body.indexes.alignment.general).toBe(before);
      const again = await request(server()).post('/api/v1/auth/login').send({ email, password });
      const reread = await call(again.body.accessToken, 'get', '/journey/state');
      expect(reread.body.indexes.alignment.general).toBe(before);
      if (item.id === 'MK-S03') {
        const stale = await call(token, 'post', '/journey/accompaniment/preview', {
          goalText: item.user_goal,
          interest: 'CUIDADO',
          territory: 'SALUD_FISICA',
          occasions: 1,
          weeklyMinutes: 30,
          reviewMinutes: 0,
        });
        const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
        await prisma.memberClarification.create({ data: { userId, scope: 'HEALTH', outcome: 'CURRENT_LIMIT', subjectRef: 'otro-asunto' } });
        await prisma.$disconnect();
        const conflict = await call(token, 'post', '/journey/accompaniment', {
          goalText: item.user_goal,
          interest: 'CUIDADO',
          territory: 'SALUD_FISICA',
          occasions: 1,
          weeklyMinutes: 30,
          reviewMinutes: 0,
          digest: stale.body.digest,
          commandKey: `acc-s03-stale-${userId}`,
        });
        expect(conflict.status).toBe(409);
        expect((await call(token, 'get', '/journey/state')).body.indexes.alignment.general).toBe(before);
      }
      if (item.id === 'MK-S10') {
        const opened = await call(token, 'post', '/journey/measurements', { kind: 'REMEASURE', sessionId: null });
        await call(token, 'post', `/journey/measurements/${opened.body.id}/answers`, { sourceRef: 'formulario-v1:E-AUD-001!R26', value: 4 });
        const partial = await call(token, 'post', `/journey/measurements/${opened.body.id}/close`, {});
        expect(partial.body.general).toBeNull();
        expect((await call(token, 'get', '/journey/state')).body.indexes.alignment.general).toBe(before);
        for (const [key, value] of Object.entries(item.core_answers)) {
          if (value == null) continue;
          await call(token, 'post', `/journey/measurements/${opened.body.id}/answers`, { sourceRef: sourceRef(key), value });
        }
        const full = await call(token, 'post', `/journey/measurements/${opened.body.id}/close`, {});
        expect(full.body.general).toBeCloseTo(before as number, 4);
        const latest = await call(token, 'get', '/journey/state');
        expect(latest.body.indexes.alignment.kind).toBe('REMEASURE');
        expect(latest.body.indexes.initial.general).toBe(before);
      }
      accounts.set(item.id, { token, userId, general: before });
      observed[item.id] = {
        index: alignment,
        proposal: preview.body.proposal,
        help,
        authorship: { proposal: 'SYSTEM_GENERATED', goal: 'USER_AUTHORED', weekSubstitute: 'USER_AUTHORED', records: 'SCRIPTED_SIMULATION' },
        planId,
        actionId,
      };
    }, 180_000);
  }

  it('MK-S12 reconfirma una captura vieja sin llamarla mejora', async () => {
    const item = pack.cases.find((row) => row.id === 'MK-S12')!;
    const email = `mk.case.S12.${Date.now()}@fixtures.mk.invalid`;
    const registered = await request(server()).post('/api/v1/auth/register').send({ email, password: 'Recorrido2026' });
    const token = registered.body.accessToken as string;
    const userId = registered.body.user.id as string;
    const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    const version = await prisma.diagnosticVersion.findUniqueOrThrow({ where: { version: 'formulario-completo@4' } });
    const session = await prisma.diagnosticSession.create({
      data: { userId, versionId: version.id, status: 'COMPLETED', completedAt: new Date('2026-09-01T15:00:00.000Z') },
    });
    const questions = await prisma.question.findMany({ where: { module: { versionId: version.id } }, include: { options: true } });
    for (const question of questions) {
      const ref = question.sourceRef ?? '';
      const key = Object.keys(item.core_answers).find((row) => sourceRef(row) === ref);
      const value = key ? item.core_answers[key] : null;
      const option = value == null ? null : question.options.find((row) => row.value === String(value));
      if (key && value != null && !option) throw new Error(`sin opción ${ref} ${value}`);
      await prisma.response.create({
        data: {
          sessionId: session.id,
          questionId: question.id,
          selectedOptionIds: option ? [option.id] : [],
          ...(option ? { selectedOptions: { connect: [{ id: option.id }] } } : {}),
          exceptionKind: option || question.type === 'FREE_TEXT' ? null : 'UNKNOWN',
          freeText: question.type === 'FREE_TEXT' ? 'Texto histórico corto.' : null,
        },
      });
    }
    const recovered = await call(token, 'post', '/journey/reading/recover', {});
    expect(recovered.status).toBeLessThan(400);
    expect(recovered.body.current.general).toBeNull();
    const opened = await call(token, 'post', '/journey/measurements', { kind: 'RECONFIRM', sessionId: session.id });
    for (const [key, value] of Object.entries(item.core_answers)) {
      if (value == null) continue;
      await call(token, 'post', `/journey/measurements/${opened.body.id}/answers`, { sourceRef: sourceRef(key), value });
    }
    const closed = await call(token, 'post', `/journey/measurements/${opened.body.id}/close`, {});
    expect(closed.body.general).toBeCloseTo(54.4753, 4);
    const views = await call(token, 'get', '/journey/state');
    expect(views.body.indexes.alignment.kind).not.toBe('INITIAL');
    expect(views.body.indexes.alignment.delta).toBeNull();
    const repeated = await call(token, 'post', `/journey/measurements/${opened.body.id}/close`, {});
    expect(repeated.body.general).toBe(closed.body.general);
    observed['MK-S12'] = { before: recovered.body.current, after: views.body.indexes.alignment, authorship: { seed: 'SCRIPTED_SIMULATION', reconfirm: 'USER_AUTHORED', reading: 'SYSTEM_GENERATED' } };
    await prisma.$disconnect();
  }, 120_000);
});
