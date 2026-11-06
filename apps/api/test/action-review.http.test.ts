import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootApi } from './journey-http-app';

process.env.MK_CLOCK_DAY = '2026-11-04';
const clock = { today() { return process.env.MK_CLOCK_DAY ?? '2026-11-04'; } };
const setDay = (day: string) => { process.env.MK_CLOCK_DAY = day; };
let app: INestApplication;
let prisma: PrismaClient;

function server() { return app.getHttpServer(); }

async function call(token: string, method: 'get' | 'post' | 'patch', path: string, body?: unknown) {
  const req = request(server())[method](`/api/v1${path}`).set('Connection', 'close').set('Authorization', `Bearer ${token}`);
  return body === undefined ? req : req.send(body);
}

async function ok(res: request.Response, status = 400) {
  expect(res.status, JSON.stringify(res.body)).toBeLessThan(status);
  return res.body;
}

async function account(label: string) {
  const email = `mk.review.${label}.${Date.now()}@fixtures.mk.invalid`;
  const res = await request(server()).post('/api/v1/auth/register').set('Connection', 'close').send({ email, password: 'Recorrido2026' });
  expect(res.status).toBe(201);
  return { token: res.body.accessToken as string, userId: res.body.user.id as string };
}

const base = (territory: string) => `/journey/intervention/${territory}`;

type ActionSpec = { title: string; doneWhen: string; schedule: Record<string, unknown>; cue?: string; contentTags?: string[] };

/** Designs and activates a plan through the five-step contract. Activation day comes from the journey clock. */
async function activePlan(token: string, territory: string, actions: ActionSpec[], extra: Record<string, unknown> = {}) {
  const created = await ok(await call(token, 'post', `${base(territory)}/designs`, { change: 'Ordenar los papeles de impuestos' }));
  const id = created.planId as string;
  await ok(await call(token, 'patch', `${base(territory)}/plans/${id}/design`, { section: 'result', mode: 'RESULT', soughtOutcome: 'Declaración enviada', criterion: 'Tengo el comprobante', horizonWeeks: 3 }));
  const strategy = await ok(await call(token, 'patch', `${base(territory)}/plans/${id}/design`, { section: 'strategy', strategy: { kind: 'OWN', pattern: 'FREE', title: 'Mi forma' } }));
  await ok(await call(token, 'patch', `${base(territory)}/plans/${id}/design`, {
    section: 'actions',
    actions: actions.map((row, index) => ({ ...(index === 0 ? { key: strategy.actions[0].key } : {}), cue: null, minimum: null, contentTags: [], ...row })),
    protectNote: 'Por ahora no hay nada que cuidar.',
    loadConfirmed: true,
  }));
  await ok(await call(token, 'post', `${base(territory)}/plans/${id}/activate`, { confirmed: true, ...extra }));
  const rows = await prisma.planAction.findMany({ where: { planId: id }, orderBy: { position: 'asc' } });
  return { id, rows };
}

function mark(token: string, actionId: string, day: string, status: 'DONE' | 'SKIPPED') {
  return call(token, 'post', '/journey/records', { actionId, day, status });
}

beforeAll(async () => {
  app = await bootApi({ clock });
  prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
}, 60_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await app?.close();
});

