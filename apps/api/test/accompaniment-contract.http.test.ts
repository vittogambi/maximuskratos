import http from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootApi } from './journey-http-app';
import { activatePlanBody } from './plan-activation-body';

process.env.MK_CLOCK_DAY = '2026-10-12';
process.env.MK_TRACE_HTTP = '1';
const clock = { today() { return process.env.MK_CLOCK_DAY ?? '2026-10-12'; } };
let app: INestApplication;

function server() { return app.getHttpServer(); }

async function call(token: string | null, method: 'get' | 'post' | 'patch', path: string, body?: unknown) {
  const req = request(server())[method](`/api/v1${path}`).set('Connection', 'close').set('Authorization', token ? `Bearer ${token}` : '');
  return body === undefined ? req : req.send(body);
}

async function account(label: string) {
  const email = `mk.contract.${label}.${Date.now()}@fixtures.mk.invalid`;
  const registered = await request(server()).post('/api/v1/auth/register').set('Connection', 'close').send({ email, password: 'Recorrido2026' });
  expect(registered.status).toBe(201);
  const token = registered.body.accessToken as string;
  const userId = registered.body.user.id as string;
  const started = await call(token, 'post', '/diagnostic/start', {});
  expect(started.status).toBeLessThan(400);
  const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
  const session = await prisma.diagnosticSession.findFirstOrThrow({ where: { userId, status: 'ACTIVE' } });
  await prisma.diagnosticSession.update({ where: { id: session.id }, data: { status: 'COMPLETED', completedAt: new Date('2026-10-01T15:00:00.000Z') } });
  await prisma.diagnosticFormResult.create({ data: { sessionId: session.id, formCode: 'formulario-completo', payload: { seeded: label } } });
  await prisma.purposeRevision.create({
    data: { userId, revision: 1, content: { directionStatus: 'PROVISIONAL', value: 'Claridad', synthesis: { combinations: [{ id: `comb-${label}`, experiment: 'Mostrar un paso del oficio.', learningQuestion: 'Si la explicación se entiende.' }] } } },
  });
  await prisma.$disconnect();
  return { token, userId, email };
}

const teach = {
  goalKind: 'ENSENAR_O_CONTRIBUIR',
  territory: 'MENTALIDAD',
  occasions: 1,
  weeklyMinutes: 40,
  minutesPerOccasion: 40,
  reviewMinutes: 0,
  weekday: 1,
  choice: 'ACCEPT' as const,
};

beforeAll(async () => {
  app = await bootApi({ clock, responseHook: { beforeUpsert: async () => undefined } });
});

afterAll(async () => {
  await app.close();
});

