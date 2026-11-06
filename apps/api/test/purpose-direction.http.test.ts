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

async function call(token: string, method: 'get' | 'post' | 'put' | 'patch', path: string, body?: unknown) {
  const req = request(server())[method](`/api/v1${path}`).set('Connection', 'close').set('Authorization', `Bearer ${token}`);
  return body === undefined ? req : req.send(body);
}

async function ok(res: request.Response) {
  expect(res.status, JSON.stringify(res.body)).toBeLessThan(400);
  return res.body;
}

async function account(label: string) {
  const email = `mk.purpose.${label}.${Date.now()}@fixtures.mk.invalid`;
  const res = await request(server()).post('/api/v1/auth/register').set('Connection', 'close').send({ email, password: 'Recorrido2026' });
  expect(res.status).toBe(201);
  return { token: res.body.accessToken as string, userId: res.body.user.id as string };
}

type Answer = { ref: string; text?: string; options?: string[]; exception?: 'UNKNOWN' | 'DECLINED' };

/** Fixture: a finished questionnaire with only the given answers, written straight to the disposable database. */
async function questionnaire(userId: string, answers: Answer[]) {
  const version = await prisma.diagnosticVersion.findFirstOrThrow({ where: { isActive: true } });
  const session = await prisma.diagnosticSession.create({
    data: { userId, versionId: version.id, status: 'COMPLETED', completedAt: new Date('2026-10-20T12:00:00.000Z') },
  });
  for (const answer of answers) {
    const question = await prisma.question.findFirstOrThrow({
      where: { sourceRef: `formulario-v1:E-PER-000!${answer.ref}`, module: { versionId: version.id } },
      include: { options: true },
    });
    const options = (answer.options ?? []).map((text) => {
      const option = question.options.find((row) => row.textEs.trim() === text);
      if (!option) throw new Error(`sin opción ${answer.ref} ${text}`);
      return option;
    });
    await prisma.response.create({
      data: {
        sessionId: session.id,
        questionId: question.id,
        selectedOptionIds: options.map((row) => row.id),
        ...(options.length ? { selectedOptions: { connect: options.map((row) => ({ id: row.id })) } } : {}),
        freeText: answer.text ?? null,
        exceptionKind: answer.exception ?? null,
      },
    });
  }
  return session;
}

async function valueOptions(ref: string, count: number) {
  const version = await prisma.diagnosticVersion.findFirstOrThrow({ where: { isActive: true } });
  const question = await prisma.question.findFirstOrThrow({
    where: { sourceRef: `formulario-v1:E-PER-000!${ref}`, module: { versionId: version.id } },
    include: { options: { orderBy: { order: 'asc' } } },
  });
  return question.options.slice(0, count).map((row) => row.textEs.trim());
}

beforeAll(async () => {
  app = await bootApi({ clock });
  prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
}, 60_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await app?.close();
});