describe('Revisión de un plan con varias acciones y tareas únicas', () => {
  it('cada acción se revisa por separado y el pasado queda intacto', async () => {
    setDay('2026-11-04');
    const owner = await account('multi');
    const { id, rows } = await activePlan(owner.token, 'finanzas', [
      { title: 'Caminar después de comer', doneWhen: 'Caminé', schedule: { kind: 'WEEKLY', occasionsPerWeek: 3, minutesPerOccasion: 20 }, cue: 'Al volver del almuerzo' },
      { title: 'Juntar boletas', doneWhen: 'Están en una carpeta', schedule: { kind: 'ONCE', week: 1, minutesPerOccasion: 20 } },
      { title: 'Llamar al banco', doneWhen: 'Llamé', schedule: { kind: 'ONCE', week: 1, minutesPerOccasion: 15 } },
      { title: 'Pedir el certificado de renta', doneWhen: 'Lo tengo', schedule: { kind: 'ONCE', week: 1, minutesPerOccasion: 15 } },
      { title: 'Revisar la propuesta del sitio', doneWhen: 'Revisada', schedule: { kind: 'ONCE', week: 2, minutesPerOccasion: 30 } },
      { title: 'Enviar la declaración', doneWhen: 'Enviada', schedule: { kind: 'ONCE', week: 3, minutesPerOccasion: 30 } },
    ]);
    const [walk, collect, callBank, certificate, proposal, send] = rows;
    expect(walk!.cue).toBe('Al volver del almuerzo');

    setDay('2026-11-06');
    await ok(await mark(owner.token, walk!.id, '2026-11-04', 'DONE'));
    await ok(await mark(owner.token, walk!.id, '2026-11-05', 'DONE'));
    await ok(await mark(owner.token, collect!.id, '2026-11-05', 'DONE'));
    await ok(await mark(owner.token, callBank!.id, '2026-11-06', 'SKIPPED'));
    const early = await mark(owner.token, proposal!.id, '2026-11-06', 'DONE');
    expect(early.body.code).toBe('NOT_AN_OCCASION');

    setDay('2026-11-10');
    const view = await ok(await call(owner.token, 'get', `${base('finanzas')}/plans/${id}?weekStart=2026-11-02`));
    const byId = new Map(view.actions.map((row: { id: string }) => [row.id, row]));
    expect(byId.get(collect!.id)).toMatchObject({ kind: 'ONCE', once: { status: 'DONE' }, needsDecision: false });
    expect(byId.get(callBank!.id)).toMatchObject({ once: { status: 'NOT_DONE' }, needsDecision: true });
    expect(byId.get(certificate!.id)).toMatchObject({ once: { status: 'NO_INFORMATION' }, needsDecision: true });
    expect(byId.get(proposal!.id)).toMatchObject({ once: { status: 'PENDING' }, needsDecision: false });
    expect(byId.get(send!.id)).toMatchObject({ once: { status: 'UPCOMING' } });
    expect(byId.get(walk!.id)).toMatchObject({ kind: 'WEEKLY', week: { done: 2, notDone: 0, noInformation: 1 } });
    const executionBefore = view.execution;
    const contractBefore = view.outcomeContract;

    const bad = await call(owner.token, 'post', `${base('finanzas')}/plans/${id}/review-decision`, {
      weekStart: '2026-11-02', commandKey: 'bad', actions: [{ actionId: certificate!.id, op: 'RETIRE' }],
    });
    expect(bad.status).toBe(400);

    const saved = await ok(await call(owner.token, 'post', `${base('finanzas')}/plans/${id}/review-decision`, {
      weekStart: '2026-11-02',
      commandKey: 'multi-1',
      actions: [
        { actionId: walk!.id, op: 'REDUCE', occasionsPerWeek: 2 },
        { actionId: callBank!.id, op: 'RESCHEDULE', schedule: { kind: 'ONCE', weekStart: '2026-11-16' } },
        { actionId: certificate!.id, op: 'SUBSTITUTE', title: 'Pedir el certificado por correo', doneWhen: 'Llegó el correo', minutesPerOccasion: 10, schedule: { kind: 'ONCE', weekStart: '2026-11-16' } },
        { actionId: send!.id, op: 'MODIFY', title: 'Enviar la declaración con el contador', doneWhen: 'Enviada' },
      ],
      additions: [{ title: 'Archivar los comprobantes', doneWhen: 'Archivados', minutesPerOccasion: 10, schedule: { kind: 'ONCE', weekStart: '2026-11-23' } }],
    }));
    expect(saved.weekReview.needsWeekApply).toBe(true);
    const repeat = await ok(await call(owner.token, 'post', `${base('finanzas')}/plans/${id}/review-decision`, {
      weekStart: '2026-11-02',
      commandKey: 'multi-1',
      actions: [
        { actionId: walk!.id, op: 'REDUCE', occasionsPerWeek: 2 },
        { actionId: callBank!.id, op: 'RESCHEDULE', schedule: { kind: 'ONCE', weekStart: '2026-11-16' } },
        { actionId: certificate!.id, op: 'SUBSTITUTE', title: 'Pedir el certificado por correo', doneWhen: 'Llegó el correo', minutesPerOccasion: 10, schedule: { kind: 'ONCE', weekStart: '2026-11-16' } },
        { actionId: send!.id, op: 'MODIFY', title: 'Enviar la declaración con el contador', doneWhen: 'Enviada' },
      ],
      additions: [{ title: 'Archivar los comprobantes', doneWhen: 'Archivados', minutesPerOccasion: 10, schedule: { kind: 'ONCE', weekStart: '2026-11-23' } }],
    }));
    expect(repeat.repeated).toBe(true);
    const otherWithSameKey = await call(owner.token, 'post', `${base('finanzas')}/plans/${id}/review-decision`, {
      weekStart: '2026-11-02', commandKey: 'multi-1', actions: [{ actionId: walk!.id, op: 'KEEP' }],
    });
    expect(otherWithSameKey.status).toBe(409);

    const pending = await ok(await call(owner.token, 'get', '/journey/intervention/week-review/pending?weekStart=2026-11-02'));
    const row = pending.pending[0];
    expect(row.actions.map((item: { op: string }) => item.op).sort()).toEqual(['KEEP', 'KEEP', 'MODIFY', 'REDUCE', 'RESCHEDULE', 'SUBSTITUTE']);
    expect(row.additions[0].summary).toContain('Archivar los comprobantes');

    const recordsBefore = await prisma.actionRecord.findMany({ where: { action: { planId: id } }, orderBy: [{ day: 'asc' }, { actionId: 'asc' }] });
    await ok(await call(owner.token, 'post', '/journey/intervention/week-review/apply', { weekStart: '2026-11-02', commandKey: 'apply-multi' }));

    const after = await prisma.planAction.findMany({ where: { planId: id }, include: { schedules: true }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] });
    const successorOf = (actionId: string) => after.find((item) => item.replacesActionId === actionId);
    const walkOld = after.find((item) => item.id === walk!.id)!;
    expect(walkOld).toMatchObject({ active: false, effectiveTo: '2026-11-15', occasionsPerWeek: 3, cue: 'Al volver del almuerzo' });
    expect(successorOf(walk!.id)).toMatchObject({ occasionsPerWeek: 2, minutesPerOccasion: 20, cue: 'Al volver del almuerzo', position: 0, effectiveFrom: '2026-11-16', active: true });
    const moved = successorOf(callBank!.id)!;
    expect(moved).toMatchObject({ title: 'Llamar al banco', occasionsPerWeek: null, active: true, position: 2 });
    expect(moved.schedules[0]!.effectiveFrom.toISOString().slice(0, 10)).toBe('2026-11-16');
    expect(moved.schedules[0]!.effectiveTo!.toISOString().slice(0, 10)).toBe('2026-11-22');
    expect(successorOf(certificate!.id)).toMatchObject({ title: 'Pedir el certificado por correo', minutesPerOccasion: 10 });
    expect(successorOf(send!.id)).toMatchObject({ title: 'Enviar la declaración con el contador' });
    expect(successorOf(send!.id)!.schedules[0]!.effectiveFrom.toISOString().slice(0, 10)).toBe('2026-11-16');
    expect(after.find((item) => item.id === collect!.id)).toMatchObject({ active: true, effectiveTo: null });
    expect(after.find((item) => item.id === proposal!.id)).toMatchObject({ active: true, effectiveTo: null });
    const added = after.find((item) => item.title === 'Archivar los comprobantes')!;
    expect(added).toMatchObject({ origin: 'MEMBER', position: 6, effectiveFrom: '2026-11-23' });

    const recordsAfter = await prisma.actionRecord.findMany({ where: { action: { planId: id } }, orderBy: [{ day: 'asc' }, { actionId: 'asc' }] });
    expect(recordsAfter.map((item) => [item.actionId, item.day, item.status])).toEqual(recordsBefore.map((item) => [item.actionId, item.day, item.status]));

    const reread = await ok(await call(owner.token, 'get', `${base('finanzas')}/plans/${id}?weekStart=2026-11-09`));
    expect(reread.execution).toMatchObject({ done: executionBefore.done, notDone: executionBefore.notDone, noInformation: executionBefore.noInformation });
    expect(reread.outcomeContract).toEqual(contractBefore);
    expect(reread.actions.filter((item: { needsDecision: boolean }) => item.needsDecision)).toEqual([]);
    expect(reread.actions.some((item: { id: string }) => item.id === successorOf(walk!.id)!.id)).toBe(false);
    expect(reread.endedActions.find((item: { id: string }) => item.id === walk!.id)).toMatchObject({ cue: 'Al volver del almuerzo', effectiveTo: '2026-11-15' });
    expect(reread.endedActions.find((item: { id: string }) => item.id === callBank!.id).replacedBy.title).toBe('Llamar al banco');
    const forward = await ok(await call(owner.token, 'get', `${base('finanzas')}/plans/${id}?weekStart=2026-11-16`));
    expect(forward.actions.find((item: { id: string }) => item.id === successorOf(walk!.id)!.id)).toMatchObject({ occasionsPerWeek: 2 });
    expect(forward.actions.some((item: { id: string }) => item.id === walk!.id)).toBe(false);
    const plan = await prisma.personalPlan.findUniqueOrThrow({ where: { id } });
    expect(plan.capacityMinutes).toBe(2 * 20 + 15 + 10 + 30);
    expect(forward.reviewWeek.weekMinutes).toBe(2 * 20 + 15 + 10 + 30);

    const onOld = await mark(owner.token, walk!.id, '2026-11-10', 'DONE');
    expect(onOld.status, JSON.stringify(onOld.body)).toBeLessThan(400);
    const beforeStart = await mark(owner.token, successorOf(walk!.id)!.id, '2026-11-10', 'DONE');
    expect(beforeStart.body.code).toBe('ACTION_NOT_STARTED');
    const tooSoon = await mark(owner.token, moved.id, '2026-11-10', 'DONE');
    expect(tooSoon.body.code).toBe('ACTION_NOT_STARTED');
  });

  it('descartar una tarea sin registro exige motivo, la conserva en su semana y no la cuenta como hecha', async () => {
    setDay('2026-11-04');
    const owner = await account('descartar');
    const { id, rows } = await activePlan(owner.token, 'mentalidad', [
      { title: 'Leer quince minutos', doneWhen: 'Leí', schedule: { kind: 'WEEKLY', occasionsPerWeek: 2, minutesPerOccasion: 15 } },
      { title: 'Comprar el libro', doneWhen: 'Lo tengo', schedule: { kind: 'ONCE', week: 1, minutesPerOccasion: 20 } },
    ]);
    setDay('2026-11-10');
    const before = await ok(await call(owner.token, 'get', `${base('mentalidad')}/plans/${id}?weekStart=2026-11-02`));
    expect(before.actions[1]).toMatchObject({ needsDecision: true, once: { status: 'NO_INFORMATION' } });
    await ok(await call(owner.token, 'post', `${base('mentalidad')}/plans/${id}/review-decision`, {
      weekStart: '2026-11-02', commandKey: 'retire-1', actions: [{ actionId: rows[1]!.id, op: 'RETIRE', reason: 'Me lo prestaron' }],
    }));
    await ok(await call(owner.token, 'post', '/journey/intervention/week-review/apply', { weekStart: '2026-11-02', commandKey: 'apply-retire' }));
    const ended = await prisma.planAction.findUniqueOrThrow({ where: { id: rows[1]!.id } });
    expect(ended).toMatchObject({ active: false, effectiveTo: '2026-11-15', endedReason: 'Me lo prestaron' });
    const after = await ok(await call(owner.token, 'get', `${base('mentalidad')}/plans/${id}?weekStart=2026-11-09`));
    expect(after.execution).toMatchObject({ done: before.execution.done, noInformation: before.execution.noInformation });
    expect(after.endedActions[0]).toMatchObject({ endedReason: 'Me lo prestaron' });
    expect(after.actions).toHaveLength(1);
    const close = await prisma.weekReview.findFirstOrThrow({ where: { weekStart: '2026-11-02', snapshot: { path: ['endReasons', rows[1]!.id], equals: 'Me lo prestaron' } } });
    expect(close).toBeTruthy();
  });

  it('una acción por disparador y una recurrente se mantienen sin cambiar su conteo', async () => {
    setDay('2026-11-04');
    const owner = await account('trigger');
    const created = await ok(await call(owner.token, 'post', `${base('mentalidad')}/designs`, { change: 'Retomar después de cortar la rutina' }));
    const id = created.planId as string;
    await ok(await call(owner.token, 'patch', `${base('mentalidad')}/plans/${id}/design`, { section: 'result', mode: 'RESULT', soughtOutcome: 'Retomar en un día', criterion: 'Retomé al día siguiente', horizonWeeks: 3 }));
    const strategy = await ok(await call(owner.token, 'patch', `${base('mentalidad')}/plans/${id}/design`, { section: 'strategy', strategy: { kind: 'CATALOG', templateId: 'MEN-C2', focusText: null, stageDefinition: null } }));
    await ok(await call(owner.token, 'patch', `${base('mentalidad')}/plans/${id}/design`, {
      section: 'actions',
      actions: [...strategy.actions, { title: 'Escribir el plan del día', doneWhen: 'Escrito', schedule: { kind: 'WEEKLY', occasionsPerWeek: 2, minutesPerOccasion: 10 }, contentTags: [] }],
      protectNote: 'Por ahora no hay nada que cuidar.',
      loadConfirmed: true,
    }));
    await ok(await call(owner.token, 'post', `${base('mentalidad')}/plans/${id}/activate`, { confirmed: true }));
    setDay('2026-11-10');
    const view = await ok(await call(owner.token, 'get', `${base('mentalidad')}/plans/${id}?weekStart=2026-11-02`));
    expect(view.actions.map((row: { kind: string }) => row.kind)).toEqual(['TRIGGER', 'WEEKLY']);
    expect(view.actions[0].week).toMatchObject({ done: 0, notDone: 0, noInformation: 0 });
    expect(view.actions[1].week).toMatchObject({ noInformation: 2 });
    const triggerWeekly = await call(owner.token, 'post', `${base('mentalidad')}/plans/${id}/review-decision`, {
      weekStart: '2026-11-02', commandKey: 'trig-1', actions: [{ actionId: view.actions[0].id, op: 'MODIFY', schedule: { kind: 'WEEKLY', occasionsPerWeek: 2 } }],
    });
    expect(triggerWeekly.status).toBe(400);
    await ok(await call(owner.token, 'post', `${base('mentalidad')}/plans/${id}/review-decision`, {
      weekStart: '2026-11-02', commandKey: 'trig-2', actions: [{ actionId: view.actions[0].id, op: 'MODIFY', cue: 'El día después del corte' }],
    }));
    await ok(await call(owner.token, 'post', '/journey/intervention/week-review/apply', { weekStart: '2026-11-02', commandKey: 'apply-trig' }));
    const trig = await prisma.planAction.findUniqueOrThrow({ where: { id: view.actions[0].id } });
    expect(trig).toMatchObject({ active: false, cue: view.actions[0].cue, effectiveTo: '2026-11-15' });
    const trigNext = await prisma.planAction.findFirstOrThrow({ where: { replacesActionId: trig.id } });
    expect(trigNext).toMatchObject({ active: true, cue: 'El día después del corte', occasionsPerWeek: null, effectiveFrom: '2026-11-16' });
  });

  it('las marcas nuevas pasan por los controles de seguridad', async () => {
    setDay('2026-11-04');
    const owner = await account('seguridad');
    const { id, rows } = await activePlan(owner.token, 'relaciones', [
      { title: 'Llamar a mi hermana', doneWhen: 'Hablamos', schedule: { kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 20 } },
    ]);
    setDay('2026-11-10');
    const talk = { title: 'Hablar del cuidado de mamá', doneWhen: 'Hablamos', minutesPerOccasion: 30, schedule: { kind: 'ONCE', weekStart: '2026-11-16' }, contentTags: ['CONFRONTATION'] };
    const ask = await call(owner.token, 'post', `${base('relaciones')}/plans/${id}/review-decision`, { weekStart: '2026-11-02', commandKey: 'sec-1', additions: [talk] });
    expect(ask.status).toBe(403);
    expect(ask.body.scope).toBe('CONVERSATION');
    await ok(await call(owner.token, 'post', `${base('relaciones')}/plans/${id}/review-decision`, { weekStart: '2026-11-02', commandKey: 'sec-2', additions: [talk], conversation: 'VIABLE' }));
    await ok(await call(owner.token, 'post', '/journey/intervention/week-review/apply', { weekStart: '2026-11-02', commandKey: 'apply-sec' }));
    const added = await prisma.planAction.findFirstOrThrow({ where: { planId: id, title: 'Hablar del cuidado de mamá' } });
    expect(added).toMatchObject({ contentTags: ['CONFRONTATION'], conversationOutcome: 'VIABLE' });

    const money = await account('dinero');
    const plan = await activePlan(money.token, 'finanzas', [
      { title: 'Anotar gastos', doneWhen: 'Anotados', schedule: { kind: 'WEEKLY', occasionsPerWeek: 2, minutesPerOccasion: 10 } },
    ]);
    const invest = await call(money.token, 'post', `${base('finanzas')}/plans/${plan.id}/review-decision`, {
      weekStart: '2026-11-09', commandKey: 'inv-1', actions: [{ actionId: plan.rows[0]!.id, op: 'SUBSTITUTE', title: 'Invertir en un fondo', doneWhen: 'Invertí', contentTags: ['INVESTMENT'] }],
    });
    expect(invest.status).toBe(403);
    expect(invest.body.message).toContain('MK no propone inversiones');
    void rows;
  });

  it('si la acción cambió después de guardar la decisión, aplicar se detiene', async () => {
    setDay('2026-11-04');
    const owner = await account('conflicto');
    const { id, rows } = await activePlan(owner.token, 'mentalidad', [
      { title: 'Ordenar el escritorio', doneWhen: 'Ordenado', schedule: { kind: 'WEEKLY', occasionsPerWeek: 2, minutesPerOccasion: 10 } },
      { title: 'Planificar el lunes', doneWhen: 'Planificado', schedule: { kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 20 } },
    ]);
    setDay('2026-11-10');
    await ok(await call(owner.token, 'post', `${base('mentalidad')}/plans/${id}/review-decision`, {
      weekStart: '2026-11-02', commandKey: 'conf-1', actions: [{ actionId: rows[1]!.id, op: 'MODIFY', minutesPerOccasion: 30 }],
    }));
    await prisma.planAction.update({ where: { id: rows[1]!.id }, data: { title: 'Planificar el lunes temprano' } });
    const apply = await call(owner.token, 'post', '/journey/intervention/week-review/apply', { weekStart: '2026-11-02', commandKey: 'apply-conf' });
    expect(apply.status).toBe(409);
    expect(apply.body.code).toBe('STALE_REVIEW');
    const untouched = await prisma.planAction.findMany({ where: { planId: id } });
    expect(untouched).toHaveLength(2);
    expect(await prisma.weekReview.findUnique({ where: { userId_weekStart: { userId: owner.userId, weekStart: '2026-11-02' } } })).toBeNull();
  });

  it('una revisión aplicada tarde no reescribe las semanas intermedias', async () => {
    setDay('2026-11-04');
    const owner = await account('tarde');
    const { id, rows } = await activePlan(owner.token, 'mentalidad', [
      { title: 'Caminar', doneWhen: 'Caminé', cue: 'miércoles por la tarde', schedule: { kind: 'WEEKLY', occasionsPerWeek: 2, minutesPerOccasion: 20 } },
    ]);
    const walk = rows[0]!;
    await ok(await mark(owner.token, walk.id, '2026-11-04', 'DONE'));
    setDay('2026-11-12');
    await ok(await mark(owner.token, walk.id, '2026-11-12', 'DONE'));
    setDay('2026-11-20');
    await ok(await call(owner.token, 'post', `${base('mentalidad')}/plans/${id}/review-decision`, {
      weekStart: '2026-11-02',
      commandKey: 'late-1',
      actions: [{ actionId: walk.id, op: 'MODIFY', cue: 'viernes por la mañana' }],
    }));
    await ok(await call(owner.token, 'post', '/journey/intervention/week-review/apply', { weekStart: '2026-11-02', commandKey: 'apply-late' }));

    const old = await prisma.planAction.findUniqueOrThrow({ where: { id: walk.id } });
    const next = await prisma.planAction.findFirstOrThrow({ where: { replacesActionId: walk.id } });
    expect(old).toMatchObject({ active: false, cue: 'miércoles por la tarde', effectiveTo: '2026-11-22' });
    expect(next).toMatchObject({ active: true, cue: 'viernes por la mañana', effectiveFrom: '2026-11-23' });
    const records = await prisma.actionRecord.findMany({ where: { actionId: walk.id }, orderBy: { day: 'asc' } });
    expect(records.map((row) => [row.day, row.status])).toEqual([['2026-11-04', 'DONE'], ['2026-11-12', 'DONE']]);

    for (const week of ['2026-11-09', '2026-11-16']) {
      const view = await ok(await call(owner.token, 'get', `${base('mentalidad')}/plans/${id}?weekStart=${week}`));
      expect(view.actions.some((item: { id: string }) => item.id === next.id)).toBe(false);
      expect(view.endedActions.find((item: { id: string }) => item.id === walk.id)).toMatchObject({ cue: 'miércoles por la tarde' });
    }
    const started = await ok(await call(owner.token, 'get', `${base('mentalidad')}/plans/${id}?weekStart=2026-11-23`));
    expect(started.actions.find((item: { id: string }) => item.id === next.id)).toMatchObject({ cue: 'viernes por la mañana' });
    expect(started.actions.some((item: { id: string }) => item.id === walk.id)).toBe(false);
    expect(started.endedActions.some((item: { id: string }) => item.id === walk.id)).toBe(false);

    const stillOld = await mark(owner.token, walk.id, '2026-11-18', 'DONE');
    expect(stillOld.status, JSON.stringify(stillOld.body)).toBeLessThan(400);
    const notYet = await mark(owner.token, next.id, '2026-11-18', 'DONE');
    expect(notYet.body.code).toBe('ACTION_NOT_STARTED');
  });

  it('una semana ya pasada elegida al guardar no se aplica hacia atrás', async () => {
    setDay('2026-11-04');
    const owner = await account('semana-pasada');
    const { id, rows } = await activePlan(owner.token, 'mentalidad', [
      { title: 'Pedir el turno', doneWhen: 'Pedido', schedule: { kind: 'ONCE', week: 1, minutesPerOccasion: 15 } },
    ]);
    await ok(await call(owner.token, 'post', `${base('mentalidad')}/plans/${id}/review-decision`, {
      weekStart: '2026-11-02',
      commandKey: 'past-1',
      actions: [{ actionId: rows[0]!.id, op: 'RESCHEDULE', schedule: { kind: 'ONCE', weekStart: '2026-11-09' } }],
    }));
    setDay('2026-11-20');
    const apply = await call(owner.token, 'post', '/journey/intervention/week-review/apply', { weekStart: '2026-11-02', commandKey: 'apply-past' });
    expect(apply.status).toBe(409);
    expect(apply.body.code).toBe('STALE_REVIEW');
    expect(apply.body.message).toContain('ya empezó');
    const action = await prisma.planAction.findUniqueOrThrow({ where: { id: rows[0]!.id } });
    expect(action.active).toBe(true);
    expect(await prisma.planAction.count({ where: { replacesActionId: rows[0]!.id } })).toBe(0);
    expect(await prisma.weekReview.findUnique({ where: { userId_weekStart: { userId: owner.userId, weekStart: '2026-11-02' } } })).toBeNull();
  });

  it('reemplazar una acción de plantilla pide confirmar la pregunta y no la cambia', async () => {
    setDay('2026-11-04');
    const owner = await account('indicador');
    const created = await ok(await call(owner.token, 'post', `${base('mentalidad')}/designs`, { change: 'Retomar después de cortar la rutina' }));
    const id = created.planId as string;
    await ok(await call(owner.token, 'patch', `${base('mentalidad')}/plans/${id}/design`, { section: 'result', mode: 'RESULT', soughtOutcome: 'Retomar en un día', criterion: 'Retomé al día siguiente', horizonWeeks: 3 }));
    const strategy = await ok(await call(owner.token, 'patch', `${base('mentalidad')}/plans/${id}/design`, { section: 'strategy', strategy: { kind: 'CATALOG', templateId: 'MEN-C2', focusText: null, stageDefinition: null } }));
    await ok(await call(owner.token, 'patch', `${base('mentalidad')}/plans/${id}/design`, {
      section: 'actions',
      actions: strategy.actions,
      protectNote: 'Por ahora no hay nada que cuidar.',
      loadConfirmed: true,
    }));
    await ok(await call(owner.token, 'post', `${base('mentalidad')}/plans/${id}/activate`, { confirmed: true }));
    setDay('2026-11-10');
    const view = await ok(await call(owner.token, 'get', `${base('mentalidad')}/plans/${id}?weekStart=2026-11-02`));
    const question = view.indicators.find((row: { indicator: { role: string; question: string } }) => row.indicator.role === 'RESULT').indicator.question as string;
    const actionId = view.actions[0].id as string;
    const cue = await ok(await call(owner.token, 'post', `${base('mentalidad')}/plans/${id}/review-decision`, {
      weekStart: '2026-11-02', commandKey: 'ind-cue', actions: [{ actionId, op: 'MODIFY', cue: 'El día después del corte' }],
    }));
    expect(cue.indicators.find((row: { indicator: { role: string; question: string } }) => row.indicator.role === 'RESULT').indicator.question).toBe(question);

    const swap = { actionId, op: 'SUBSTITUTE', title: 'Escribir qué cortó la rutina', doneWhen: 'Quedó escrito', minutesPerOccasion: 10 };
    const missing = await call(owner.token, 'post', `${base('mentalidad')}/plans/${id}/review-decision`, {
      weekStart: '2026-11-02', commandKey: 'ind-1', actions: [swap],
    });
    expect(missing.status).toBe(422);
    expect(missing.body.code).toBe('INDICATOR_COHERENCE');
    expect(missing.body.message).toContain(question);

    const kept = await ok(await call(owner.token, 'post', `${base('mentalidad')}/plans/${id}/review-decision`, {
      weekStart: '2026-11-02', commandKey: 'ind-2', actions: [swap], indicatorChoice: 'KEEP',
    }));
    expect(kept.indicators.find((row: { indicator: { role: string; question: string } }) => row.indicator.role === 'RESULT').indicator.question).toBe(question);
    const pending = await ok(await call(owner.token, 'get', '/journey/intervention/week-review/pending?weekStart=2026-11-02'));
    expect(pending.pending[0].indicatorChoice).toBe('KEEP');

    const renamed = await call(owner.token, 'post', `${base('mentalidad')}/plans/${id}/review-decision`, {
      weekStart: '2026-11-02', commandKey: 'ind-3', actions: [{ actionId, op: 'MODIFY', title: 'Anotar el corte y la vuelta' }],
    });
    expect(renamed.status).toBe(422);
    expect(renamed.body.code).toBe('INDICATOR_COHERENCE');
    const noted = await ok(await call(owner.token, 'post', `${base('mentalidad')}/plans/${id}/review-decision`, {
      weekStart: '2026-11-02', commandKey: 'ind-4', actions: [{ actionId, op: 'MODIFY', title: 'Anotar el corte y la vuelta' }], indicatorChoice: 'REVIEW',
    }));
    expect(noted.weekReview.previewSummary).toContain('pregunta semanal');
    expect(noted.indicators.find((row: { indicator: { role: string; question: string } }) => row.indicator.role === 'RESULT').indicator.question).toBe(question);
  });
});
