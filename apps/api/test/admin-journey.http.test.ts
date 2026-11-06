import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { recordQuestionnaireAlerts } from '../src/instrumentos/alert-store';
import { auditId } from '../src/instrumentos/score';
import { bootApi } from './journey-http-app';

let app: INestApplication;
let prisma: PrismaClient;

function server() {
  return app.getHttpServer();
}

async function register(label: string) {
  const email = `mk.admin.${label}.${Date.now()}@fixtures.mk.invalid`;
  const res = await request(server()).post('/api/v1/auth/register').send({ email, password: 'Recorrido2026' });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return { email, token: res.body.accessToken as string, userId: res.body.user.id as string };
}

async function catalogSession(userId: string, status: 'ACTIVE' | 'COMPLETED') {
  const version = await prisma.diagnosticVersion.create({
    data: { version: `admin-it-${randomUUID()}`, definitionRef: 'formulario-completo', isActive: false },
  });
  const module = await prisma.diagnosticModule.create({
    data: {
      versionId: version.id,
      phase: 'FASE1',
      dimensionKey: 'audit',
      slug: 'e-aud-s1',
      order: 1,
      titleEs: 'Auditoría',
      introEs: 'Objetivo guardado en esta versión.',
      outroTemplateEs: '',
      estimatedMinutes: 4,
    },
  });
  const question = await prisma.question.create({
    data: {
      moduleId: module.id,
      order: 1,
      type: 'SCALE_1_5',
      textEs: 'Pregunta de auditoría.',
      sourceRef: auditId(6),
      options: { create: [1, 2, 3, 4, 5].map((value) => ({ order: value, textEs: `Ancla ${value}`, value: String(value), scoreDeltas: {}, flags: [], tags: [] })) },
    },
    include: { options: true },
  });
  const session = await prisma.diagnosticSession.create({
    data: { userId, versionId: version.id, status, completedAt: status === 'COMPLETED' ? new Date('2026-10-02T00:00:00.000Z') : null },
  });
  return { version, module, question, session };
}

