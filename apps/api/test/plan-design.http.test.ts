import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootApi } from './journey-http-app';

process.env.MK_CLOCK_DAY = '2026-11-04';
const clock = { today() { return process.env.MK_CLOCK_DAY ?? '2026-11-04'; } };
let app: INestApplication;
let prisma: PrismaClient;

function server() { return app.getHttpServer(); }

async function call(token: string, method: 'get' | 'post' | 'patch', path: string, body?: unknown) {
  const req = request(server())[method](`/api/v1${path}`).set('Connection', 'close').set('Authorization', `Bearer ${token}`);
  return body === undefined ? req : req.send(body);
}

async function account(label: string) {
  const email = `mk.design.${label}.${Date.now()}@fixtures.mk.invalid`;
  const res = await request(server()).post('/api/v1/auth/register').set('Connection', 'close').send({ email, password: 'Recorrido2026' });
  expect(res.status).toBe(201);
  return { token: res.body.accessToken as string, userId: res.body.user.id as string };
}

async function answer(token: string, userId: string, answers: Record<string, string>) {
  const started = await call(token, 'post', '/diagnostic/start', {});
  expect(started.status).toBeLessThan(400);
  const session = await prisma.diagnosticSession.findFirstOrThrow({ where: { userId, status: 'ACTIVE' } });
  for (const [sourceRef, value] of Object.entries(answers)) {
    const question = await prisma.question.findFirstOrThrow({
      where: { sourceRef, module: { versionId: session.versionId } },
      include: { options: true },
    });
    const option = question.options.find((row) => row.value === value);
    await prisma.response.create({
      data: {
        sessionId: session.id,
        questionId: question.id,
        freeText: option ? null : value,
        selectedOptionIds: option ? [option.id] : [],
        selectedOptions: option ? { connect: [{ id: option.id }] } : undefined,
        revision: 1,
      },
    });
  }
}

type Design = {
  planId: string;
  actions: { key: string; title: string; doneWhen: string; cue: string | null; minimum: string | null; schedule: Record<string, unknown>; contentTags: string[] }[];
  readiness: { ready: boolean; missing: { step: number; code: string }[] };
  [key: string]: unknown;
};

const base = (territory: string) => `/journey/intervention/${territory}`;

async function create(token: string, territory: string, body: Record<string, unknown>) {
  const res = await call(token, 'post', `${base(territory)}/designs`, body);
  expect(res.status, JSON.stringify(res.body)).toBeLessThan(400);
  return res.body as Design;
}

async function patch(token: string, territory: string, planId: string, body: Record<string, unknown>, status = 200) {
  const res = await call(token, 'patch', `${base(territory)}/plans/${planId}/design`, body);
  expect(res.status, JSON.stringify(res.body)).toBe(status);
  return res.body as Design;
}

function edit(actions: Design['actions'], changes: Partial<Design['actions'][number]>[]) {
  return actions.map((row, index) => ({ ...row, ...(changes[index] ?? {}) }));
}

async function finishWeek(token: string, territory: string, design: Design, actions: unknown[], extra: Record<string, unknown> = {}) {
  return patch(token, territory, design.planId, {
    section: 'actions',
    actions,
    obstacles: [{ obstacle: 'Llego tarde del trabajo', response: 'Hago la versión mínima' }],
    protectNote: 'Por ahora no hay nada que cuidar.',
    loadConfirmed: true,
    ...extra,
  });
}

beforeAll(async () => {
  app = await bootApi({ clock });
  prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
}, 60_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await app?.close();
});

