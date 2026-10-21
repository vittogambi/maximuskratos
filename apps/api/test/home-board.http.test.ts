import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CORE_SIGNALS } from '../src/instrumentos/core-definition';
import { scoreAlignment } from '../src/instrumentos/core-index';
import { bootApi } from './journey-http-app';
import { activatePlanBody } from './plan-activation-body';

process.env.MK_CLOCK_DAY = '2026-10-12';
const clock = { today() { return process.env.MK_CLOCK_DAY ?? '2026-10-12'; } };
let app: INestApplication;

function server() { return app.getHttpServer(); }

async function call(token: string, method: 'get' | 'post', path: string, body?: unknown) {
  const req = request(server())[method](`/api/v1${path}`).set('Connection', 'close').set('Authorization', `Bearer ${token}`);
  return body === undefined ? req : req.send(body);
}

async function account(label: string, direction: string | null) {
  const email = `mk.home.${label}.${Date.now()}@fixtures.mk.invalid`;
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
  if (direction) {
    await prisma.purposeRevision.create({
      data: { userId, revision: 1, content: { directionStatus: direction, synthesis: { version: 2, activities: [], links: [], combinations: [], purpose: { status: direction === 'EXPLORANDO' ? 'EXPLORANDO' : 'PROVISIONAL', generated: 'Texto generado.', edited: 'Texto editado.', open: [] } } } },
    });
  }
  await prisma.$disconnect();
  return { token, userId };
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
  app = await bootApi({ clock });
});

afterAll(async () => {
  await app.close();
});

