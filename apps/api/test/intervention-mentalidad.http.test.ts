import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootApi } from './journey-http-app';

process.env.MK_CLOCK_DAY = '2026-10-12';
const clock = { today() { return process.env.MK_CLOCK_DAY ?? '2026-10-12'; } };
let app: INestApplication;
let prisma: PrismaClient;

function server() { return app.getHttpServer(); }

async function call(token: string, method: 'get' | 'post' | 'patch', path: string, body?: unknown) {
  const req = request(server())[method](`/api/v1${path}`).set('Connection', 'close').set('Authorization', `Bearer ${token}`);
  return body === undefined ? req : req.send(body);
}

async function backdateActivation(planId: string, day: string) {
  await prisma.personalPlan.update({
    where: { id: planId },
    data: { activatedAt: new Date(`${day}T12:00:00.000Z`) },
  });
}

async function account(label: string) {
  const email = `mk.mentalidad.${label}.${Date.now()}@fixtures.mk.invalid`;
  const res = await request(server()).post('/api/v1/auth/register').set('Connection', 'close').send({ email, password: 'Recorrido2026' });
  expect(res.status).toBe(201);
  return { token: res.body.accessToken as string, userId: res.body.user.id as string };
}

/** Writes answers straight to the session; the questionnaire walk is covered elsewhere. */
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

beforeAll(async () => {
  app = await bootApi({ clock });
  prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
}, 60_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await app?.close();
});

