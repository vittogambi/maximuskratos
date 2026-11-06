import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { templateById } from '../src/journey/intervention/registry';
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

async function account(label: string) {
  const email = `mk.accept.${label}.${Date.now()}@fixtures.mk.invalid`;
  const res = await request(server()).post('/api/v1/auth/register').set('Connection', 'close').send({ email, password: 'Recorrido2026' });
  expect(res.status).toBe(201);
  return { token: res.body.accessToken as string, userId: res.body.user.id as string };
}

async function backdateActivation(planId: string, day: string) {
  await prisma.personalPlan.update({
    where: { id: planId },
    data: { activatedAt: new Date(`${day}T12:00:00.000Z`) },
  });
}

async function activateA1(token: string, opts?: { minimum?: boolean; focusText?: string }) {
  const created = await call(token, 'post', '/journey/intervention/mentalidad/plans', {
    templateId: 'MEN-A1',
    focusText: opts?.focusText,
    commandKey: `a1-${Date.now()}`,
  });
  expect(created.status, JSON.stringify(created.body)).toBeLessThan(400);
  const planId = created.body.plan.id as string;
  const patch = await call(token, 'patch', `/journey/intervention/mentalidad/plans/${planId}`, {
    minimum: opts?.minimum ?? false,
    weeklyMinutes: opts?.minimum ? 10 : 20,
    occasionsPerWeek: 1,
    minutesPerOccasion: opts?.minimum ? 10 : 20,
    horizonWeeks: 3,
    protectNote: 'Por ahora no hay nada que cuidar.',
  });
  expect(patch.status).toBe(200);
  const activated = await call(token, 'post', `/journey/intervention/mentalidad/plans/${planId}/activate`, {
    confirmed: true,
    commandKey: `act-${planId}`,
  });
  expect(activated.status, JSON.stringify(activated.body)).toBeLessThan(400);
  return planId;
}

beforeAll(async () => {
  app = await bootApi({ clock });
  prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
}, 60_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await app?.close();
});