describe('tablero desde el recorrido', () => {
  it('lee el cierre, la exploración, el plan propio, la guía, la pausa y el retorno', async () => {
    const email = `mk.home.abierta.${Date.now()}@fixtures.mk.invalid`;
    const registered = await request(server()).post('/api/v1/auth/register').set('Connection', 'close').send({ email, password: 'Recorrido2026' });
    const openToken = registered.body.accessToken as string;
    expect((await call(openToken, 'post', '/diagnostic/start', {})).status).toBeLessThan(400);
    const openState = await call(openToken, 'get', '/journey/state');
    expect(openState.body.board.situation).toBe('QUESTIONNAIRE');

    const closed = await account('cerrada', null);
    const closedState = await call(closed.token, 'get', '/journey/state');
    expect(closedState.status).toBeLessThan(400);
    expect(closedState.body.board.situation).toBe('JUST_CLOSED');
    expect(closedState.body.indexes.alignment?.general ?? null).toBeNull();
    expect(closedState.body.board.depth?.components?.length ?? 0).toBeGreaterThan(0);

    const exploring = await account('explora', 'EXPLORANDO');
    const exploringState = await call(exploring.token, 'get', '/journey/state');
    expect(exploringState.body.board.situation).toBe('EXPLORING');
    expect(exploringState.body.board.synthesis).toMatchObject({ text: 'Texto editado.', source: 'EDITED' });

    const own = await account('propio', 'PROVISIONAL');
    const ownPreview = await call(own.token, 'post', '/journey/accompaniment/preview', {
      goalText: 'Mi propio método.', goalKind: 'ENTREGAR', territory: 'MENTALIDAD', occasions: 1, weeklyMinutes: 30, reviewMinutes: 0, helpPreference: 'PROPIO', path: 'SEGUIR',
    });
    expect(ownPreview.status).toBeLessThan(400);
    const ownConfirm = await call(own.token, 'post', '/journey/accompaniment', {
      goalText: 'Mi propio método.', goalKind: 'ENTREGAR', territory: 'MENTALIDAD', occasions: 1, weeklyMinutes: 30, reviewMinutes: 0, helpPreference: 'PROPIO', path: 'SEGUIR',
      digest: ownPreview.body.digest, headVersion: ownPreview.body.headVersion, choice: 'ACCEPT', commandKey: `home-propio-${own.userId}`,
    });
    expect(ownConfirm.status).toBeLessThan(400);
    const plan = await call(own.token, 'post', '/journey/plans', { title: 'Escribir a mi modo', outcome: 'Hay un párrafo.', priorityNote: 'Lo hago el lunes.', linkKind: 'DIRECT' });
    expect(plan.status).toBeLessThan(400);
    const action = await call(own.token, 'post', `/journey/plans/${plan.body.id}/actions`, { title: 'Escribir a mi modo', doneWhen: 'Hay un párrafo.', weekday: 1 });
    expect(action.status).toBeLessThan(400);
    expect((await call(own.token, 'patch', `/journey/plans/${plan.body.id}`, activatePlanBody())).status).toBeLessThan(400);
    const ownState = await call(own.token, 'get', '/journey/state');
    expect(ownState.body.board.situation).toBe('OWN');
    expect(ownState.body.board.plan).toMatchObject({ title: 'Escribir a mi modo', outcome: 'Hay un párrafo.', priorityNote: 'Lo hago el lunes.' });
    expect(ownState.body.board.occasion).toMatchObject({ day: '2026-10-12', criterion: 'Hay un párrafo.' });

    const guided = await account('guiada', 'PROVISIONAL');
    const preview = await call(guided.token, 'post', '/journey/accompaniment/preview', { ...teach, goalText: 'Explicar una tarea.', helpPreference: 'GUIADA', path: 'PREPARAR' });
    const confirmed = await call(guided.token, 'post', '/journey/accompaniment', {
      ...teach, goalText: 'Explicar una tarea.', helpPreference: 'GUIADA', path: 'PREPARAR', digest: preview.body.digest, headVersion: preview.body.headVersion, commandKey: `home-guia-${guided.userId}`,
    });
    expect(confirmed.status, JSON.stringify(confirmed.body)).toBeLessThan(400);
    const guidedState = await call(guided.token, 'get', '/journey/state');
    expect(guidedState.body.board.situation).toBe('GUIDED');
    expect(guidedState.body.board.occasion.criterion.length).toBeGreaterThan(0);
    const before = guidedState.body.indexes.alignment?.general ?? null;

    const pausePreview = await call(guided.token, 'post', '/journey/accompaniment/preview', { ...teach, goalText: 'Explicar una tarea.', situation: 'PAUSE', helpPreference: 'GUIADA', path: 'PREPARAR' });
    const paused = await call(guided.token, 'post', '/journey/accompaniment', {
      ...teach, goalText: 'Explicar una tarea.', situation: 'PAUSE', helpPreference: 'GUIADA', path: 'PREPARAR',
      digest: pausePreview.body.digest, headVersion: pausePreview.body.headVersion, commandKey: `home-pausa-${guided.userId}`,
    });
    expect(paused.status, JSON.stringify(paused.body)).toBeLessThan(400);
    const pausedState = await call(guided.token, 'get', '/journey/state');
    expect(pausedState.body.board.situation).toBe('PAUSED');
    expect(pausedState.body.board.occasion).toBeNull();
    expect(pausedState.body.indexes.alignment?.general ?? null).toBe(before);

    const backPreview = await call(guided.token, 'post', '/journey/accompaniment/preview', { situation: 'RETURN', helpPreference: 'GUIADA', path: 'PREPARAR' });
    const back = await call(guided.token, 'post', '/journey/accompaniment', {
      situation: 'RETURN', helpPreference: 'GUIADA', path: 'PREPARAR', digest: backPreview.body.digest, headVersion: backPreview.body.headVersion, commandKey: `home-retorno-${guided.userId}`,
    });
    expect(back.status, JSON.stringify(back.body)).toBeLessThan(400);
    const returnState = await call(guided.token, 'get', '/journey/state');
    expect(returnState.body.board.situation).toBe('RETURN');
    expect(returnState.body.board.direction.goalText).toBe('Explicar una tarea.');
  }, 60_000);

  it('muestra una medición parcial y una evolución comparable sin mover el índice al registrar', async () => {
    const person = await account('parcial', 'PROVISIONAL');
    const series = await account('serie', 'PROVISIONAL');
    const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    const partial = scoreAlignment([{ sourceRef: 'formulario-v1:E-AUD-001!R7', value: 3, catalogVersion: 'formulario-completo@6', answeredAt: '2026-10-01T12:00:00.000Z' }]);
    await prisma.coreReading.create({
      data: {
        userId: person.userId, kind: 'INITIAL', methodVersion: partial.methodVersion, definitionSha: partial.definitionSha,
        commandKey: `home-partial-${person.userId}`, input: {}, output: JSON.parse(JSON.stringify(partial)), computedAt: new Date('2026-10-01T15:00:00.000Z'),
      },
    });
    const partialState = await call(person.token, 'get', '/journey/state');
    expect(partialState.body.board.reading.general).toBeNull();
    expect(partialState.body.board.evolution.status).toBe('INITIAL');
    expect(partialState.body.board.territories.figure).toBeNull();
    expect(partialState.body.board.territories.method).toBeNull();
    const mind = partialState.body.board.territories.items.find((item: { territory: string }) => item.territory === 'MENTALIDAD');
    expect(mind.readings).toEqual([{ id: 'E7', raw: 3, scale: 'de 1 a 5' }]);

    const answers = (pick: (min: number, max: number) => number) => CORE_SIGNALS.map((signal) => ({
      sourceRef: signal.sourceRef, value: pick(signal.min, signal.max), catalogVersion: 'formulario-completo@6', answeredAt: '2026-10-02T12:00:00.000Z',
    }));
    const low = scoreAlignment(answers((min) => min));
    const high = scoreAlignment(answers((_min, max) => max));
    await prisma.coreReading.create({
      data: {
        userId: series.userId, kind: 'INITIAL', methodVersion: low.methodVersion, definitionSha: low.definitionSha,
        commandKey: `home-low-${series.userId}`, input: {}, output: JSON.parse(JSON.stringify(low)), computedAt: new Date('2026-10-02T15:00:00.000Z'),
      },
    });
    await prisma.coreReading.create({
      data: {
        userId: series.userId, kind: 'REMEASURE', methodVersion: high.methodVersion, definitionSha: high.definitionSha,
        commandKey: `home-high-${series.userId}`, input: {}, output: JSON.parse(JSON.stringify(high)), computedAt: new Date('2026-10-03T15:00:00.000Z'),
      },
    });
    await prisma.$disconnect();
    const compared = await call(series.token, 'get', '/journey/state');
    expect(compared.body.board.evolution.status).toBe('COMPARABLE');
    expect(compared.body.indexes.alignment.general).toBe(high.general);
    const plan = await call(series.token, 'post', '/journey/plans', { title: 'Medir', outcome: 'Quedó el número.', priorityNote: 'Hoy.', linkKind: 'DIRECT' });
    const action = await call(series.token, 'post', `/journey/plans/${plan.body.id}/actions`, { title: 'Medir', doneWhen: 'Quedó el número.', weekday: 1 });
    expect((await call(series.token, 'patch', `/journey/plans/${plan.body.id}`, activatePlanBody())).status).toBeLessThan(400);
    expect((await call(series.token, 'post', '/journey/records', { actionId: action.body.id, day: '2026-10-12', status: 'DONE', resultStatus: 'OBSERVED' })).status).toBeLessThan(400);
    expect((await call(series.token, 'post', '/journey/weeks/close', { weekStart: '2026-10-12', decisions: { [action.body.id]: 'KEEP' } })).status).toBeLessThan(400);
    const after = await call(series.token, 'get', '/journey/state');
    expect(after.body.indexes.alignment.general).toBe(high.general);
    expect(after.body.board.reading.general).toBe(high.general);
    expect(after.body.board.review.weekStart).toBe('2026-10-12');
  }, 60_000);
});