describe('Mentalidad sin cuestionario', () => {
  it('ofrece el catálogo general, valida la carga, activa y registra el indicador con línea base', async () => {
    const owner = await account('general');
    const view = await call(owner.token, 'get', '/journey/intervention/mentalidad');
    expect(view.status).toBe(200);
    expect(view.body.hasAnswers).toBe(false);
    expect(view.body.readings).toEqual([]);
    expect(view.body.templates.map((row: { id: string }) => row.id)).toContain('MEN-A1');

    const missingFocus = await call(owner.token, 'post', '/journey/intervention/mentalidad/plans', { templateId: 'MEN-B1' });
    expect(missingFocus.status).toBe(400);

    const created = await call(owner.token, 'post', '/journey/intervention/mentalidad/plans', { templateId: 'MEN-A1', commandKey: 'a1-general' });
    expect(created.status, JSON.stringify(created.body)).toBeLessThan(400);
    expect(created.body.plan.stage).toBe('PREPARING');
    expect(created.body.plan.territory).toBe('MENTALIDAD');
    const again = await call(owner.token, 'post', '/journey/intervention/mentalidad/plans', { templateId: 'MEN-A1', commandKey: 'a1-general' });
    expect(again.body.repeated).toBe(true);
    expect(again.body.plan.id).toBe(created.body.plan.id);
    const planId = created.body.plan.id as string;

    const text = await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}`, { weeklyMinutes: '20 minutos', occasionsPerWeek: 1, minutesPerOccasion: 10 });
    expect(text.status).toBe(400);
    const tooMuch = await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}`, { weeklyMinutes: 10, occasionsPerWeek: 3, minutesPerOccasion: 10 });
    expect(tooMuch.status).toBe(400);
    const adjusted = await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}`, {
      minimum: true, weeklyMinutes: 10, occasionsPerWeek: 1, minutesPerOccasion: 10, horizonWeeks: 3, protectNote: 'El sueño.',
    });
    expect(adjusted.status, JSON.stringify(adjusted.body)).toBe(200);
    expect(adjusted.body.general).toBe(true);
    expect(adjusted.body.indicators[0].indicator.ref).toBe('ind-men-prioridad-unica@0.1');

    const activated = await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/activate`, {
      confirmed: true, minimumLoadConfirmed: true, commandKey: `act-${planId}`,
    });
    expect(activated.status, JSON.stringify(activated.body)).toBeLessThan(400);
    const repeat = await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/activate`, {
      confirmed: true, commandKey: `act-${planId}`,
    });
    expect(repeat.body.repeated).toBe(true);

    const wrongRef = await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/indicator`, { indicatorRef: 'ind-men-prioridades@0.1', value: 2 });
    expect(wrongRef.status).toBe(400);
    const outOfRange = await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/indicator`, { indicatorRef: 'ind-men-prioridad-unica@0.1', value: 3 });
    expect(outOfRange.status).toBe(400);
    const measured = await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/indicator`, {
      indicatorRef: 'ind-men-prioridad-unica@0.1', value: 1, commandKey: 'ind-1',
    });
    expect(measured.status, JSON.stringify(measured.body)).toBeLessThan(400);
    const repeated = await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/indicator`, {
      indicatorRef: 'ind-men-prioridad-unica@0.1', value: 1, commandKey: 'ind-1',
    });
    expect(repeated.body.repeated).toBe(true);
    const read = await call(owner.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(read.body.indicators[0].baseline.value).toBe(1);
    expect(read.body.indicators[0].answeredThisWeek).toBe(true);
    expect(read.body.review.code).toBeTruthy();

    const achievement = await call(owner.token, 'post', `/journey/plans/${planId}/achievement`, { confirm: true });
    expect(achievement.status).not.toBe(200);

    const other = await account('ajena');
    expect((await call(other.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`)).status).toBe(404);
    expect((await call(other.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/indicator`, { indicatorRef: 'ind-men-prioridad-unica@0.1', value: 1 })).status).toBe(404);
  }, 60_000);
});

describe('Mentalidad orientada por respuestas', () => {
  it('muestra lecturas, exige reconocimiento, deja de orientar al rechazar y no usa R19 sin etiquetas', async () => {
    const owner = await account('respuestas');
    await answer(owner.token, owner.userId, {
      'formulario-v1:E-AUD-001!R26': '2',
      'formulario-v1:E-AUD-001!R9': '2',
      'formulario-v1:E-PER-000!R134': '1',
      'formulario-v1:E-PER-000!R133': '2',
    });
    const view = await call(owner.token, 'get', '/journey/intervention/mentalidad');
    expect(view.status).toBe(200);
    const ids = view.body.readings.map((row: { id: string }) => row.id);
    expect(ids).toEqual(expect.arrayContaining(['planificacion', 'sostener', 'postergacion']));
    expect(view.body.prioritized).toBe(false);
    expect(view.body.readings.find((row: { id: string }) => row.id === 'postergacion').status).toBe('TO_CONFIRM');
    expect(view.body.modifiers.suggestMinimum).not.toBeNull();

    const notRecognized = await call(owner.token, 'post', '/journey/intervention/mentalidad/plans', { templateId: 'MEN-A1', readingIds: ['planificacion'] });
    expect(notRecognized.status).toBe(400);

    const planning = view.body.readings.find((row: { id: string }) => row.id === 'planificacion');
    const stale = await call(owner.token, 'post', '/journey/intervention/mentalidad/recognition', { readingId: 'planificacion', outcome: 'REPRESENTS', signature: 'otra' });
    expect(stale.status).toBe(409);
    const recognized = await call(owner.token, 'post', '/journey/intervention/mentalidad/recognition', { readingId: 'planificacion', outcome: 'PARTIAL', signature: planning.signature });
    expect(recognized.status).toBeLessThan(400);
    const oriented = await call(owner.token, 'post', '/journey/intervention/mentalidad/plans', { templateId: 'MEN-A1', readingIds: ['planificacion'], commandKey: 'a1-respuestas' });
    expect(oriented.status, JSON.stringify(oriented.body)).toBeLessThan(400);
    const plan = await call(owner.token, 'get', `/journey/intervention/mentalidad/plans/${oriented.body.plan.id}`);
    expect(plan.body.general).toBe(false);
    expect(plan.body.readings[0]).toMatchObject({ id: 'planificacion', outcome: 'PARTIAL' });

    const sustain = view.body.readings.find((row: { id: string }) => row.id === 'sostener');
    await call(owner.token, 'post', '/journey/intervention/mentalidad/recognition', { readingId: 'sostener', outcome: 'NOT', signature: sustain.signature });
    const after = await call(owner.token, 'get', '/journey/intervention/mentalidad');
    expect(after.body.readings.map((row: { id: string }) => row.id)).not.toContain('sostener');
    expect(after.body.setAside).toContain('sostener');
    const blocked = await call(owner.token, 'post', '/journey/intervention/mentalidad/plans', { templateId: 'MEN-C1', readingIds: ['sostener'] });
    expect(blocked.status).toBe(400);
  }, 60_000);

  it('deja fuera R19 de una sesión con etiquetas genéricas', async () => {
    const owner = await account('historica');
    await answer(owner.token, owner.userId, { 'formulario-v1:E-AUD-001!R19': '1' });
    const session = await prisma.diagnosticSession.findFirstOrThrow({ where: { userId: owner.userId, status: 'ACTIVE' } });
    const older = await prisma.diagnosticVersion.findFirst({ where: { version: 'formulario-completo@5' } });
    if (!older) return;
    await prisma.diagnosticSession.update({ where: { id: session.id }, data: { versionId: older.id } });
    const view = await call(owner.token, 'get', '/journey/intervention/mentalidad');
    expect(view.body.readings.map((row: { id: string }) => row.id)).not.toContain('evitacion');
    expect(view.body.ineligible).toContainEqual(expect.objectContaining({ key: 'R19', reason: 'GENERIC_LABELS' }));
  }, 60_000);
});

describe('Mentalidad revisión que decide', () => {
  it('propone revisar estrategia si hubo ejecución suficiente sin resultado y confirma cambio', async () => {
    process.env.MK_CLOCK_DAY = '2026-10-16';
    const owner = await account('revision-explore');
    const created = await call(owner.token, 'post', '/journey/intervention/mentalidad/plans', { templateId: 'MEN-C1', commandKey: 'rev-c1' });
    const planId = created.body.plan.id as string;
    await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}`, {
      weeklyMinutes: 50, occasionsPerWeek: 5, minutesPerOccasion: 10, horizonWeeks: 1, protectNote: 'El sueño.',
    });
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/activate`, { confirmed: true, commandKey: 'rev-act' });
    await backdateActivation(planId, '2026-10-16');
    const action = await prisma.planAction.findFirstOrThrow({ where: { planId } });
    for (let day = 0; day < 5; day += 1) {
      await prisma.actionRecord.create({ data: { actionId: action.id, day: `2026-10-${13 + day}`, status: 'DONE' } });
    }
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/indicator`, {
      indicatorRef: 'ind-men-termine@0.1', value: 0, commandKey: 'rev-ind-1',
    });
    process.env.MK_CLOCK_DAY = '2026-10-20';
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/indicator`, {
      indicatorRef: 'ind-men-termine@0.1', value: 0, commandKey: 'rev-ind-2',
    });
    process.env.MK_CLOCK_DAY = '2026-10-23';
    const read = await call(owner.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(read.body.review.code).toBe('CHECK');
    expect(read.body.review.choices).toContain('MODIFY');
    const confirmed = await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/review-decision`, {
      choice: 'MODIFY',
      revision: { title: 'Retomar con un paso más pequeño', doneWhen: 'Quedó hecho en 10 minutos.' },
      commandKey: 'rev-decision',
      weekStart: '2026-10-12',
    });
    expect(confirmed.status, JSON.stringify(confirmed.body)).toBeLessThan(400);
    expect(confirmed.body.review.lastChoice).toBe('MODIFY');
    const applied = await call(owner.token, 'post', '/journey/intervention/week-review/apply', {
      weekStart: '2026-10-12', commandKey: 'rev-apply',
    });
    expect(applied.status, JSON.stringify(applied.body)).toBeLessThan(400);
    expect(applied.body.applied).toBe(1);
  }, 60_000);

  it('permite mantener o aligerar cuando hay avance con menos ocasiones', async () => {
    process.env.MK_CLOCK_DAY = '2026-10-16';
    const owner = await account('revision-lighter');
    const created = await call(owner.token, 'post', '/journey/intervention/mentalidad/plans', { templateId: 'MEN-C1', commandKey: 'light-c1' });
    const planId = created.body.plan.id as string;
    await call(owner.token, 'patch', `/journey/intervention/mentalidad/plans/${planId}`, {
      weeklyMinutes: 50, occasionsPerWeek: 5, minutesPerOccasion: 10, horizonWeeks: 1, protectNote: 'Por ahora no hay nada que cuidar.',
    });
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/activate`, { confirmed: true, commandKey: 'light-act' });
    await backdateActivation(planId, '2026-10-16');
    const action = await prisma.planAction.findFirstOrThrow({ where: { planId } });
    for (let day = 0; day < 3; day += 1) {
      await prisma.actionRecord.create({ data: { actionId: action.id, day: `2026-10-${13 + day}`, status: 'DONE' } });
    }
    for (let day = 3; day < 5; day += 1) {
      await prisma.actionRecord.create({ data: { actionId: action.id, day: `2026-10-${13 + day}`, status: 'SKIPPED' } });
    }
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/indicator`, {
      indicatorRef: 'ind-men-termine@0.1', value: 1, commandKey: 'light-ind-1',
    });
    process.env.MK_CLOCK_DAY = '2026-10-20';
    await call(owner.token, 'post', `/journey/intervention/mentalidad/plans/${planId}/indicator`, {
      indicatorRef: 'ind-men-termine@0.1', value: 1, commandKey: 'light-ind-2',
    });
    process.env.MK_CLOCK_DAY = '2026-10-23';
    const read = await call(owner.token, 'get', `/journey/intervention/mentalidad/plans/${planId}`);
    expect(read.body.review.code).toBe('LIGHTER_OK');
    expect(read.body.review.choices).toEqual(expect.arrayContaining(['KEEP', 'REDUCE']));
    expect(read.body.review.choices).not.toContain('SUBSTITUTE');
  }, 60_000);
});