describe('clave compartida entre cuentas', () => {
  it('A y B usan la misma clave y cada uno conserva su decisión', async () => {
    const key = 'K-compartida';
    const a = await account('a');
    const b = await account('b');
    const previewA = await call(a.token, 'post', '/journey/accompaniment/preview', { ...teach, goalText: 'Explicar una tarea del oficio.' });
    const previewB = await call(b.token, 'post', '/journey/accompaniment/preview', { ...teach, goalText: 'Explicar otra tarea, de otro oficio.' });
    expect(previewA.status).toBeLessThan(400);
    expect(previewB.status).toBeLessThan(400);
    const bodyA = { ...teach, goalText: 'Explicar una tarea del oficio.', digest: previewA.body.digest, headVersion: previewA.body.headVersion, commandKey: key };
    const bodyB = { ...teach, goalText: 'Explicar otra tarea, de otro oficio.', digest: previewB.body.digest, headVersion: previewB.body.headVersion, commandKey: key };
    const confirmedA = await call(a.token, 'post', '/journey/accompaniment', bodyA);
    const confirmedB = await call(b.token, 'post', '/journey/accompaniment', bodyB);
    expect(confirmedA.status, JSON.stringify(confirmedA.body)).toBeLessThan(400);
    expect(confirmedB.status, JSON.stringify(confirmedB.body)).toBeLessThan(400);
    expect(confirmedA.body.id).not.toBe(confirmedB.body.id);
    expect(confirmedA.body.effect.planId).not.toBe(confirmedB.body.effect.planId);
    const againA = await call(a.token, 'post', '/journey/accompaniment', bodyA);
    const againB = await call(b.token, 'post', '/journey/accompaniment', bodyB);
    expect(againA.body).toMatchObject({ id: confirmedA.body.id, repeated: true });
    expect(againB.body).toMatchObject({ id: confirmedB.body.id, repeated: true });
    const changed = await call(a.token, 'post', '/journey/accompaniment', { ...bodyA, goalText: 'Una meta distinta bajo la misma clave.' });
    expect(changed.status).toBe(409);
    expect(changed.body.code).toBe('IDEMPOTENT_CONFLICT');
    const secondPreview = await call(a.token, 'post', '/journey/accompaniment/preview', { ...teach, goalText: 'Una segunda decisión, con otra clave.' });
    const other = await call(a.token, 'post', '/journey/accompaniment', {
      ...teach,
      goalText: 'Una segunda decisión, con otra clave.',
      digest: secondPreview.body.digest,
      headVersion: secondPreview.body.headVersion,
      commandKey: 'K-otra',
      planChoice: 'MODIFY',
      expectedPlanUpdatedAt: secondPreview.body.plan.updatedAt,
    });
    expect(other.status, JSON.stringify(other.body)).toBeLessThan(400);
    const stillA = await call(a.token, 'post', '/journey/accompaniment', bodyA);
    expect(stillA.body).toMatchObject({ id: confirmedA.body.id, repeated: true });
    const foreignPlan = await call(b.token, 'post', '/journey/accompaniment', { ...bodyB, planId: confirmedA.body.effect.planId, commandKey: 'K-plan-ajeno' });
    expect(foreignPlan.status).toBe(403);
    const foreignAction = await call(b.token, 'post', '/journey/accompaniment', { ...bodyB, actionId: confirmedA.body.effect.actionId, commandKey: 'K-accion-ajena' });
    expect(foreignAction.status).toBe(403);
    const foreignCombination = await call(b.token, 'post', '/journey/accompaniment', { ...bodyB, combinationId: 'comb-a', commandKey: 'K-combinacion-ajena' });
    expect(foreignCombination.status).toBeGreaterThanOrEqual(400);
    const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    const rowsB = await prisma.accompanimentDecision.findMany({ where: { userId: b.userId } });
    expect(rowsB.map((row) => row.commandKey).sort()).toEqual(['K-compartida']);
    await prisma.$disconnect();
  }, 60_000);
});