describe('Diseña sin Descubre ni Propósito', () => {
  it('un hábito recurrente con estrategia propia llega a Actúa con su cuándo y su versión mínima', async () => {
    process.env.MK_CLOCK_DAY = '2026-11-04';
    const owner = await account('habito');
    const context = await call(owner.token, 'get', `${base('mentalidad')}/design-context`);
    expect(context.status).toBe(200);
    expect(context.body.readings).toEqual([]);
    expect(context.body.direction).toBeNull();
    expect(context.body.hasAnswers).toBe(false);

    const empty = await call(owner.token, 'post', `${base('mentalidad')}/designs`, { change: '  ' });
    expect(empty.status).toBe(400);
    const created = await create(owner.token, 'mentalidad', { change: 'Leer antes de dormir en vez de mirar el teléfono', commandKey: 'habit-1' });
    const again = await create(owner.token, 'mentalidad', { change: 'Leer antes de dormir en vez de mirar el teléfono', commandKey: 'habit-1' });
    expect(again.planId).toBe(created.planId);
    expect(created.readiness.missing[0]).toMatchObject({ step: 2, code: 'RESULT_MODE' });
    expect((created.recommendations as { basis: string }).basis).toBe('NONE');

    await patch(owner.token, 'mentalidad', created.planId, { section: 'result', mode: 'RESULT', soughtOutcome: 'Dormir con la mente más tranquila', criterion: '', horizonWeeks: 3 }, 400);
    await patch(owner.token, 'mentalidad', created.planId, { section: 'result', mode: 'RESULT', soughtOutcome: 'Dormir con la mente más tranquila', criterion: 'Cuatro noches de la semana leí y dejé el teléfono fuera', evidenceHint: 'Mi registro de la semana', horizonWeeks: 3 });
    const withStrategy = await patch(owner.token, 'mentalidad', created.planId, { section: 'strategy', strategy: { kind: 'OWN', pattern: 'HABIT', title: 'Leer cada noche' } });
    expect(withStrategy.actions).toHaveLength(1);
    expect(withStrategy.readiness.missing.map((row) => row.code)).toEqual(expect.arrayContaining(['ACTION_TITLE', 'PROTECT', 'LOAD']));

    const done = await finishWeek(owner.token, 'mentalidad', withStrategy, edit(withStrategy.actions, [{ title: 'Leer 15 minutos en la cama', cue: 'Después de lavarme los dientes', minimum: 'Leer una página' }]));
    expect(done.readiness.ready, JSON.stringify(done.readiness)).toBe(true);
    expect((done.load as { maxWeekly: number }).maxWeekly).toBe(45);

    const unconfirmed = await call(owner.token, 'post', `${base('mentalidad')}/plans/${created.planId}/activate`, { confirmed: false, commandKey: 'act-habit' });
    expect(unconfirmed.status).toBe(400);
    const activated = await call(owner.token, 'post', `${base('mentalidad')}/plans/${created.planId}/activate`, { confirmed: true, commandKey: 'act-habit' });
    expect(activated.status, JSON.stringify(activated.body)).toBeLessThan(400);
    const repeat = await call(owner.token, 'post', `${base('mentalidad')}/plans/${created.planId}/activate`, { confirmed: true, commandKey: 'act-habit' });
    expect(repeat.body.repeated).toBe(true);

    const actions = await prisma.planAction.findMany({ where: { planId: created.planId } });
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ title: 'Leer 15 minutos en la cama', cue: 'Después de lavarme los dientes', minimumVersion: 'Leer una página', occasionsPerWeek: 3, origin: 'MEMBER', position: 0 });

    const view = await call(owner.token, 'get', `${base('mentalidad')}/plans/${created.planId}`);
    expect(view.status).toBe(200);
    expect(view.body.template.group).toBe('OWN');
    expect(view.body.indicators).toEqual([]);
    expect(view.body.reviewAt).toBe('2026-11-25');

    const record = await call(owner.token, 'post', '/journey/records', { actionId: actions[0]!.id, day: '2026-11-04', status: 'DONE' });
    expect(record.status, JSON.stringify(record.body)).toBeLessThan(400);
    const afterDone = await call(owner.token, 'get', `${base('mentalidad')}/plans/${created.planId}`);
    expect(afterDone.body.outcomeAssessment).toBeNull();

    const noEvidence = await call(owner.token, 'post', `${base('mentalidad')}/plans/${created.planId}/outcome-assessment`, { status: 'ACHIEVED', commandKey: 'oa-1' });
    expect(noEvidence.status).toBe(400);
    const locked = await call(owner.token, 'patch', `${base('mentalidad')}/plans/${created.planId}/design`, { section: 'change', change: 'Otro' });
    expect(locked.status).toBe(409);
    expect(locked.body.code).toBe('NOT_PREPARING');
  });
});

