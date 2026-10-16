import { randomUUID } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import type { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

function write(entry: Record<string, unknown>) {
  const file = process.env.MK_TRACE_FILE;
  if (!file) return;
  appendFileSync(file, `${JSON.stringify({ layer: 'server', pid: process.pid, ...entry })}\n`);
}

/** Test-only. Logs ids and status, never bodies, tokens or answers. */
export function attachHttpTrace(app: INestApplication) {
  if (process.env.MK_TRACE_HTTP !== '1') return;
  const expressApp = app.getHttpAdapter().getInstance();
  const httpServer = app.getHttpServer();
  httpServer.on('listening', () => {
    const address = httpServer.address();
    write({ event: 'listening', address, node: process.version });
  });
  httpServer.on('clientError', (err: Error) => {
    write({ event: 'clientError', name: err.name, category: 'transport' });
  });
  httpServer.on('request', (req: Request) => {
    write({
      event: 'request',
      method: req.method,
      path: req.url,
      inboundId: req.headers['x-mk-test-id'] ?? null,
    });
  });
  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = randomUUID();
    res.setHeader('x-request-id', requestId);
    const started = Date.now();
    write({ event: 'express', requestId, inboundId: req.headers['x-mk-test-id'] ?? null, method: req.method, path: req.originalUrl });
    res.on('finish', () => {
      write({
        event: 'finish',
        requestId,
        inboundId: req.headers['x-mk-test-id'] ?? null,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        ms: Date.now() - started,
        contentType: res.getHeader('content-type') ?? null,
        contentLength: res.getHeader('content-length') ?? null,
        category: res.statusCode >= 400 ? 'http_error' : 'ok',
      });
    });
    next();
  });
}
