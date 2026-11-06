import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootApi } from './journey-http-app';
import { activatePlanBody } from './plan-activation-body';

let app: INestApplication;

function server() {
  return app.getHttpServer();
}

async function register() {
  const email = `mk.achievement.${Date.now()}@fixtures.mk.invalid`;
  const res = await request(server()).post('/api/v1/auth/register').send({ email, password: 'Recorrido2026' });
  expect(res.status).toBe(201);
  return { token: res.body.accessToken as string };
}

describe('plan achievement HTTP', () => {
  beforeAll(async () => {
    app = await bootApi();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  it('requires evidence before declaring achievement', async () => {
    const { token } = await register();
    const plan = await request(server())
      .post('/api/v1/journey/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Logro', outcome: 'Meta clara.' });
    expect(plan.status).toBeLessThan(400);
    await request(server())
      .post(`/api/v1/journey/plans/${plan.body.id}/actions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Paso', doneWhen: 'Hecho.', weekday: 2 });
    await request(server())
      .patch(`/api/v1/journey/plans/${plan.body.id}/draft`)
      .set('Authorization', `Bearer ${token}`)
      .send({ criterionText: 'Se ve en el resultado.', criterionStatus: 'CONFIRMED', capacityMinutes: 90 });
    const activated = await request(server())
      .post(`/api/v1/journey/plans/${plan.body.id}/activate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...activatePlanBody({ capacityMinutes: 90 }), commandKey: 'ach-activate' });
    expect(activated.status).toBeLessThan(400);

    const blocked = await request(server())
      .post(`/api/v1/journey/plans/${plan.body.id}/achievement`)
      .set('Authorization', `Bearer ${token}`)
      .send({ confirm: true });
    expect(blocked.status).toBe(409);
    expect(blocked.body.code).toBe('ACHIEVEMENT_EVIDENCE_REQUIRED');

    await request(server())
      .post(`/api/v1/journey/plans/${plan.body.id}/evidence`)
      .set('Authorization', `Bearer ${token}`)
      .send({ kind: 'DELIVERABLE', status: 'OBSERVED', text: 'Quedó publicado.' });

    const ok = await request(server())
      .post(`/api/v1/journey/plans/${plan.body.id}/achievement`)
      .set('Authorization', `Bearer ${token}`)
      .send({ confirm: true, commandKey: 'ach-once' });
    expect(ok.status).toBeLessThan(400);
    expect(ok.body.plan.stage).toBe('CLOSED');
  }, 45_000);
});