describe('retorno y experimentos', () => {
  it('recupera la meta guardada y no regenera el pasado', async () => {
    const person = await account('retorno');
    const preview = await call(person.token, 'post', '/journey/accompaniment/preview', { ...teach, goalText: 'Explicar una tarea del oficio.' });
    const confirmed = await call(person.token, 'post', '/journey/accompaniment', {
      ...teach,
      goalText: 'Explicar una tarea del oficio.',
      digest: preview.body.digest,
      headVersion: preview.body.headVersion,
      commandKey: 'retorno-inicial',
    });
    expect(confirmed.status, JSON.stringify(confirmed.body)).toBeLessThan(400);
    await call(person.token, 'post', '/journey/records', {
      actionId: confirmed.body.effect.actionId,
      day: '2026-10-12',
      status: 'DONE',
      resultStatus: 'NOT_OBSERVED',
    });
    process.env.MK_CLOCK_DAY = '2026-11-09';
    const returned = await call(person.token, 'post', '/journey/accompaniment/preview', {
      situation: 'RETURN',
      occasions: 1,
      weeklyMinutes: 20,
      minutesPerOccasion: 20,
      reviewMinutes: 0,
      weekday: 3,
    });
    expect(returned.status, JSON.stringify(returned.body)).toBeLessThan(400);
    expect(returned.body.proposal.situation).toBe('RETURN');
    expect(returned.body.proposal.familyId).toBe('MEN-EXP');
    expect(JSON.stringify(returned.body.proposal.reasons)).toContain('Recuperamos la meta guardada');
    const applied = await call(person.token, 'post', '/journey/accompaniment', {
      situation: 'RETURN',
      occasions: 1,
      weeklyMinutes: 20,
      minutesPerOccasion: 20,
      reviewMinutes: 0,
      weekday: 3,
      digest: returned.body.digest,
      headVersion: returned.body.headVersion,
      planChoice: 'MODIFY',
      expectedPlanUpdatedAt: returned.body.plan.updatedAt,
      choice: 'ACCEPT',
      commandKey: 'retorno-ajuste',
    });
    expect(applied.status, JSON.stringify(applied.body)).toBeLessThan(400);
    const closedNow = await call(person.token, 'post', '/journey/weeks/close', { weekStart: '2026-11-09', decisions: {} });
    expect(closedNow.status).toBeLessThan(400);
    const old = await call(person.token, 'post', '/journey/weeks/close', {
      weekStart: '2026-10-12',
      decisions: { [confirmed.body.effect.actionId]: 'SUBSTITUTE' },
      revisions: { [confirmed.body.effect.actionId]: { title: 'Un comando viejo.' } },
    });
    expect(old.status).toBe(409);
    const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    const past = await prisma.actionRecord.findFirst({ where: { actionId: confirmed.body.effect.actionId, day: '2026-10-12' } });
    expect(past?.status).toBe('DONE');
    await prisma.$disconnect();
    process.env.MK_CLOCK_DAY = '2026-10-12';
  }, 60_000);

  it('separa interés, capacidad, utilidad y sostenibilidad', async () => {
    const person = await account('ikigai');
    const preview = await call(person.token, 'post', '/journey/accompaniment/preview', {
      goalKind: 'EXPLORAR_IKIGAI',
      goalText: 'Probar la combinación.',
      territory: 'MENTALIDAD',
      occasions: 1,
      weeklyMinutes: 30,
      reviewMinutes: 0,
    });
    expect(preview.status).toBeLessThan(400);
    const hypothesis = preview.body.help.artifact.fields.find((field: { key: string }) => field.key === 'hipotesis');
    expect(hypothesis.value).toContain('Mostrar un paso');
    const confirmed = await call(person.token, 'post', '/journey/accompaniment', {
      goalKind: 'EXPLORAR_IKIGAI',
      goalText: 'Probar la combinación.',
      territory: 'MENTALIDAD',
      occasions: 1,
      weeklyMinutes: 30,
      reviewMinutes: 0,
      digest: preview.body.digest,
      headVersion: preview.body.headVersion,
      choice: 'ACCEPT',
      commandKey: 'ikigai-1',
    });
    expect(confirmed.status, JSON.stringify(confirmed.body)).toBeLessThan(400);
    const experimentId = confirmed.body.effect.experimentId as string;
    const interest = await call(person.token, 'post', `/journey/experiments/${experimentId}/observations`, {
      aspect: 'INTEREST', status: 'FAVORABLE', recipient: 'NO_RECIPIENT', observed: 'Me gustó preparar la muestra.',
    });
    const capacity = await call(person.token, 'post', `/journey/experiments/${experimentId}/observations`, {
      aspect: 'CAPACITY_LEARNING', status: 'FAVORABLE', observed: 'Pude ordenar los pasos.',
    });
    const silent = await call(person.token, 'post', `/journey/experiments/${experimentId}/observations`, {
      aspect: 'USEFULNESS', status: 'FAVORABLE', recipient: 'NO_RESPONSE', observed: 'No contestó.',
    });
    const contrary = await call(person.token, 'post', `/journey/experiments/${experimentId}/observations`, {
      aspect: 'USEFULNESS', status: 'CONTRARY', recipient: 'RESPONDED', observed: 'No pudo repetir el paso.',
    });
    const sustain = await call(person.token, 'post', `/journey/experiments/${experimentId}/observations`, {
      aspect: 'SUSTAINABILITY', status: 'NO_INFORMATION', observed: 'Todavía no sé si cabe en la semana.',
    });
    expect(interest.status).toBeLessThan(400);
    expect(capacity.status).toBeLessThan(400);
    expect(silent.status).toBeGreaterThanOrEqual(400);
    expect(contrary.status).toBeLessThan(400);
    expect(sustain.status).toBeLessThan(400);
    const changed = await call(person.token, 'post', `/journey/experiments/${experimentId}/hypothesis`, { hypothesis: 'Prefiere una guía escrita.' });
    expect(changed.body.priorObservations).toBe(4);
    const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    const oldNotes = await prisma.experimentObservation.findMany({ where: { experimentId, revision: { revision: 1 } } });
    expect(oldNotes.map((row) => row.aspect).sort()).toEqual(['CAPACITY_LEARNING', 'INTEREST', 'SUSTAINABILITY', 'USEFULNESS']);
    expect(oldNotes.find((row) => row.aspect === 'USEFULNESS')?.status).toBe('CONTRARY');
    const depthBefore = await prisma.depthConfirmation.count({ where: { userId: person.userId } });
    const pending = await call(person.token, 'post', `/journey/experiments/${experimentId}/review`, { decision: 'INCONCLUSIVE' });
    expect(pending.body.depthWritten).toBe(false);
    const brackets = await call(person.token, 'post', `/journey/experiments/${experimentId}/review`, {
      decision: 'KEEP', meaning: 'Enseñar es [la contribución].', matters: 'Importa.', change: 'Secuencia.', link: 'Hipótesis.', evidence: 'Repitió el paso.',
    });
    expect(brackets.status).toBeGreaterThanOrEqual(400);
    expect(await prisma.depthConfirmation.count({ where: { userId: person.userId } })).toBe(depthBefore);
    await prisma.$disconnect();
  }, 60_000);
});

