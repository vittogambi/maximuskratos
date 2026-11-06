import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootApi } from './journey-http-app';

process.env.MK_CLOCK_DAY = '2026-10-13';
const clock = { today() { return process.env.MK_CLOCK_DAY ?? '2026-10-13'; } };
let app: INestApplication;
let prisma: PrismaClient;

function server() { return app.getHttpServer(); }

async function call(token: string, method: 'get' | 'post' | 'patch', path: string, body?: unknown) {
  const req = request(server())[method](`/api/v1${path}`).set('Connection', 'close').set('Authorization', `Bearer ${token}`);
  return body === undefined ? req : req.send(body);
}

async function account() {
  const email = `mk.direction.${Date.now()}@fixtures.mk.invalid`;
  const res = await request(server()).post('/api/v1/auth/register').set('Connection', 'close').send({ email, password: 'Recorrido2026' });
  expect(res.status).toBe(201);
  return { token: res.body.accessToken as string, userId: res.body.user.id as string };
}

beforeAll(async () => {
  app = await bootApi({ clock });
  prisma = new PrismaClient();
});

afterAll(async () => {
  await prisma.$disconnect();
  await app.close();
});

describe('direction and change first plan fields', () => {
  it('creates a new purpose revision on each save and keeps old plan link', async () => {
    const { token, userId } = await account();
    const first = await call(token, 'post', '/journey/direction', {
      mode: 'CLEAR',
      statement: 'Enseñar mi método',
      desiredChange: 'Tiempo familiar',
      commandKey: `dir-${Date.now()}`,
    });
    expect(first.status).toBe(201);
    const rev1 = first.body.purposeRevisionId as string;

    const planRes = await call(token, 'post', '/journey/intervention/mentalidad/plans', {
      templateId: 'MEN-A1',
      commandKey: `plan-${Date.now()}`,
      change: 'Probar una explicación',
      why: 'Contribuye a enseñar',
      observableResult: 'Una persona entiende el método',
      linkKind: 'DIRECT',
      purposeRevisionId: rev1,
    });
    expect(planRes.status).toBeLessThan(400);
    const planId = planRes.body.plan.id as string;
    const planRow = await prisma.personalPlan.findFirst({ where: { id: planId, userId } });
    expect(planRow?.purposeRevisionId).toBe(rev1);
    expect(planRow?.outcome).toBe('Una persona entiende el método');
    expect(planRow?.whyItMatters).toBe('Contribuye a enseñar');

    const second = await call(token, 'post', '/journey/direction', {
      mode: 'CLEAR',
      statement: 'Otra dirección',
      desiredChange: 'Nuevo cambio',
      commandKey: `dir2-${Date.now()}`,
    });
    expect(second.status).toBe(201);
    expect(second.body.purposeRevisionId).not.toBe(rev1);

    const planAfter = await prisma.personalPlan.findFirst({ where: { id: planId, userId } });
    expect(planAfter?.purposeRevisionId).toBe(rev1);
    expect(planAfter?.whyItMatters).toBe('Contribuye a enseñar');
  });

  it('GET direction exposes revision and sources', async () => {
    const { token } = await account();
    await call(token, 'post', '/journey/direction', {
      mode: 'UNKNOWN',
      statement: 'Explorar sueño',
      commandKey: `dir-get-${Date.now()}`,
    });
    const view = await call(token, 'get', '/journey/direction');
    expect(view.status).toBe(200);
    expect(view.body.statement).toBe('Explorar sueño');
    expect(view.body.revision).toBeGreaterThan(0);
  });

  it('stores exploration draft in place and publishes on confirm', async () => {
    const { token, userId } = await account();
    const before = await prisma.purposeRevision.count({ where: { userId } });
    const draftRes = await call(token, 'put', '/journey/direction/exploration', {
      draft: {
        step: 'contribution',
        experience: 'Ayudé a un compañero a entender un problema',
        whyImportant: 'Me importó que después pudiera resolverlo solo',
        contribution: 'Querría hacer eso con personas que están empezando',
      },
    });
    expect(draftRes.status).toBe(200);
    expect(draftRes.body.draft.step).toBe('contribution');
    expect(draftRes.body.synthesis.pair.to.text).toMatch(/empezando/i);
    expect(draftRes.body.synthesis).not.toHaveProperty('text');
    const afterDraft = await prisma.purposeRevision.count({ where: { userId } });
    expect(afterDraft).toBe(before > 0 ? before : 1);

    const confirm = await call(token, 'post', '/journey/direction/exploration/confirm', {
      statement: 'Acompañar a personas que están empezando',
      commandKey: `exp-confirm-${Date.now()}`,
    });
    expect(confirm.status).toBe(201);
    const direction = await call(token, 'get', '/journey/direction');
    expect(direction.body.mode).toBe('UNKNOWN');
    expect(direction.body.statement).toMatch(/empezando/i);
  });
});