beforeAll(async () => {
  app = await bootApi();
  prisma = new PrismaClient();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe('admin journey', () => {
  it('rejects guests and members, and keeps alerts out of the member payload', async () => {
    const member = await register('member');
    const admin = await register('admin');
    await prisma.user.update({ where: { id: admin.userId }, data: { role: 'ADMIN' } });
    const { session, question } = await catalogSession(member.userId, 'COMPLETED');
    const option = question.options.find((item) => item.value === '1');
    await prisma.response.create({
      data: {
        sessionId: session.id,
        questionId: question.id,
        selectedOptionIds: option ? [option.id] : [],
        selectedOptions: option ? { connect: { id: option.id } } : undefined,
        revision: 1,
        freeText: 'secreto-libre',
      },
    });
    await prisma.diagnosticFormResult.create({
      data: { sessionId: session.id, formCode: 'formulario-completo', payload: { auditTotal: 0, alertCount: 3, scoringVersion: 'formulario-score@1' } },
    });
    await prisma.purposeRevision.create({
      data: {
        userId: member.userId,
        revision: 1,
        confirmedAt: new Date('2026-10-16T16:45:00.000Z'),
        content: { contract: 'TEXTO FIRMADO', contractView: { articles: [{ title: 'I. Origen', items: [{ label: 'Herencia', text: 'TEXTO FIRMADO' }] }] }, name: 'Ana' },
      },
    });
    await prisma.purposeRevision.create({
      data: { userId: member.userId, revision: 2, content: { statement: 'BORRADOR POSTERIOR', directionStatus: 'EXPLORANDO', contractView: { articles: [{ title: 'Nuevo', items: [{ text: 'NO FIRMADO' }] }] } } },
    });

    const guest = await request(server()).get(`/api/v1/admin/users/${member.userId}/journey`);
    expect(guest.status).toBe(401);
    const denied = await request(server()).get(`/api/v1/admin/users/${member.userId}/journey`).set('Authorization', `Bearer ${member.token}`);
    expect(denied.status).toBe(403);
    const alertsDenied = await request(server()).get('/api/v1/admin/alerts').set('Authorization', `Bearer ${member.token}`);
    expect(alertsDenied.status).toBe(403);

    const before = await prisma.response.count({ where: { sessionId: session.id } });
    const opened = await request(server()).get(`/api/v1/admin/users/${member.userId}/journey`).set('Authorization', `Bearer ${admin.token}`);
    expect(opened.status, JSON.stringify(opened.body)).toBe(200);
    expect(opened.headers['cache-control']).toContain('no-store');
    expect(opened.body.account.email).toBe(member.email);
    expect(opened.body.signed.contract).toBe('TEXTO FIRMADO');
    expect(JSON.stringify(opened.body.signed)).toContain('TEXTO FIRMADO');
    expect(JSON.stringify(opened.body.signed)).not.toContain('NO FIRMADO');
    expect(opened.body.direction.statement).toBe('BORRADOR POSTERIOR');
    expect(opened.body.draftIsLater).toBe(true);
    expect(opened.body.profile.alertCount).toBe(1);
    expect(await prisma.response.count({ where: { sessionId: session.id } })).toBe(before);

    const other = await register('other');
    const foreign = await catalogSession(other.userId, 'ACTIVE');
    await prisma.response.create({
      data: { sessionId: foreign.session.id, questionId: foreign.question.id, freeText: 'secreto-de-otra-cuenta', revision: 1 },
    });
    const mixed = await request(server()).get(`/api/v1/admin/users/${member.userId}/journey?sessionId=${foreign.session.id}`).set('Authorization', `Bearer ${admin.token}`);
    expect(mixed.status).toBe(404);
    expect(JSON.stringify(mixed.body)).not.toContain('secreto-de-otra-cuenta');

    const preview = await request(server()).post('/api/v1/admin/alerts/reconstruct').set('Authorization', `Bearer ${admin.token}`).send({ userId: member.userId, sessionId: session.id, execute: false });
    expect(preview.status).toBe(201);
    expect(preview.body.fired).toBe(1);
    expect(await prisma.questionnaireAlert.count({ where: { userId: member.userId } })).toBe(0);
    const first = await request(server()).post('/api/v1/admin/alerts/reconstruct').set('Authorization', `Bearer ${admin.token}`).send({ userId: member.userId, sessionId: session.id, execute: true });
    const second = await request(server()).post('/api/v1/admin/alerts/reconstruct').set('Authorization', `Bearer ${admin.token}`).send({ userId: member.userId, sessionId: session.id, execute: true });
    expect(first.body.created).toBe(1);
    expect(second.body.created).toBe(0);
    expect(await prisma.questionnaireAlert.count({ where: { userId: member.userId } })).toBe(1);
    await prisma.$transaction(async (tx) => {
      await recordQuestionnaireAlerts(tx, {
        userId: member.userId,
        sessionId: session.id,
        catalogVersion: 'formulario-completo@6',
        provenance: 'RECORDED',
        rows: [{
          revision: 3,
          answeredAt: new Date(),
          skipped: false,
          exceptionKind: null,
          freeText: null,
          selectedOptions: [{ value: '1' }],
          question: { sourceRef: auditId(7), instrument: null, module: { slug: 'e-aud-s1' } },
        }],
      });
      throw new Error('rollback');
    }).catch(() => undefined);
    expect(await prisma.questionnaireAlert.count({ where: { questionRef: auditId(7) } })).toBe(0);

    await prisma.$transaction(async (tx) => {
      await tx.questionnaireAlert.create({
        data: {
          userId: other.userId,
          sessionId: foreign.session.id,
          occurrenceKey: `${other.userId}:${foreign.session.id}:${auditId(6)}:alertas-aud@1:r1`,
          questionRef: auditId(6),
          ruleVersion: 'alertas-aud@1',
          nativeRule: 'equals 1',
          productRule: 'equals 1',
          responseRevision: 1,
          catalogVersion: 'formulario-completo@6',
          provenance: 'RECORDED',
        },
      });
      throw new Error('rollback');
    }).catch(() => undefined);
    expect(await prisma.questionnaireAlert.count({ where: { userId: other.userId } })).toBe(0);

    await prisma.response.update({ where: { sessionId_questionId: { sessionId: session.id, questionId: question.id } }, data: { revision: 2, selectedOptions: { set: [] }, selectedOptionIds: [] } });
    const listed = await request(server()).get(`/api/v1/admin/users/${member.userId}/alerts?sessionId=${session.id}`).set('Authorization', `Bearer ${admin.token}`);
    expect(listed.body.items).toHaveLength(1);
    expect(listed.body.items[0].matchesCurrentResponse).toBe(false);
    expect(listed.body.items[0].provenance).toBe('RECONSTRUCTED');

    const memberState = await request(server()).get('/api/v1/journey/state').set('Authorization', `Bearer ${member.token}`);
    expect(memberState.status, JSON.stringify(memberState.body)).toBe(200);
    expect(JSON.stringify(memberState.body)).not.toContain('alertCount');

    await prisma.user.update({ where: { id: admin.userId }, data: { role: 'USER' } });
    const demoted = await request(server()).get(`/api/v1/admin/users/${member.userId}/journey`).set('Authorization', `Bearer ${admin.token}`);
    expect(demoted.status).toBe(403);

    const logs = await prisma.adminAccessLog.findMany({ where: { targetUserId: member.userId } });
    expect(logs.length).toBeGreaterThan(0);
    expect(JSON.stringify(logs)).not.toContain('secreto-libre');
  });

  it('opens the completed formulario when a newer active session exists', async () => {
    const member = await register('review-pick');
    const admin = await register('review-pick-admin');
    await prisma.user.update({ where: { id: admin.userId }, data: { role: 'ADMIN' } });
    const done = await catalogSession(member.userId, 'COMPLETED');
    await prisma.diagnosticFormResult.create({
      data: { sessionId: done.session.id, formCode: 'formulario-completo', payload: { auditTotal: 1, scoringVersion: 'formulario-score@1' } },
    });
    const active = await catalogSession(member.userId, 'ACTIVE');
    await prisma.diagnosticSession.update({
      where: { id: active.session.id },
      data: { lastActivityAt: new Date('2026-10-16T20:00:00.000Z') },
    });
    const opened = await request(server()).get(`/api/v1/admin/users/${member.userId}/journey`).set('Authorization', `Bearer ${admin.token}`);
    expect(opened.status, JSON.stringify(opened.body)).toBe(200);
    expect(opened.body.selectedSessionId).toBe(done.session.id);
    const selected = opened.body.sessions.find((item: { id: string }) => item.id === opened.body.selectedSessionId);
    expect(selected?.status).toBe('COMPLETED');
    await prisma.user.update({ where: { id: admin.userId }, data: { role: 'USER' } });
  });
});
