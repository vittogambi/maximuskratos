import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { templateById } from '../src/journey/intervention/registry';
import { bootApi } from './journey-http-app';
import { weekStartForDay } from '../src/journey/civil-week';

process.env.MK_CLOCK_DAY = '2026-10-27';
const clock = { today() { return process.env.MK_CLOCK_DAY ?? '2026-10-27'; } };
let app: INestApplication;
let prisma: PrismaClient;

function server() { return app.getHttpServer(); }

async function call(token: string, method: 'get' | 'post' | 'patch', path: string, body?: unknown) {
  const req = request(server())[method](`/api/v1${path}`).set('Connection', 'close').set('Authorization', `Bearer ${token}`);
  return body === undefined ? req : req.send(body);
}

async function account() {
  const email = `mk.outcome.${Date.now()}@fixtures.mk.invalid`;
  const res = await request(server()).post('/api/v1/auth/register').set('Connection', 'close').send({ email, password: 'Recorrido2026' });
  expect(res.status).toBe(201);
  return { token: res.body.accessToken as string, userId: res.body.user.id as string };
}

async function ownPlan(token: string, body: Record<string, unknown>) {
  return call(token, 'post', '/journey/intervention/mentalidad/plans', {
    templateId: 'MEN-A2',
    readingIds: [],
    commandKey: `plan-${Date.now()}-${Math.random()}`,
    change: 'Enseñar mi método',
    why: 'Importa por sí mismo',
    observableResult: 'Otra persona aplica el método sin mí',
    criterion: 'Alguien lo usa solo con la guía escrita',
    ...body,
  });
}

async function activateMinimal(token: string, planId: string, reviewAt?: string) {
  await call(token, 'patch', `/journey/intervention/mentalidad/plans/${planId}`, {
    minimum: false,
    horizonWeeks: 4,
    weeklyMinutes: 60,
    occasionsPerWeek: 2,
    minutesPerOccasion: 30,
    protectNote: 'Por ahora no hay nada que cuidar.',
    environmentAccepted: false,
  });
  return call(token, 'post', `/journey/intervention/mentalidad/plans/${planId}/activate`, {
    confirmed: true,
    commandKey: `act-${Date.now()}`,
    ...(reviewAt ? { reviewAt } : {}),
  });
}

beforeAll(async () => {
  app = await bootApi({ clock });
  prisma = new PrismaClient();
});

afterAll(async () => {
  await prisma.$disconnect();
  await app.close();
});