describe('V05 dos asuntos', () => {
  it('una lesión aclarada no borra el límite de otro asunto', async () => {
    const person = await account('v05');
    const indication = { activity: 'caminar', subjectRef: 'rodilla', scope: 'caminar suave', restrictions: 'sin pendiente', allows: ['PHYSICAL_EXERTION'] };
    const knee = await call(person.token, 'post', '/journey/accompaniment/preview', {
      goalKind: 'CONSTRUIR_O_PROBAR', goalText: 'Caminar un poco más.', territory: 'SALUD_FISICA', actionSubject: 'rodilla',
      occasions: 1, weeklyMinutes: 20, minutesPerOccasion: 20, reviewMinutes: 0,
      limits: [{ subjectRef: 'rodilla', outcome: 'CURRENT_LIMIT' }], indication,
    });
    const shoulder = await call(person.token, 'post', '/journey/accompaniment/preview', {
      goalKind: 'CUIDAR', goalText: 'Pedir la hora de control.', territory: 'SALUD_FISICA', actionSubject: 'hombro',
      occasions: 1, weeklyMinutes: 20, reviewMinutes: 0,
      limits: [{ subjectRef: 'hombro', outcome: 'NO_CURRENT_LIMIT' }, { subjectRef: 'rodilla', outcome: 'CURRENT_LIMIT' }],
    });
    const money = await call(person.token, 'post', '/journey/accompaniment/preview', {
      goalKind: 'ORDENAR', goalText: 'Listar obligaciones.', territory: 'FINANZAS', actionSubject: 'finanzas',
      occasions: 1, weeklyMinutes: 20, reviewMinutes: 0,
      limits: [{ subjectRef: 'hombro', outcome: 'NO_CURRENT_LIMIT' }, { subjectRef: 'rodilla', outcome: 'CURRENT_LIMIT' }],
    });
    expect(knee.body.proposal.incompatible?.reason ?? '').toMatch(/límite vigente/);
    expect(shoulder.body.proposal.incompatible).toBeNull();
    expect(money.body.proposal.incompatible).toBeNull();
    expect(money.body.proposal.familyId).toBe('FIN-EST');
    expect(knee.body.proposal.indexUsed).toBe(false);
  }, 60_000);
});