describe('Diseña solo con Descubre', () => {
  it('una decisión postergada usa la lectura reconocida y la plantilla queda orientada', async () => {
    process.env.MK_CLOCK_DAY = '2026-11-04';
    const owner = await account('decision');
    await answer(owner.token, owner.userId, {
      'formulario-v1:E-AUD-001!R26': '2',
      'formulario-v1:E-PER-000!R134': '2',
    });
    const context = await call(owner.token, 'get', `${base('mentalidad')}/design-context`);
    const ids = context.body.readings.map((row: { id: string }) => row.id);
    expect(ids).toEqual(expect.arrayContaining(['planificacion', 'postergacion']));
    const postergacion = context.body.readings.find((row: { id: string }) => row.id === 'postergacion');

    const notRecognized = await call(owner.token, 'post', `${base('mentalidad')}/designs`, { change: 'Decidir si cambio de trabajo', contextReadingIds: ['postergacion'] });
    expect(notRecognized.status).toBe(400);
    const recognized = await call(owner.token, 'post', `${base('mentalidad')}/recognition`, { readingId: 'postergacion', outcome: 'REPRESENTS', signature: postergacion.signature });
    expect(recognized.status).toBeLessThan(400);

    const created = await create(owner.token, 'mentalidad', { change: 'Decidir si cambio de trabajo', why: 'Llevo un año dándole vueltas', goal: 'avanzar', contextReadingIds: ['postergacion'] });
    await patch(owner.token, 'mentalidad', created.planId, { section: 'result', mode: 'RESULT', soughtOutcome: 'Tener la decisión tomada o una fecha clara', criterion: 'Escribí la decisión y se la conté a mi pareja', horizonWeeks: 3 });
    const view = await call(owner.token, 'get', `${base('mentalidad')}/plans/${created.planId}/design`);
    const items = view.body.recommendations.items as { templateId: string; reasons: string[] }[];
    expect(items[0]!.templateId).toBe('MEN-B1');
    expect(items.map((row) => row.templateId)).toEqual(['MEN-B1', 'MEN-B2']);
    expect(items[0]!.reasons[0]).toContain('lectura que reconociste');
    expect(items[0]!.reasons[1]).toContain('Avanzar algo que estoy postergando');

    const chosen = await patch(owner.token, 'mentalidad', created.planId, { section: 'strategy', strategy: { kind: 'CATALOG', templateId: 'MEN-B2', focusText: 'Cambiar de trabajo', stageDefinition: null } });
    expect(chosen.readiness.missing.map((row) => row.code)).toContain('STAGE');
    const staged = await patch(owner.token, 'mentalidad', created.planId, { section: 'strategy', strategy: { kind: 'CATALOG', templateId: 'MEN-B2', focusText: 'Cambiar de trabajo', stageDefinition: 'Saber si me quedo o me voy' } });
    expect(staged.actions[0]!.title).toBe('Anota qué información falta, cómo conseguirla y cuándo volver a mirarla.');
    const minimum = staged.actions.map((row) => ({ ...row, usesMinimum: true, schedule: { kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 15 } }));
    const done = await finishWeek(owner.token, 'mentalidad', staged, minimum, { protectNote: 'Los domingos con mi familia' });
    expect(done.readiness.ready).toBe(true);
    const needsMinimumConfirm = await call(owner.token, 'post', `${base('mentalidad')}/plans/${created.planId}/activate`, { confirmed: true });
    expect(needsMinimumConfirm.status).toBe(422);
    expect(needsMinimumConfirm.body.code).toBe('MINIMUM_PROTECT_CONFIRM');
    const activated = await call(owner.token, 'post', `${base('mentalidad')}/plans/${created.planId}/activate`, { confirmed: true, minimumLoadConfirmed: true });
    expect(activated.status, JSON.stringify(activated.body)).toBeLessThan(400);

    const plan = await call(owner.token, 'get', `${base('mentalidad')}/plans/${created.planId}`);
    expect(plan.body.general).toBe(false);
    expect(plan.body.minimum).toBe(true);
    expect(plan.body.readings.map((row: { id: string }) => row.id)).toEqual(['postergacion']);
    expect(plan.body.indicators[0].indicator.kind).toBe('CHOICE');
    const actions = await prisma.planAction.findMany({ where: { planId: created.planId } });
    expect(actions[0]).toMatchObject({ origin: 'SYSTEM_TEMPLATE', familyId: 'MEN-B2' });
  });
});