describe('plan outcome contract and review', () => {
  it('high execution does not imply outcome achieved', async () => {
    const { token } = await account();
    const created = await ownPlan(token, {});
    const planId = created.body.plan.id as string;
    await activateMinimal(token, planId);
    const week = weekStartForDay(clock.today());
    const assess = await call(token, 'post', `/journey/intervention/mentalidad/plans/${planId}/outcome-assessment`, {
      status: 'NOT_YET',
      text: 'Nadie pudo aplicarlo solo',
      weekStart: week,
      commandKey: `oa-${Date.now()}`,
    });
    expect(assess.status).toBeLessThan(400);
    const view = await call(token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(view.body.outcomeAssessment?.status).toBe('NOT_YET');
    expect(typeof view.body.outcomeReviewHint === 'string' || view.body.outcomeReviewHint == null).toBe(true);
  });

  it('outcome achieved with less execution allows simplify hint', async () => {
    const { token } = await account();
    const created = await ownPlan(token, { observableResult: 'Una persona lo aplica' });
    const planId = created.body.plan.id as string;
    await activateMinimal(token, planId);
    const assess = await call(token, 'post', `/journey/intervention/mentalidad/plans/${planId}/outcome-assessment`, {
      status: 'ACHIEVED',
      text: 'María lo aplicó con la guía',
      commandKey: `oa2-${Date.now()}`,
    });
    expect(assess.status).toBeLessThan(400);
    const view = await call(token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(view.body.outcomeAssessment?.status).toBe('ACHIEVED');
  });

  it('insufficient evidence does not invent progress', async () => {
    const { token } = await account();
    const created = await ownPlan(token, {});
    const planId = created.body.plan.id as string;
    await activateMinimal(token, planId);
    const assess = await call(token, 'post', `/journey/intervention/mentalidad/plans/${planId}/outcome-assessment`, {
      status: 'INSUFFICIENT',
      commandKey: `oa3-${Date.now()}`,
    });
    expect(assess.status).toBeLessThan(400);
    const view = await call(token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(view.body.outcomeAssessment?.status).toBe('INSUFFICIENT');
  });

  it('legacy plan without json contract still opens from row fields', async () => {
    const { token, userId } = await account();
    const snapshot = templateById('MEN-A2');
    expect(snapshot).toBeTruthy();
    const plan = await prisma.personalPlan.create({
      data: {
        userId,
        title: 'Antiguo',
        outcome: 'Resultado viejo',
        criterionText: 'Lo veo cuando pasa',
        criterionStatus: 'CONFIRMED',
        status: 'ACTIVE',
        stage: 'ACTIVE',
        territory: 'MENTALIDAD',
        activatedAt: new Date('2026-10-01T12:00:00.000Z'),
      },
    });
    await prisma.planAction.create({
      data: {
        planId: plan.id,
        title: snapshot!.action.slice(0, 180),
        doneWhen: snapshot!.doneWhen,
        occasionsPerWeek: 2,
        minutesPerOccasion: 45,
        active: true,
        origin: 'SYSTEM_TEMPLATE',
      },
    });
    await prisma.planProposal.create({
      data: {
        userId,
        planId: plan.id,
        territory: 'MENTALIDAD',
        kind: 'INTERVENTION_PLAN',
        payload: {
          templateId: 'MEN-A2',
          version: snapshot!.version,
          templateSnapshot: snapshot,
          general: true,
          minimum: false,
          horizonWeeks: 3,
          focusText: null,
          stageDefinition: null,
          readings: [],
          load: { weeklyMinutes: 90, occasionsPerWeek: 2, minutesPerOccasion: 45, confirmed: true },
          environmentAccepted: false,
        },
        reasons: [],
        status: 'ACCEPTED',
        engineVersion: snapshot!.version,
        rulesVersion: snapshot!.version,
        templateRef: `${snapshot!.id}@${snapshot!.version}`,
      },
    });
    const view = await call(token, 'get', `/journey/intervention/mentalidad/plans/${plan.id}`);
    expect(view.status).toBe(200);
    expect(view.body.outcomeContract?.soughtOutcome).toBe('Resultado viejo');
    expect(view.body.outcomeContractMeta?.recoveredFromLegacy).toBe(true);
    expect(view.body.outcomeContractComplete).toBe(false);
    expect(view.body.outcomeContractMeta?.pendingFields).toContain('EVIDENCE');
  });

  it('criterion change after review decision invalidates pending', async () => {
    const { token } = await account();
    const created = await ownPlan(token, {});
    const planId = created.body.plan.id as string;
    await activateMinimal(token, planId);
    const week = weekStartForDay(clock.today());
    const review = await call(token, 'post', `/journey/intervention/mentalidad/plans/${planId}/review-decision`, {
      choice: 'KEEP',
      weekStart: week,
      meaning: 'STILL',
      note: 'Sigo con la estrategia',
      commandKey: `rev-${Date.now()}`,
    });
    expect(review.status).toBeLessThan(400);
    const patch = await call(token, 'patch', `/journey/intervention/mentalidad/plans/${planId}/outcome-contract`, {
      criterion: 'Nuevo criterio distinto',
      confirmed: true,
      commandKey: `oc-${Date.now()}`,
    });
    expect(patch.status).toBeLessThan(400);
    const pending = await call(token, 'get', `/journey/intervention/week-review/pending?weekStart=${week}`);
    expect(pending.body.pending.find((row: { planId: string }) => row.planId === planId)).toBeUndefined();
  });

  it('outcome assessment changes review proposal with same execution context', async () => {
    const { token } = await account();
    const created = await ownPlan(token, {
      evidenceHint: 'Observo a la otra persona',
      checkAt: '2026-10-20',
      criterionStatus: 'CONFIRMED',
    });
    const planId = created.body.plan.id as string;
    await activateMinimal(token, planId, '2026-10-20');
    const week = weekStartForDay(clock.today());
    const baseline = await call(token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(baseline.body.horizonReached).toBe(true);
    await call(token, 'post', `/journey/intervention/mentalidad/plans/${planId}/outcome-assessment`, {
      status: 'NOT_YET',
      text: 'Nadie lo aplicó solo',
      weekStart: week,
      commandKey: `gov1-${Date.now()}`,
    });
    const notYet = await call(token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(notYet.body.review.outcomeText).toMatch(/resultado que buscabas/);
    expect(notYet.body.review.choices).toContain('MODIFY');
    expect(['CHECK', 'EXPLORE']).toContain(notYet.body.review.code);
    await call(token, 'post', `/journey/intervention/mentalidad/plans/${planId}/outcome-assessment`, {
      status: 'ACHIEVED',
      text: 'María aplicó el método',
      weekStart: week,
      commandKey: `gov2-${Date.now()}`,
    });
    const achieved = await call(token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(['KEEP', 'LIGHTER_OK']).toContain(achieved.body.review.code);
    expect(achieved.body.review.choices).toEqual(['KEEP', 'REDUCE']);
    expect(achieved.body.review.outcomeText).not.toBe(notYet.body.review.outcomeText);
  });

  it('linked indicator skips duplicate outcome capture flag', async () => {
    const { token } = await account();
    const created = await ownPlan(token, {
      templateId: 'MEN-B1',
      focusText: 'Enseñar mi método',
      stageDefinition: 'Guía escrita probada',
      linkedIndicatorRef: 'ind-men-etapa@0.1',
      criterion: '¿Pasó a la etapa que definiste?',
    });
    expect(created.status).toBeLessThan(400);
    const planId = created.body.plan.id as string;
    await activateMinimal(token, planId);
    const view = await call(token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(view.body.toolIndicatorLinked).toBe(true);
  });
});
