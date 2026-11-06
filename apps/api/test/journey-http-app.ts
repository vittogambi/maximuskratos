import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { INestApplication } from '@nestjs/common';

process.env.MK_THROTTLE_DEFAULT_LIMIT = process.env.MK_THROTTLE_DEFAULT_LIMIT ?? '100000';

const databaseUrl = process.env.DATABASE_URL ?? '';
// `npm run build:test` writes dist-test, so the suite never deletes the dist a running `nest --watch` uses.
const distDir = process.env.MK_API_DIST ?? (existsSync(resolve(__dirname, '../dist-test/app.module.js')) ? 'dist-test' : 'dist');
if (!databaseUrl.includes('/mk_journey_it')) {
  throw new Error('Refusing HTTP journeys. DATABASE_URL must name the disposable database mk_journey_it.');
}

/** Compiled module from the same folder bootApi uses, so module state is shared with the app. */
export function loadCompiled<T = Record<string, unknown>>(path: string): Promise<T> {
  return import(`../${distDir}/${path}`) as Promise<T>;
}

export async function bootApi(overrides?: {
  clock?: { today: () => string };
  weekHook?: { beforeActionWrite?: () => Promise<void>; afterActionWrite: () => Promise<void> };
  responseHook?: { beforeUpsert: () => Promise<void> };
}): Promise<INestApplication> {
  const { Test } = await import('@nestjs/testing');
  const { AppModule } = await import(`../${distDir}/app.module.js`);
  const { JourneyClock } = await import(`../${distDir}/journey/journey-clock.js`);
  const { ResponseWriteHook } = await import(`../${distDir}/diagnostic/response-write-hook.js`);
  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (overrides?.clock) builder = builder.overrideProvider(JourneyClock).useValue(overrides.clock);
  if (overrides?.responseHook) builder = builder.overrideProvider(ResponseWriteHook).useValue(overrides.responseHook);
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  const { attachHttpTrace } = await import(`../${distDir}/trace/http-trace.js`);
  attachHttpTrace(app);
  await app.init();
  // Supertest dials 127.0.0.1. listen(0) without a host binds :: on this runtime,
  // and another socket can own that same port on 127.0.0.1.
  await app.listen(0, '127.0.0.1');
  return app;
}
