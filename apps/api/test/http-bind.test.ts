import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { bootApi } from './journey-http-app';

process.env.MK_TRACE_HTTP = '1';

describe('el puerto que marca supertest', () => {
  it('otro socket en 127.0.0.1 devuelve un 404 vacío y la instancia en :: no lo ve', async () => {
    let seenByApp = 0;
    const app = http.createServer((_req, res) => {
      seenByApp += 1;
      res.setHeader('x-request-id', 'app');
      res.end('app');
    });
    await new Promise<void>((resolve) => { app.listen(0, '::', () => resolve()); });
    const port = (app.address() as AddressInfo).port;
    let seenByThief = 0;
    const thief = http.createServer((_req, res) => {
      seenByThief += 1;
      res.writeHead(404);
      res.end();
    });
    await new Promise<void>((resolve) => { thief.listen(port, '127.0.0.1', () => resolve()); });
    try {
      const res = await request(app).post('/api/v1/diagnostic/response').send({});
      expect(res.status).toBe(404);
      expect(res.text ?? '').toBe('');
      expect(res.headers['x-request-id']).toBeUndefined();
      expect(res.res?.statusCode).toBe(404);
      expect(seenByApp).toBe(0);
      expect(seenByThief).toBe(1);
    } finally {
      await new Promise((resolve) => thief.close(resolve));
      await new Promise((resolve) => app.close(resolve));
    }
  });
});

describe('instancia de prueba', () => {
  let app: INestApplication;

  afterAll(async () => {
    await app?.close();
  });

  it('escucha en 127.0.0.1 y la ruta ausente sigue en ese socket', async () => {
    app = await bootApi();
    const address = app.getHttpServer().address() as AddressInfo;
    expect(address.address).toBe('127.0.0.1');
    const thief = http.createServer((_req, res) => { res.writeHead(404); res.end(); });
    const stolen = await new Promise<string | null>((resolve) => {
      thief.once('error', (err: NodeJS.ErrnoException) => resolve(err.code ?? 'error'));
      thief.listen(address.port, '127.0.0.1', () => resolve(null));
    });
    if (!stolen) await new Promise((resolve) => thief.close(resolve));
    expect(stolen).toBe('EADDRINUSE');
    for (let index = 0; index < 20; index += 1) {
      const res = await request(app.getHttpServer()).get('/api/v1/ruta-inexistente-mk');
      expect(res.status).toBe(404);
      expect(res.headers['x-request-id']).toBeTruthy();
      expect((res.text ?? '').length).toBeGreaterThan(2);
      expect(res.res?.socket?.remotePort).toBe(address.port);
      expect(app.getHttpServer().address()).toMatchObject({ address: '127.0.0.1', port: address.port });
    }
  });
});