describe('Diseña solo con Propósito', () => {
  it('un proyecto por pasos queda vinculado a la dirección y cada paso vive en su semana', async () => {
    process.env.MK_CLOCK_DAY = '2026-11-04';
    const owner = await account('proyecto');
    const saved = await call(owner.token, 'post', '/journey/direction', { mode: 'CLEAR', statement: 'Vivir sin deudas que me quiten el sueño', desiredChange: 'Tener mis finanzas en orden' });
    expect(saved.status).toBeLessThan(400);
    const context = await call(owner.token, 'get', `${base('finanzas')}/design-context`);
    expect(context.body.direction.statement).toBe('Vivir sin deudas que me quiten el sueño');
    expect(context.body.readings).toEqual([]);

    const created = await create(owner.token, 'finanzas', {
      change: 'Hacer la declaración de impuestos a tiempo',
      why: 'Quiero dejar de pagar multas',
      purposeRevisionId: context.body.direction.purposeRevisionId,
      linkKind: 'ENABLING',
    });
    await patch(owner.token, 'finanzas', created.planId, { section: 'result', mode: 'RESULT', soughtOutcome: 'Declaración enviada', criterion: 'Tengo el comprobante de envío', horizonWeeks: 3 });
    const steps = await patch(owner.token, 'finanzas', created.planId, { section: 'strategy', strategy: { kind: 'OWN', pattern: 'STEPS', title: 'Por pasos' } });
    expect(steps.actions.map((row) => row.schedule.week)).toEqual([1, 2, 3]);
    const titled = edit(steps.actions, [{ title: 'Juntar boletas y certificados' }, { title: 'Revisar la propuesta del sitio' }, { title: 'Enviar la declaración' }]);
    const debt = await finishWeek(owner.token, 'finanzas', steps, edit(titled, [{ contentTags: ['DEBT'] }]));
    expect(debt.readiness.missing.map((row) => row.code)).toContain('RESTRICTED');
    const done = await finishWeek(owner.token, 'finanzas', debt, titled);
    expect((done.load as { byWeek: number[] }).byWeek).toEqual([30, 30, 30]);
    const activated = await call(owner.token, 'post', `${base('finanzas')}/plans/${created.planId}/activate`, { confirmed: true });
    expect(activated.status, JSON.stringify(activated.body)).toBeLessThan(400);
    expect(activated.body.plan.purposeRevisionId).toBe(context.body.direction.purposeRevisionId);
    expect(activated.body.plan.linkKind).toBe('ENABLING');

    const actions = await prisma.planAction.findMany({ where: { planId: created.planId }, orderBy: { position: 'asc' }, include: { schedules: true } });
    expect(actions.map((row) => row.title)).toEqual(['Juntar boletas y certificados', 'Revisar la propuesta del sitio', 'Enviar la declaración']);
    expect(actions.every((row) => row.occasionsPerWeek === null)).toBe(true);
    expect(actions[1]!.schedules[0]!.effectiveFrom.toISOString().slice(0, 10)).toBe('2026-11-09');
    expect(actions[1]!.schedules[0]!.effectiveTo!.toISOString().slice(0, 10)).toBe('2026-11-15');

    const first = await call(owner.token, 'post', '/journey/records', { actionId: actions[0]!.id, day: '2026-11-04', status: 'DONE' });
    expect(first.status).toBeLessThan(400);
    const early = await call(owner.token, 'post', '/journey/records', { actionId: actions[1]!.id, day: '2026-11-04', status: 'DONE' });
    expect(early.status).toBe(409);
    expect(early.body.code).toBe('NOT_AN_OCCASION');

    const summary = await call(owner.token, 'get', `/journey/plans/${created.planId}/summary`);
    expect(summary.body.actions.map((row: { title: string }) => row.title)).toHaveLength(3);
    expect(summary.body.obstacles[0].response).toBe('Hago la versión mínima');
  });
});