describe('recorrido desde la devolución', () => {
  it('muestra caminos, confirma guía o plan propio, registra y lo vuelve a leer', async () => {
    process.env.MK_CLOCK_DAY = '2026-10-12';
    const guided = await account('guiada');
    const reading = await call(guided.token, 'get', '/journey/devolution');
    expect(reading.status).toBeLessThan(400);
    expect(reading.body.paths.map((path: { id: string }) => path.id)).toEqual(expect.arrayContaining(['EXPLORAR', 'SEGUIR']));
    const preview = await call(guided.token, 'post', '/journey/accompaniment/preview', {
      ...teach,
      goalText: 'Escribir una guía breve.',
      helpPreference: 'GUIADA',
      path: 'PREPARAR',
    });
    expect(preview.status, JSON.stringify(preview.body)).toBeLessThan(400);
    expect(preview.body.proposal.requiresAction).toBe(true);
    const confirmed = await call(guided.token, 'post', '/journey/accompaniment', {
      ...teach,
      goalText: 'Escribir una guía breve.',
      helpPreference: 'GUIADA',
      path: 'PREPARAR',
      digest: preview.body.digest,
      headVersion: preview.body.headVersion,
      commandKey: 'recorrido-guiada',
    });
    expect(confirmed.status, JSON.stringify(confirmed.body)).toBeLessThan(400);
    const recorded = await call(guided.token, 'post', '/journey/records', {
      actionId: confirmed.body.effect.actionId,
      day: '2026-10-12',
      status: 'DONE',
      resultStatus: 'NOT_OBSERVED',
    });
    expect(recorded.status).toBeLessThan(400);
    const closed = await call(guided.token, 'post', '/journey/weeks/close', {
      weekStart: '2026-10-12',
      decisions: { [confirmed.body.effect.actionId]: 'KEEP' },
    });
    expect(closed.status, JSON.stringify(closed.body)).toBeLessThan(400);
    const login = await request(server()).post('/api/v1/auth/login').set('Connection', 'close').send({ email: guided.email, password: 'Recorrido2026' });
    expect(login.status).toBe(201);
    const again = await call(login.body.accessToken, 'get', '/journey/devolution');
    expect(again.body.saved).toMatchObject({ preference: 'GUIADA', path: 'PREPARAR' });
    const state = await call(login.body.accessToken, 'get', '/journey/state');
    expect(state.body.indexes?.alignment?.general ?? null).toBeNull();

    const own = await account('propio');
    const ownReading = await call(own.token, 'get', '/journey/devolution');
    expect(ownReading.body.paths.some((path: { id: string }) => path.id === 'SEGUIR')).toBe(true);
    const ownPreview = await call(own.token, 'post', '/journey/accompaniment/preview', {
      goalText: 'Mi propio método.',
      goalKind: 'ENTREGAR',
      territory: 'MENTALIDAD',
      occasions: 1,
      weeklyMinutes: 30,
      reviewMinutes: 0,
      helpPreference: 'PROPIO',
      path: 'SEGUIR',
    });
    expect(ownPreview.body.proposal.requiresAction).toBe(false);
    const ownConfirm = await call(own.token, 'post', '/journey/accompaniment', {
      goalText: 'Mi propio método.',
      goalKind: 'ENTREGAR',
      territory: 'MENTALIDAD',
      occasions: 1,
      weeklyMinutes: 30,
      reviewMinutes: 0,
      helpPreference: 'PROPIO',
      path: 'SEGUIR',
      digest: ownPreview.body.digest,
      headVersion: ownPreview.body.headVersion,
      choice: 'ACCEPT',
      commandKey: 'recorrido-propio',
    });
    expect(ownConfirm.status, JSON.stringify(ownConfirm.body)).toBeLessThan(400);
    expect(ownConfirm.body.effect.actionId).toBeNull();
    const plan = await call(own.token, 'post', '/journey/plans', {
      title: 'Escribir a mi modo',
      outcome: 'Hay un párrafo.',
      priorityNote: 'Lo hago el lunes, 30 minutos.',
      linkKind: 'DIRECT',
    });
    expect(plan.status, JSON.stringify(plan.body)).toBeLessThan(400);
    const action = await call(own.token, 'post', `/journey/plans/${plan.body.id}/actions`, {
      title: 'Escribir a mi modo',
      doneWhen: 'Hay un párrafo.',
      weekday: 1,
    });
    expect(action.status).toBeLessThan(400);
    expect((await call(own.token, 'patch', `/journey/plans/${plan.body.id}`, activatePlanBody())).status).toBeLessThan(400);
    expect((await call(own.token, 'post', '/journey/records', {
      actionId: action.body.id, day: '2026-10-12', status: 'DONE', resultStatus: 'OBSERVED',
    })).status).toBeLessThan(400);
    expect((await call(own.token, 'post', '/journey/weeks/close', {
      weekStart: '2026-10-12', decisions: { [action.body.id]: 'KEEP' },
    })).status).toBeLessThan(400);
    const ownLogin = await request(server()).post('/api/v1/auth/login').set('Connection', 'close').send({ email: own.email, password: 'Recorrido2026' });
    const reread = await call(ownLogin.body.accessToken, 'get', '/journey/devolution');
    expect(reread.body.saved).toMatchObject({ preference: 'PROPIO', path: 'SEGUIR' });
    const plans = await call(ownLogin.body.accessToken, 'get', '/journey/plans');
    expect(JSON.stringify(plans.body)).toContain('Escribir a mi modo');
  }, 60_000);
});

describe('404 controlado', () => {
  it('una ruta inexistente responde 404 con identificador y cuerpo', async () => {
    const missing = await call(null, 'get', '/ruta-inexistente-mk');
    expect(missing.status).toBe(404);
    expect(missing.headers['x-request-id']).toBeTruthy();
    expect(JSON.stringify(missing.body).length).toBeGreaterThan(2);
    const address = server().address();
    if (!address || typeof address === 'string') return;
    const raw = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port: address.port, path: '/api/v1/ruta-inexistente-mk', method: 'GET', headers: { 'x-mk-test-id': 'raw-1' } }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') }));
      });
      req.on('error', reject);
      req.end();
    });
    expect(raw.status).toBe(404);
    expect(raw.body.length).toBeGreaterThan(2);
  });
});
