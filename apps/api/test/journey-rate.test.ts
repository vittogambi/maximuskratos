import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { loadCompiled } from './journey-http-app';
import { afterAll, describe, expect, it } from 'vitest';

const databaseUrl = process.env.DATABASE_URL ?? '';
if (!databaseUrl.includes('/mk_journey_it')) {
  throw new Error('Refusing the rate-limit case outside mk_journey_it.');
}

describe('default rate limit', () => {
  let app: INestApplication;

  afterAll(async () => {
    await app?.close();
  });

  it('rejects the 101st request on the real guard', async () => {
    process.env.MK_THROTTLE_DEFAULT_LIMIT = '100';
    const { Test } = await import('@nestjs/testing');
    const { AppModule } = await loadCompiled<{ AppModule: unknown }>('app.module.js');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    let limited = 0;
    for (let index = 0; index < 101; index += 1) {
      const res = await request(app.getHttpServer()).get('/health');
      if (res.status === 429) limited += 1;
    }
    expect(limited).toBeGreaterThan(0);
  });
});