describe('Diseña con Descubre y Propósito', () => {
  it('un cambio de comportamiento: cambiar estrategia o resultado pide una resolución explícita', async () => {
    process.env.MK_CLOCK_DAY = '2026-11-04';
    const owner = await account('conducta');
    await answer(owner.token, owner.userId, { 'formulario-v1:E-PER-000!R99': '2' });
    await call(owner.token, 'post', '/journey/direction', { mode: 'EXPLORE', statement: 'Estar presente con mis hijos', desiredChange: null });
    const context = await call(owner.token, 'get', `${base('mentalidad')}/design-context`);
    expect(context.body.direction.statement).toBe('Estar presente con mis hijos');
    const distraccion = context.body.readings.find((row: { id: string }) => row.id === 'distraccion');
    await call(owner.token, 'post', `${base('mentalidad')}/recognition`, { readingId: 'distraccion', outcome: 'PARTIAL', signature: distraccion.signature });

    const created = await create(owner.token, 'mentalidad', {
      change: 'Dejar el teléfono cuando llego a casa',
      goal: 'habito',
      contextReadingIds: ['distraccion'],
      purposeRevisionId: context.body.direction.purposeRevisionId,
      linkKind: 'DIRECT',
    });
    await patch(owner.token, 'mentalidad', created.planId, { section: 'result', mode: 'RESULT', soughtOutcome: 'Usar menos el teléfono en casa', criterion: 'Lo reviso menos de tres veces entre las 19 y las 21', horizonWeeks: 3 });
    const recs = await call(owner.token, 'get', `${base('mentalidad')}/plans/${created.planId}/design`);
    expect(recs.body.recommendations.items[0].templateId).toBe('MEN-D1');

    const d1 = await patch(owner.token, 'mentalidad', created.planId, { section: 'strategy', strategy: { kind: 'CATALOG', templateId: 'MEN-D1', focusText: 'Mirar el teléfono al llegar', stageDefinition: null } });
    const mine = [...d1.actions.map((row) => ({ ...row, cue: 'Al cruzar la puerta' })), { title: 'Dejar el cargador en la entrada', doneWhen: 'El cargador está ahí', schedule: { kind: 'ONCE', week: 1, minutesPerOccasion: 10 } }];
    const edited = await finishWeek(owner.token, 'mentalidad', d1, mine);
    expect(edited.actions).toHaveLength(2);

    const conflict = await call(owner.token, 'patch', `${base('mentalidad')}/plans/${created.planId}/design`, { section: 'strategy', strategy: { kind: 'CATALOG', templateId: 'MEN-A2', focusText: null, stageDefinition: null } });
    expect(conflict.status).toBe(409);
    expect(conflict.body.code).toBe('ACTIONS_EDITED');
    const kept = await patch(owner.token, 'mentalidad', created.planId, { section: 'strategy', strategy: { kind: 'CATALOG', templateId: 'MEN-A2', focusText: null, stageDefinition: null }, actionsResolution: 'KEEP' });
    expect(kept.actions.map((row) => row.cue ?? row.title)).toEqual(['Al cruzar la puerta', 'Dejar el cargador en la entrada']);
    expect(kept.loadConfirmed).toBe(false);
    const back = await patch(owner.token, 'mentalidad', created.planId, { section: 'strategy', strategy: { kind: 'CATALOG', templateId: 'MEN-D1', focusText: 'Mirar el teléfono al llegar', stageDefinition: null }, actionsResolution: 'KEEP' });

    const changed = await patch(owner.token, 'mentalidad', created.planId, { section: 'result', mode: 'RESULT', soughtOutcome: 'Cenar sin el teléfono en la mesa', criterion: 'Cinco cenas sin teléfono', horizonWeeks: 3 });
    expect(changed.stale).toBe(true);
    await finishWeek(owner.token, 'mentalidad', changed, back.actions);
    const blocked = await call(owner.token, 'post', `${base('mentalidad')}/plans/${created.planId}/activate`, { confirmed: true });
    expect(blocked.status).toBe(422);
    expect(blocked.body.missing).toContain('STALE');
    await finishWeek(owner.token, 'mentalidad', changed, back.actions, { acknowledgeObjective: true });
    const activated = await call(owner.token, 'post', `${base('mentalidad')}/plans/${created.planId}/activate`, { confirmed: true });
    expect(activated.status, JSON.stringify(activated.body)).toBeLessThan(400);
    const plan = await call(owner.token, 'get', `${base('mentalidad')}/plans/${created.planId}`);
    expect(plan.body.readings[0]).toMatchObject({ id: 'distraccion', outcome: 'PARTIAL' });
    expect(plan.body.directionAtDraft.statement).toBe('Estar presente con mis hijos');
    const actions = await prisma.planAction.findMany({ where: { planId: created.planId }, orderBy: { position: 'asc' } });
    expect(actions.map((row) => row.origin)).toEqual(['SYSTEM_TEMPLATE', 'MEMBER']);
  });
});

