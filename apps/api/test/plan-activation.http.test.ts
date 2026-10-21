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
  const email = `mk.activate.${Date.now()}@fixtures.mk.invalid`;
  const res = await request(server()).post('/api/v1/auth/register').send({ email, password: 'Recorrido2026' });
  expect(res.status).toBe(201);
  return { token: res.body.accessToken as string };
}

describe('plan activation gate HTTP', () => {
  beforeAll(async () => {
    app = await bootApi();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  it('creates a preparing plan without formulario, adds an action, and activates', async () => {
    const { token } = await register();
    const plan = await request(server())
      .post('/api/v1/journey/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Probar entrada', outcome: 'Quedó anotado qué haré.' });
    expect(plan.status, JSON.stringify(plan.body)).toBeLessThan(400);
    expect(plan.body.stage).toBe('PREPARING');
    expect(plan.body.status).toBe('DRAFT');
    const action = await request(server())
      .post(`/api/v1/journey/plans/${plan.body.id}/actions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Un paso', doneWhen: 'Quedó hecho.', weekday: 1 });
    expect(action.status).toBeLessThan(400);
    const blocked = await request(server())
      .post(`/api/v1/journey/plans/${plan.body.id}/activate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ confirmed: true });
    expect(blocked.status).toBe(422);
    expect(blocked.body.code).toBe('ACTIVATION_INCOMPLETE');
    expect(blocked.body.missing).toContain('TIME');
    const activated = await request(server())
      .post(`/api/v1/journey/plans/${plan.body.id}/activate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...activatePlanBody(), commandKey: 'activate-once' });
    expect(activated.status, JSON.stringify(activated.body)).toBeLessThan(400);
    expect(activated.body.plan.stage).toBe('ACTIVE');
    const again = await request(server())
      .post(`/api/v1/journey/plans/${plan.body.id}/activate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...activatePlanBody(), commandKey: 'activate-once' });
    expect(again.body.repeated).toBe(true);
  }, 30_000);
});