describe('Propósito con lo que la persona respondió', () => {
  it('sin cuestionario ni dirección: nada inventado y Diseña funciona igual', async () => {
    const { token } = await account('vacio');
    const overview = await ok(await call(token, 'get', '/journey/direction/overview'));
    expect(overview.history).toEqual([]);
    expect(overview.linkedPlans).toEqual([]);
    expect(overview.evidence.map((row: { id: string; access: string; answered: number }) => [row.id, row.access, row.answered])).toEqual([
      ['vision', 'NOT_STARTED', 0],
      ['values', 'NOT_STARTED', 0],
      ['ikigai', 'NOT_STARTED', 0],
    ]);
    const exploration = await ok(await call(token, 'get', '/journey/direction/exploration'));
    expect(exploration.synthesis).toMatchObject({ pair: null, insufficient: true, reason: 'NO_ANSWERS' });
    const context = await ok(await call(token, 'get', '/journey/intervention/mentalidad/design-context'));
    expect(context.direction).toBeNull();
    const design = await call(token, 'post', '/journey/intervention/mentalidad/designs', { change: 'Dormir mejor' });
    expect(design.status).toBe(201);
  });

  it('con Visión y Valores, sin IKIGAI: respuestas literales, excepciones nombradas y fuentes congeladas al guardar', async () => {
    const { token, userId } = await account('vision');
    const r40 = await valueOptions('R40', 4);
    await questionnaire(userId, [
      { ref: 'R33', text: 'Vivir cerca del mar con mi familia' },
      { ref: 'R34', exception: 'DECLINED' },
      { ref: 'R40', options: r40 },
      { ref: 'R51', options: r40.slice(0, 3) },
    ]);
    const overview = await ok(await call(token, 'get', '/journey/direction/overview'));
    const [vision, values, ikigai] = overview.evidence;
    expect(vision.answered).toBe(1);
    expect(vision.groups.find((row: { id: string }) => row.id.endsWith('!R34')).items[0]).toEqual({ status: 'DECLINED', texts: [] });
    expect(values.groups.find((row: { id: string }) => row.id.endsWith('!R51')).items[0].texts).toEqual(r40.slice(0, 3));
    expect(ikigai).toMatchObject({ answered: 0, access: 'CLOSED' });

    const direction = await ok(await call(token, 'get', '/journey/direction'));
    expect(direction.sources.vision).toBe('Vivir cerca del mar con mi familia');
    await ok(await call(token, 'post', '/journey/direction', {
      mode: 'EXPLORE',
      statement: 'Construir una vida tranquila cerca de los míos',
      sourceIds: ['vision', 'inventada'],
      commandKey: `exp-${Date.now()}`,
    }));
    const saved = await ok(await call(token, 'get', '/journey/direction'));
    expect(saved).toMatchObject({ mode: 'EXPLORE', directionStatus: 'PROVISIONAL' });
    expect(saved.sourcesUsed).toEqual([{ id: 'vision', label: 'Tu respuesta sobre visión', text: 'Vivir cerca del mar con mi familia' }]);

    await ok(await call(token, 'post', '/journey/direction', { mode: 'CLEAR', statement: 'Cuidar a mi familia', commandKey: `clear-${Date.now()}` }));
    const after = await ok(await call(token, 'get', '/journey/direction'));
    expect(after.sourcesUsed).toEqual([]);
    const history = (await ok(await call(token, 'get', '/journey/direction/overview'))).history;
    expect(history.map((row: { statement: string; mode: string; current: boolean }) => [row.statement, row.mode, row.current])).toEqual([
      ['Cuidar a mi familia', 'CLEAR', true],
      ['Construir una vida tranquila cerca de los míos', 'EXPLORE', false],
    ]);
  });

  it('con IKIGAI: cuatro campos literales y un cruce que la persona hace y valora, sin tocar su dirección', async () => {
    const { token, userId } = await account('ikigai');
    await questionnaire(userId, [
      { ref: 'R220', text: 'Cocinar para otros' },
      { ref: 'R234', text: 'Acompañar a jóvenes que empiezan' },
    ]);
    await ok(await call(token, 'post', '/journey/direction', { mode: 'CLEAR', statement: 'Enseñar lo que sé', commandKey: `ik-${Date.now()}` }));
    const ikigai = (await ok(await call(token, 'get', '/journey/direction/overview'))).evidence[2];
    expect(ikigai.groups.map((row: { title: string; items: { texts: string[] }[] }) => [row.title, row.items[0]!.texts])).toEqual([
      ['Pasión', ['Cocinar para otros']],
      ['Vocación', []],
      ['Misión', ['Acompañar a jóvenes que empiezan']],
      ['Profesión', []],
    ]);
    const synthesis = await ok(await call(token, 'get', '/journey/synthesis'));
    expect(synthesis.links).toEqual([]);
    const [pasion, mision] = synthesis.activities;
    const saved = await call(token, 'post', '/journey/synthesis', {
      activities: synthesis.activities,
      links: [{ id: 'l1', fromRef: pasion.sourceRef, toRef: mision.sourceRef, combinationId: 'c1', reason: '', status: 'ACTIVE' }],
      combinations: [{ id: 'c1', reason: 'Las dos son dar algo', valuation: 'NOT_RECOGNIZED', valuationReason: '', experiment: '' }],
      purpose: synthesis.purpose,
    });
    expect(saved.status).toBeLessThan(400);
    const reread = await ok(await call(token, 'get', '/journey/synthesis'));
    expect(reread.combinations[0]).toMatchObject({ valuation: 'NOT_RECOGNIZED', reason: 'Las dos son dar algo' });
    const sameField = await call(token, 'post', '/journey/synthesis', {
      activities: synthesis.activities,
      links: [{ id: 'l2', fromRef: pasion.sourceRef, toRef: pasion.sourceRef, combinationId: 'c2', reason: '', status: 'ACTIVE' }],
      combinations: [{ id: 'c2', reason: '', valuation: null, valuationReason: '', experiment: '' }],
      purpose: synthesis.purpose,
    });
    expect(sameField.status).toBe(400);
    const direction = await ok(await call(token, 'get', '/journey/direction'));
    expect(direction).toMatchObject({ statement: 'Enseñar lo que sé', mode: 'CLEAR', directionStatus: 'CONFIRMADO_POR_USUARIO' });
  });

  it('texto de prueba: se guarda como lo escribió, pero no se convierte en una conexión', async () => {
    const { token } = await account('basura');
    const view = await ok(await call(token, 'put', '/journey/direction/exploration', {
      draft: { step: 'synthesis', experience: 'asdf', whyImportant: 'qwerty', contribution: 'test' },
    }));
    expect(view.draft.experience).toBe('asdf');
    expect(view.synthesis).toMatchObject({ pair: null, insufficient: true, reason: 'TOO_LITTLE' });
    expect(view.synthesis.shared.map((row: { text: string }) => row.text)).toEqual(['asdf', 'qwerty', 'test']);
  });

  it('respuestas contradictorias se muestran lado a lado sin resolverlas', async () => {
    const { token } = await account('contradice');
    const view = await ok(await call(token, 'put', '/journey/direction/exploration', {
      draft: { step: 'synthesis', whyImportant: 'Estar a solas y en silencio', contribution: 'Organizar fiestas grandes para mi barrio' },
    }));
    expect(view.synthesis.pair.from.text).toBe('Estar a solas y en silencio');
    expect(view.synthesis.pair.to.text).toBe('Organizar fiestas grandes para mi barrio');
    expect(view.synthesis.pair.rule).toMatch(/No sabemos si se relacionan/);
  });

  it('rechazar la conexión no deja nada reconocido; reconocer en parte guarda una dirección en exploración, no confirmada', async () => {
    const { token } = await account('reconoce');
    const base = { whyImportant: 'Que mi hijo confíe en mí', contribution: 'Acompañar a padres primerizos' };
    const rejected = await ok(await call(token, 'put', '/journey/direction/exploration', { draft: { step: 'synthesis', ...base, recognition: 'unseen' } }));
    expect(rejected.learning.recognized).toBeNull();
    const empty = await call(token, 'post', '/journey/direction/exploration/confirm', { statement: '', commandKey: `x-${Date.now()}` });
    expect(empty.status).toBe(400);

    await ok(await call(token, 'put', '/journey/direction/exploration', {
      draft: { recognition: 'partial', partialNote: 'Lo de mi hijo sí, lo de otros padres todavía no', provisionalDirection: 'Ser un padre presente' },
    }));
    await ok(await call(token, 'post', '/journey/direction/exploration/confirm', { statement: 'Ser un padre presente', commandKey: `p-${Date.now()}` }));
    const direction = await ok(await call(token, 'get', '/journey/direction'));
    expect(direction).toMatchObject({ statement: 'Ser un padre presente', mode: 'UNKNOWN', directionStatus: 'EXPLORANDO' });
    expect(direction.sourcesUsed.map((row: { id: string }) => row.id)).toEqual(['important', 'contribution']);
    const exploration = await ok(await call(token, 'get', '/journey/direction/exploration'));
    expect(exploration.draft).toMatchObject({ step: 'done', recognition: 'partial', directionPublished: true });
  });

  it('abandonar la exploración y volver la retoma donde quedó', async () => {
    const { token, userId } = await account('vuelve');
    await ok(await call(token, 'put', '/journey/direction/exploration', { draft: { step: 'contribution', experience: 'Cociné con mis hijos' } }));
    const revisions = await prisma.purposeRevision.count({ where: { userId } });
    const back = await ok(await call(token, 'get', '/journey/direction/exploration'));
    expect(back.draft).toMatchObject({ step: 'contribution', experience: 'Cociné con mis hijos' });
    expect(await prisma.purposeRevision.count({ where: { userId } })).toBe(revisions);
    const direction = await ok(await call(token, 'get', '/journey/direction'));
    expect(direction.statement).toBeNull();
  });

  it('cambiar la dirección después de vincular un plan no toca el plan ni la versión anterior', async () => {
    const { token, userId } = await account('cambia');
    const first = await ok(await call(token, 'post', '/journey/direction', { mode: 'CLEAR', statement: 'Enseñar mi oficio', commandKey: `c1-${Date.now()}` }));
    const created = await ok(await call(token, 'post', '/journey/intervention/mentalidad/designs', {
      change: 'Preparar una clase', purposeRevisionId: first.purposeRevisionId, linkKind: 'DIRECT',
    }));
    const before = await prisma.purposeRevision.findUniqueOrThrow({ where: { id: first.purposeRevisionId } });
    await ok(await call(token, 'post', '/journey/direction', { mode: 'EXPLORE', statement: 'Explorar si quiero enseñar', commandKey: `c2-${Date.now()}` }));
    const plan = await prisma.personalPlan.findFirstOrThrow({ where: { id: created.planId, userId } });
    expect(plan.purposeRevisionId).toBe(first.purposeRevisionId);
    const kept = await prisma.purposeRevision.findUniqueOrThrow({ where: { id: first.purposeRevisionId } });
    expect(kept.content).toEqual(before.content);
    const overview = await ok(await call(token, 'get', '/journey/direction/overview'));
    expect(overview.linkedPlans).toEqual([expect.objectContaining({ id: created.planId, revision: 1, current: false, linkKind: 'DIRECT' })]);
  });
});