describe('Objetivo exploratorio y plan creado por la persona', () => {
  it('explorar registra aprendizaje y no permite declararlo como logro', async () => {
    process.env.MK_CLOCK_DAY = '2026-11-04';
    const owner = await account('explorar');
    const created = await create(owner.token, 'relaciones', { change: 'Conocer gente fuera del trabajo' });
    const result = await patch(owner.token, 'relaciones', created.planId, { section: 'result', mode: 'EXPLORATION', soughtOutcome: '¿Qué tipo de actividad me hace sentir cómodo con gente nueva?', criterion: 'Saber cuál de dos actividades quiero repetir', horizonWeeks: 2 });
    expect((result.recommendations as { items: { kind: string; pattern?: string }[] }).items[0]).toMatchObject({ kind: 'OWN', pattern: 'EXPLORE' });
    const explore = await patch(owner.token, 'relaciones', created.planId, { section: 'strategy', strategy: { kind: 'OWN', pattern: 'EXPLORE', title: 'Probar dos actividades' } });
    const done = await finishWeek(owner.token, 'relaciones', explore, edit(explore.actions, [{ title: 'Ir a una clase de escalada' }]));
    expect(done.readiness.ready).toBe(true);
    const activated = await call(owner.token, 'post', `${base('relaciones')}/plans/${created.planId}/activate`, { confirmed: true });
    expect(activated.status, JSON.stringify(activated.body)).toBeLessThan(400);
    expect(activated.body.plan.criterionStatus).toBe('PROVISIONAL');

    const achieved = await call(owner.token, 'post', `${base('relaciones')}/plans/${created.planId}/outcome-assessment`, { status: 'ACHIEVED', text: 'Me gustó', commandKey: 'ex-1' });
    expect(achieved.status).toBe(400);
    const learned = await call(owner.token, 'post', `${base('relaciones')}/plans/${created.planId}/outcome-assessment`, { status: 'LEARNED', text: 'Me siento más cómodo con actividades en grupo chico', commandKey: 'ex-2' });
    expect(learned.status, JSON.stringify(learned.body)).toBeLessThan(400);
    const view = await call(owner.token, 'get', `${base('relaciones')}/plans/${created.planId}`);
    expect(view.body.outcomeContract.mode).toBe('EXPLORATION');
    expect(view.body.review.outcomeText).toContain('no equivale a conseguir un resultado medible');
    const logro = await call(owner.token, 'post', `/journey/plans/${created.planId}/achievement`, { confirm: true });
    expect(logro.status).toBe(409);
  });

  it('un plan propio desde cero pasa por las aclaraciones de salud y de conversación', async () => {
    process.env.MK_CLOCK_DAY = '2026-11-04';
    const owner = await account('propio');
    const health = await create(owner.token, 'salud_fisica', { change: 'Volver a nadar' });
    await patch(owner.token, 'salud_fisica', health.planId, { section: 'result', mode: 'RESULT', soughtOutcome: 'Nadar dos veces por semana', criterion: 'Fui a la piscina dos veces en una semana', horizonWeeks: 4 });
    const free = await patch(owner.token, 'salud_fisica', health.planId, { section: 'strategy', strategy: { kind: 'OWN', pattern: 'FREE', title: 'Mi forma' } });
    await finishWeek(owner.token, 'salud_fisica', free, edit(free.actions, [{ title: 'Nadar 30 minutos', doneWhen: 'Nadé aunque fueran 10 minutos', contentTags: ['PHYSICAL_EXERTION'], schedule: { kind: 'WEEKLY', occasionsPerWeek: 2, minutesPerOccasion: 40 } }]));
    const view = await call(owner.token, 'get', `${base('salud_fisica')}/plans/${health.planId}/design`);
    expect(view.body.safety.health).toBe(true);
    const unclear = await call(owner.token, 'post', `${base('salud_fisica')}/plans/${health.planId}/activate`, { confirmed: true });
    expect(unclear.status).toBe(403);
    expect(unclear.body.scope).toBe('HEALTH');
    const fine = await call(owner.token, 'post', `${base('salud_fisica')}/plans/${health.planId}/activate`, { confirmed: true, healthLimit: 'NO_CURRENT_LIMIT' });
    expect(fine.status, JSON.stringify(fine.body)).toBeLessThan(400);

    const talk = await create(owner.token, 'relaciones', { change: 'Hablar con mi hermano sobre el cuidado de mamá' });
    await patch(owner.token, 'relaciones', talk.planId, { section: 'result', mode: 'RESULT', soughtOutcome: 'Repartir los turnos', criterion: 'Hay un calendario acordado', horizonWeeks: 2 });
    const conv = await patch(owner.token, 'relaciones', talk.planId, { section: 'strategy', strategy: { kind: 'OWN', pattern: 'CONVERSATION', title: 'Conversación' } });
    await finishWeek(owner.token, 'relaciones', conv, conv.actions);
    const ask = await call(owner.token, 'post', `${base('relaciones')}/plans/${talk.planId}/activate`, { confirmed: true });
    expect(ask.status).toBe(403);
    expect(ask.body.scope).toBe('CONVERSATION');
    const unsafe = await call(owner.token, 'post', `${base('relaciones')}/plans/${talk.planId}/activate`, { confirmed: true, conversation: 'UNSAFE' });
    expect(unsafe.status).toBe(403);
    expect(unsafe.body.alternatives).toContain('Preparar el paso sin confrontación');
    const viable = await call(owner.token, 'post', `${base('relaciones')}/plans/${talk.planId}/activate`, { confirmed: true, conversation: 'VIABLE' });
    expect(viable.status, JSON.stringify(viable.body)).toBeLessThan(400);
    const actions = await prisma.planAction.findMany({ where: { planId: talk.planId }, orderBy: { position: 'asc' } });
    expect(actions[1]).toMatchObject({ conversationOutcome: 'VIABLE' });
  });
});