describe('Aceptación revisión conjunta', () => {
  it('dos planes activos guardan decisiones y cierran una sola vez sin duplicar', async () => {
    process.env.MK_CLOCK_DAY = '2026-10-20';
    const owner = await account('dual');
    const planA = await activateA1(owner.token);
    const planB = await activateA1(owner.token);
    const weekStart = '2026-10-12';
    const saveA = await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planA}/review-decision`, {
      choice: 'KEEP', weekStart, commandKey: 'dual-a',
    });
    expect(saveA.status).toBeLessThan(400);
    const saveB = await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planB}/review-decision`, {
      choice: 'KEEP', weekStart, commandKey: 'dual-b',
    });
    expect(saveB.status).toBeLessThan(400);
    const pending = await call(owner.token, 'get', `/journey/intervention/week-review/pending?weekStart=${weekStart}`);
    expect(pending.body.pending).toHaveLength(2);
    const applied = await call(owner.token, 'post', '/journey/intervention/week-review/apply', {
      weekStart, commandKey: 'dual-apply',
    });
    expect(applied.status, JSON.stringify(applied.body)).toBeLessThan(400);
    expect(applied.body.applied).toBe(2);
    const again = await call(owner.token, 'post', '/journey/intervention/week-review/apply', {
      weekStart, commandKey: 'dual-apply',
    });
    expect(again.status, JSON.stringify(again.body)).toBeLessThan(400);
    expect(again.body.repeated).toBe(true);
    expect(again.body.applied).toBe(2);
    const otherKey = await call(owner.token, 'post', '/journey/intervention/week-review/apply', {
      weekStart, commandKey: 'dual-apply-other',
    });
    expect(otherKey.status).toBe(409);
    expect(otherKey.body.code).toBe('WEEK_ALREADY_CLOSED');
    const otherNote = await call(owner.token, 'post', '/journey/intervention/week-review/apply', {
      weekStart, commandKey: 'dual-apply', note: 'otra nota',
    });
    expect(otherNote.status).toBe(409);
    expect(otherNote.body.code).toBe('STALE_REVIEW');
    const stranger = await account('dual-other');
    const crossed = await call(stranger.token, 'post', '/journey/intervention/week-review/apply', {
      weekStart, commandKey: 'dual-apply',
    });
    expect(crossed.status).toBe(400);
    expect(await prisma.weekReview.count({ where: { userId: owner.userId, weekStart } })).toBe(1);
    expect(await prisma.weekReview.count({ where: { userId: stranger.userId, weekStart } })).toBe(0);
  }, 60_000);

  it('rechaza aplicar si la acción cambió después de preparar el cierre', async () => {
    process.env.MK_CLOCK_DAY = '2026-10-20';
    const owner = await account('stale-apply');
    const planId = await activateA1(owner.token);
    const weekStart = '2026-10-12';
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/review-decision`, {
      choice: 'KEEP', weekStart, commandKey: 'stale-one',
    });
    const action = await prisma.planAction.findFirstOrThrow({ where: { planId } });
    await prisma.planAction.update({ where: { id: action.id }, data: { title: 'Título cambiado' } });
    const applied = await call(owner.token, 'post', '/journey/intervention/week-review/apply', {
      weekStart, commandKey: 'stale-apply',
    });
    expect(applied.status).toBe(409);
    expect(applied.body.code).toBe('STALE_REVIEW');
  }, 60_000);
});

describe('Contrato propio', () => {
  it('alinea el identificador con el snapshot y no reescribe un plan activo', async () => {
    process.env.MK_CLOCK_DAY = '2026-10-20';
    const owner = await account('own-id');
    const created = await call(owner.token, 'post', '/journey/intervention/mentalidad/plans', {
      templateId: 'MEN-A2', readingIds: [], commandKey: `own-${Date.now()}`,
    });
    expect(created.status).toBeLessThan(400);
    const planId = created.body.plan.id as string;
    const own = await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}/own-contract`, {
      seeks: 'Mi método',
      action: 'Leer en voz alta el borrador',
      doneWhen: 'El borrador quedó marcado',
      indicatorQuestion: '¿Quedó marcado?',
      horizonWeeks: 3,
    });
    expect(own.status, JSON.stringify(own.body)).toBeLessThan(400);
    const proposal = await prisma.planProposal.findFirstOrThrow({ where: { planId }, orderBy: { createdAt: 'desc' } });
    const payload = proposal.payload as { templateId: string; originTemplateId?: string; templateSnapshot: { id: string; action: string }; load: unknown };
    expect(payload.templateId.startsWith('OWN-')).toBe(true);
    expect(payload.templateSnapshot.id).toBe(payload.templateId);
    expect(payload.templateSnapshot.action).toBe('Leer en voz alta el borrador');
    expect(payload.originTemplateId).toBe('MEN-A2');
    expect(proposal.templateRef?.startsWith(payload.templateId)).toBe(true);
    const adjusted = await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}`, {
      minimum: false, horizonWeeks: 3, weeklyMinutes: 40, occasionsPerWeek: 2, minutesPerOccasion: 20, protectNote: 'Nada.',
    });
    expect(adjusted.status).toBe(200);
    const activated = await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/activate`, {
      confirmed: true, commandKey: `own-act-${planId}`,
    });
    expect(activated.status, JSON.stringify(activated.body)).toBeLessThan(400);
    const blocked = await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}/own-contract`, {
      seeks: 'Otro', action: 'Otra acción', doneWhen: 'Otro criterio', indicatorQuestion: '¿Otra?',
    });
    expect(blocked.status).toBe(409);
    const after = await prisma.planProposal.findFirstOrThrow({ where: { planId }, orderBy: { createdAt: 'desc' } });
    expect((after.payload as { templateSnapshot: { action: string } }).templateSnapshot.action).toBe('Leer en voz alta el borrador');
  }, 60_000);
});

describe('Aceptación ejecución y snapshot', () => {
  it('cobertura incompleta no propone mantener como evidencia completa', async () => {
    process.env.MK_CLOCK_DAY = '2026-10-16';
    const owner = await account('coverage');
    const created = await call(owner.token, 'post', '/journey/intervention/mentalidad/plans', { templateId: 'MEN-C1', commandKey: 'cov-c1' });
    const planId = created.body.plan.id as string;
    await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}`, {
      weeklyMinutes: 50, occasionsPerWeek: 5, minutesPerOccasion: 10, horizonWeeks: 1, protectNote: 'El sueño.',
    });
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/activate`, { confirmed: true, commandKey: 'cov-act' });
    await backdateActivation(planId, '2026-10-16');
    const action = await prisma.planAction.findFirstOrThrow({ where: { planId } });
    await prisma.actionRecord.create({ data: { actionId: action.id, day: '2026-10-16', status: 'DONE' } });
    process.env.MK_CLOCK_DAY = '2026-10-20';
    const read = await call(owner.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(read.body.execution.coverage).toBe('INCOMPLETE');
    expect(read.body.execution.ratioOfResolved).toBe(100);
    expect(read.body.review.code).toBe('NO_RECORDS');
  }, 60_000);

  it('conserva snapshot aunque cambie la plantilla en código', async () => {
    const owner = await account('snapshot');
    const planId = await activateA1(owner.token);
    const proposal = await prisma.planProposal.findFirstOrThrow({ where: { planId } });
    const payload = proposal.payload as { templateSnapshot: { indicators: { question: string }[] } };
    const oldQuestion = payload.templateSnapshot.indicators[0]!.question;
    payload.templateSnapshot.indicators[0]!.question = 'Pregunta congelada en snapshot';
    await prisma.planProposal.update({ where: { id: proposal.id }, data: { payload } });
    const live = templateById('MEN-A1')!;
    expect(live.indicators[0]!.question).not.toBe('Pregunta congelada en snapshot');
    const read = await call(owner.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(read.body.indicators[0].indicator.question).toBe('Pregunta congelada en snapshot');
    expect(oldQuestion).toBeTruthy();
  }, 60_000);
});

describe('Aceptación MODIFY y meta sin cuestionario', () => {
  it('MODIFY aplicado tarde entra el lunes siguiente a la aplicación y conserva registros previos', async () => {
    process.env.MK_CLOCK_DAY = '2026-10-16';
    const owner = await account('modify');
    const created = await call(owner.token, 'post', '/journey/intervention/mentalidad/plans', { templateId: 'MEN-C1', commandKey: 'mod-c1' });
    const planId = created.body.plan.id as string;
    await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}`, {
      weeklyMinutes: 50, occasionsPerWeek: 5, minutesPerOccasion: 10, horizonWeeks: 1, protectNote: 'El sueño.',
    });
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/activate`, { confirmed: true, commandKey: 'mod-act' });
    await backdateActivation(planId, '2026-10-16');
    const action = await prisma.planAction.findFirstOrThrow({ where: { planId } });
    const oldTitle = action.title;
    for (let day = 0; day < 5; day += 1) {
      await prisma.actionRecord.create({ data: { actionId: action.id, day: `2026-10-${13 + day}`, status: 'DONE' } });
    }
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/indicator`, {
      indicatorRef: 'ind-men-termine@0.1', value: 0, commandKey: 'mod-ind',
    });
    process.env.MK_CLOCK_DAY = '2026-10-23';
    const read = await call(owner.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(read.body.review.code).toBe('CHECK');
    const decision = await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/review-decision`, {
      choice: 'MODIFY',
      weekStart: '2026-10-12',
      revision: { title: 'Retomar en diez minutos', doneWhen: 'Quedó hecho en diez minutos.' },
      commandKey: 'mod-dec',
    });
    expect(decision.status, JSON.stringify(decision.body)).toBeLessThan(400);
    const applied = await call(owner.token, 'post', '/journey/intervention/week-review/apply', { weekStart: '2026-10-12', commandKey: 'mod-apply' });
    expect(applied.status, JSON.stringify(applied.body)).toBeLessThan(400);
    const kept = await prisma.planAction.findFirstOrThrow({ where: { id: action.id } });
    expect(kept.title).toBe(oldTitle);
    expect(kept.active).toBe(false);
    const successor = await prisma.planAction.findFirstOrThrow({ where: { replacesActionId: action.id } });
    expect(successor.title).toBe('Retomar en diez minutos');
    expect(successor.effectiveFrom).toBe('2026-10-26');
    expect(kept.effectiveTo).toBe('2026-10-25');
    expect(await prisma.actionRecord.count({ where: { actionId: action.id, day: '2026-10-14', status: 'DONE' } })).toBe(1);
  }, 60_000);

  it('meta clara sin cuestionario llega al plan activo', async () => {
    const owner = await account('meta');
    const created = await call(owner.token, 'post', '/journey/intervention/mentalidad/plans', {
      templateId: 'MEN-B1',
      focusText: 'Cerrar propuesta al cliente',
      stageDefinition: 'Existe borrador enviado al cliente.',
      commandKey: 'meta-b1',
    });
    expect(created.status).toBeLessThan(400);
    expect(created.body.plan.title).toContain('Cerrar propuesta');
    const planId = created.body.plan.id as string;
    await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}`, {
      weeklyMinutes: 50, occasionsPerWeek: 2, minutesPerOccasion: 25, horizonWeeks: 2,
      protectNote: 'Por ahora no hay nada que cuidar.',
      stageDefinition: 'Existe borrador enviado.',
    });
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/activate`, { confirmed: true, commandKey: 'meta-act' });
    const read = await call(owner.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(read.body.focusText).toBe('Cerrar propuesta al cliente');
    expect(read.body.general).toBe(true);
    expect(read.body.readings).toEqual([]);
  }, 60_000);
});

describe('Aceptación restricciones y MEN-A1', () => {
  it('SAL-A1 en catálogo rechaza activación con límite vigente', async () => {
    const owner = await account('sal-a1');
    const created = await call(owner.token, 'post', '/journey/intervention/salud_fisica/plans', { templateId: 'SAL-A1', commandKey: 'sal-a1' });
    expect(created.status).toBeLessThan(400);
    const planId = created.body.plan.id as string;
    await call(owner.token, 'patch', `/journey/intervention/salud_fisica/plans/${planId}`, {
      weeklyMinutes: 90, occasionsPerWeek: 3, minutesPerOccasion: 30, horizonWeeks: 4, protectNote: 'Rodilla.',
    });
    await prisma.memberClarification.create({
      data: { userId: owner.userId, scope: 'HEALTH', outcome: 'CURRENT_LIMIT' },
    });
    const activated = await call(owner.token, 'post', `/journey/intervention/salud_fisica/plans/${planId}/activate`, {
      confirmed: true, commandKey: 'sal-act',
    });
    expect(activated.status).toBe(403);
    expect(await prisma.planAction.count({ where: { planId } })).toBe(0);
  }, 60_000);

  it('rechaza activación incompatible sin crear acción', async () => {
    const owner = await account('restrict');
    const created = await call(owner.token, 'post', '/journey/intervention/mentalidad/plans', { templateId: 'MEN-A1', commandKey: 'rest-a1' });
    const planId = created.body.plan.id as string;
    const proposal = await prisma.planProposal.findFirstOrThrow({ where: { planId } });
    const payload = proposal.payload as Record<string, unknown>;
    const snap = payload.templateSnapshot as Record<string, unknown>;
    snap.contentTags = ['PHYSICAL_EXERTION'];
    await prisma.planProposal.update({ where: { id: proposal.id }, data: { payload } });
    await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}`, {
      weeklyMinutes: 20, occasionsPerWeek: 1, minutesPerOccasion: 20, horizonWeeks: 3, protectNote: 'Rodilla.',
    });
    await prisma.memberClarification.create({
      data: { userId: owner.userId, scope: 'HEALTH', outcome: 'CURRENT_LIMIT' },
    });
    const activated = await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/activate`, {
      confirmed: true, commandKey: 'rest-act',
    });
    expect(activated.status).toBe(403);
    expect(await prisma.planAction.count({ where: { planId } })).toBe(0);
    expect(await prisma.planTransition.count({ where: { planId, toStage: 'ACTIVE' } })).toBe(0);
  }, 60_000);

  it('preparación parcial persiste y el indicador exige revisión por prioridad', async () => {
    process.env.MK_CLOCK_DAY = '2026-10-14';
    const owner = await account('men-a1-prep');
    const planId = await activateA1(owner.token, { minimum: true });
    const weekStart = '2026-10-12';
    const draft = await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}/week-prep`, {
      weekStart,
      commandKey: 'prep-draft',
      payload: {
        priorities: [{ id: 'p1', advance: 'Avanzar informe', recognize: 'Borrador listo', nextStep: 'Escribir intro' }],
        primaryId: 'p1',
      },
    });
    expect(draft.status).toBe(200);
    const reload = await call(owner.token, 'get', `/journey/intervention/mentalidad/plans/${planId}/week-prep?weekStart=${weekStart}`);
    expect(reload.body.prep.priorities[0].advance).toBe('Avanzar informe');
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/week-prep/confirm`, {
      weekStart, commandKey: 'prep-confirm',
    });
    const blocked = await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/indicator`, {
      indicatorRef: 'ind-men-prioridad-unica@0.1', value: 1, commandKey: 'ind-block',
    });
    expect(blocked.status).toBe(400);
    await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}/week-prep/review-outcomes`, {
      weekStart,
      outcomes: { priorities: [{ id: 'p1', outcome: 'ACHIEVED' }] },
      commandKey: 'prep-review',
    });
    const withMeasure = await call(owner.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(withMeasure.body.indicators[0].answeredThisWeek).toBe(true);
    expect(withMeasure.body.indicators[0].latest?.value).toBe(1);
    await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}/week-prep/review-outcomes`, {
      weekStart,
      outcomes: { priorities: [{ id: 'p1', outcome: 'UNKNOWN' }] },
      commandKey: 'prep-unknown',
    });
    const afterUnknown = await call(owner.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(afterUnknown.body.indicators[0].answeredThisWeek).toBe(false);
    expect(await prisma.planEvidence.count({ where: { planId, periodStart: weekStart, indicatorRef: 'ind-men-prioridad-unica@0.1' } })).toBe(0);
  }, 60_000);

  it('invalida la decisión pendiente si cambia la revisión por prioridad', async () => {
    process.env.MK_CLOCK_DAY = '2026-10-20';
    const owner = await account('evidence-stale');
    const planId = await activateA1(owner.token, { minimum: true });
    const weekStart = '2026-10-12';
    await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}/week-prep`, {
      weekStart,
      commandKey: 'ev-prep',
      payload: {
        priorities: [{ id: 'p1', advance: 'Informe', recognize: 'Borrador', nextStep: 'Escribir' }],
        primaryId: 'p1',
      },
    });
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/week-prep/confirm`, { weekStart, commandKey: 'ev-confirm' });
    await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}/week-prep/review-outcomes`, {
      weekStart,
      outcomes: { priorities: [{ id: 'p1', outcome: 'ACHIEVED' }] },
      commandKey: 'ev-review',
    });
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/review-decision`, {
      choice: 'KEEP', weekStart, commandKey: 'ev-decision',
    });
    await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}/week-prep/review-outcomes`, {
      weekStart,
      outcomes: { priorities: [{ id: 'p1', outcome: 'NOT_ACHIEVED' }] },
      commandKey: 'ev-review-2',
    });
    const pending = await call(owner.token, 'get', `/journey/intervention/week-review/pending?weekStart=${weekStart}`);
    expect(pending.body.pending).toHaveLength(0);
    const applied = await call(owner.token, 'post', '/journey/intervention/week-review/apply', { weekStart, commandKey: 'ev-apply' });
    expect(applied.status).toBe(400);
  }, 60_000);

  it('rechaza aplicar si la evidencia cambió pero la decisión pendiente sigue', async () => {
    process.env.MK_CLOCK_DAY = '2026-10-20';
    const owner = await account('evidence-stale-apply');
    const planId = await activateA1(owner.token);
    const weekStart = '2026-10-12';
    await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}/week-prep`, {
      weekStart,
      commandKey: 'ev2-prep',
      payload: {
        priorities: [{ id: 'p1', advance: 'A', recognize: 'R', nextStep: 'S' }],
        primaryId: 'p1',
      },
    });
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/week-prep/confirm`, { weekStart, commandKey: 'ev2-confirm' });
    await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}/week-prep/review-outcomes`, {
      weekStart,
      outcomes: { priorities: [{ id: 'p1', outcome: 'ACHIEVED' }] },
      commandKey: 'ev2-review',
    });
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/review-decision`, {
      choice: 'KEEP', weekStart, commandKey: 'ev2-decision',
    });
    const proposal = await prisma.planProposal.findFirstOrThrow({ where: { planId } });
    const payload = proposal.payload as { pendingReviews: Record<string, { evidenceDigest: string }> };
    payload.pendingReviews[weekStart]!.evidenceDigest = 'digest-viejo';
    await prisma.planProposal.update({ where: { id: proposal.id }, data: { payload } });
    const applied = await call(owner.token, 'post', '/journey/intervention/week-review/apply', { weekStart, commandKey: 'ev2-apply' });
    expect(applied.status).toBe(409);
    expect(applied.body.code).toBe('STALE_REVIEW');
  }, 60_000);

  it('aisla preparación entre cuentas', async () => {
    const owner = await account('prep-owner');
    const other = await account('prep-other');
    const planId = await activateA1(owner.token);
    const foreign = await call(other.token, 'get', `/journey/intervention/mentalidad/plans/${planId}/week-prep`);
    expect(foreign.status).toBe(404);
  }, 60_000);
});
