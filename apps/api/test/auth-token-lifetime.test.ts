import { createHash } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import {
  REFRESH_COOKIE_MAX_AGE_MS,
  REFRESH_TOKEN_UNTIL,
} from '../src/auth/auth.constants';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { AuthService } from '../src/auth/auth.service';
import { MemberAccessService } from '../src/auth/member-access';
import type { MailService } from '../src/mail/mail.service';

const SECRET = 'lifetime-test-access-secret-32-chars';

function config(): ConfigService {
  return {
    get: (key: string) => (key === 'NODE_ENV' ? 'test' : undefined),
    getOrThrow: (key: string) => {
      if (key === 'JWT_ACCESS_SECRET') return SECRET;
      throw new Error(`missing ${key}`);
    },
  } as unknown as ConfigService;
}

function serviceWith(prisma: unknown): AuthService {
  return new AuthService(
    prisma as never,
    new JwtService({}),
    config(),
    {} as MailService,
    new MemberAccessService(config()),
  );
}

describe('access tokens expire and refresh rows do not age out by date', () => {
  it('signs an access token for 15 minutes and stores a refresh row that does not age out', async () => {
    const passwordHash = await bcrypt.hash('secret', 4);
    let storedExpiresAt: Date | null = null;
    let cookieMaxAge: number | undefined;
    const prisma = {
      user: {
        findUnique: async () => ({
          id: 'user-1',
          email: 'a@b.c',
          passwordHash,
          role: 'USER',
        }),
      },
      refreshToken: {
        create: async ({ data }: { data: { expiresAt: Date } }) => {
          storedExpiresAt = data.expiresAt;
          return data;
        },
      },
    };
    const res = {
      cookie(_name: string, _value: string, options?: { maxAge?: number }) {
        cookieMaxAge = options?.maxAge;
        return res;
      },
    };
    const body = await serviceWith(prisma).login(
      { email: 'a@b.c', password: 'secret' },
      'web',
      res as never,
    );
    const exp = (new JwtService({}).decode(body.accessToken) as { exp?: number }).exp;
    expect(exp).toEqual(expect.any(Number));
    expect((exp ?? 0) - Math.floor(Date.now() / 1000)).toBeGreaterThan(14 * 60);
    expect((exp ?? 0) - Math.floor(Date.now() / 1000)).toBeLessThanOrEqual(15 * 60);
    expect(storedExpiresAt?.toISOString()).toBe(REFRESH_TOKEN_UNTIL.toISOString());
    expect(cookieMaxAge).toBe(REFRESH_COOKIE_MAX_AGE_MS);
  });

  it('rotates a refresh token whose stored date is already past', async () => {
    const presented = 'ab'.repeat(48);
    const tx = {
      refreshToken: {
        updateMany: async () => ({ count: 1 }),
        create: async () => ({}),
      },
    };
    const prisma = {
      refreshToken: {
        findUnique: async () => ({
          id: 'row-1',
          userId: 'user-1',
          tokenHash: createHash('sha256').update(presented).digest('hex'),
          expiresAt: new Date(Date.now() - 86_400_000),
          revokedAt: null,
          user: { id: 'user-1', email: 'a@b.c', role: 'USER' },
        }),
      },
      $transaction: async (fn: (client: typeof tx) => Promise<boolean>) => fn(tx),
    };
    const out = await serviceWith(prisma).refresh(presented, 'native', {} as never);
    expect(out.refreshToken).toMatch(/^[0-9a-f]{96}$/);
    const exp = (new JwtService({}).decode(out.accessToken) as { exp?: number }).exp;
    expect((exp ?? 0) - Math.floor(Date.now() / 1000)).toBeGreaterThan(14 * 60);
  });

  it('rejects an expired access token and accepts a fresh one', async () => {
    const jwt = new JwtService({ secret: SECRET });
    const guard = new JwtAuthGuard(jwt, config());
    const expired = await jwt.signAsync(
      { sub: 'user-1', email: 'a@b.c', role: 'USER' },
      { secret: SECRET, expiresIn: '-1s' },
    );
    const fresh = await jwt.signAsync(
      { sub: 'user-1', email: 'a@b.c', role: 'USER' },
      { secret: SECRET, expiresIn: '15m' },
    );
    const ctx = (token: string) => ({
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: `Bearer ${token}` } }),
      }),
    }) as never;
    await expect(guard.canActivate(ctx(expired))).rejects.toThrow('Invalid access token');
    await expect(guard.canActivate(ctx(fresh))).resolves.toBe(true);
  });
});