describe('Compatibilidad', () => {
  it('un borrador creado por la ruta anterior se lee como diseño y se activa por el contrato nuevo', async () => {
    process.env.MK_CLOCK_DAY = '2026-11-04';
    const owner = await account('legado');
    const legacy = await call(owner.token, 'post', `${base('mentalidad')}/plans`, { templateId: 'MEN-A2', commandKey: 'legacy-a2' });
    expect(legacy.status).toBeLessThan(400);
    const planId = legacy.body.plan.id as string;
    const read = await call(owner.token, 'get', `${base('mentalidad')}/plans/${planId}/design`);
    expect(read.status).toBe(200);
    expect(read.body.adopted).toBe(true);
    expect(read.body.strategy).toMatchObject({ kind: 'CATALOG', templateId: 'MEN-A2' });
    expect(read.body.actions[0].title).toBe('Reserva un bloque para lo importante, sin las interrupciones que puedas evitar.');

    await patch(owner.token, 'mentalidad', planId, { section: 'result', mode: 'RESULT', soughtOutcome: 'Avanzar el informe', criterion: 'El informe tiene dos secciones nuevas', horizonWeeks: 3 });
    const stored = await call(owner.token, 'get', `${base('mentalidad')}/plans/${planId}/design`);
    expect(stored.body.adopted).toBe(false);
    await finishWeek(owner.token, 'mentalidad', stored.body as Design, stored.body.actions);
    const activated = await call(owner.token, 'post', `${base('mentalidad')}/plans/${planId}/activate`, { confirmed: true });
    expect(activated.status, JSON.stringify(activated.body)).toBeLessThan(400);
    const actions = await prisma.planAction.findMany({ where: { planId } });
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ familyId: 'MEN-A2', occasionsPerWeek: 2 });
  });
});
