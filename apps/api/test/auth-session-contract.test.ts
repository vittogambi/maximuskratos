import { createHash } from 'node:crypto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { REFRESH_COOKIE_NAME } from '../src/auth/auth.constants';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtAuthGuard, type AuthenticatedRequest } from '../src/auth/jwt-auth.guard';
import { MemberAccessService } from '../src/auth/member-access';
import type { MailService } from '../src/mail/mail.service';
import { PrismaService } from '../src/prisma/prisma.service';

const hasDb = Boolean(process.env.DATABASE_URL);
const RUN = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
const PASSWORD = 'contract-test-password';
const REFRESH_SHAPE = /^[0-9a-f]{96}$/;

type Jar = { set: Record<string, string>; cleared: string[] };
type FakeResponse = Response & { jar: Jar };

function config(values: Record<string, string>): ConfigService {
  return {
    get: (key: string) => values[key],
    getOrThrow: (key: string) => {
      const value = values[key];
      if (value === undefined) throw new Error(`missing ${key}`);
      return value;
    },
  } as unknown as ConfigService;
}

function fakeRes(): FakeResponse {
  const jar: Jar = { set: {}, cleared: [] };
  const res = {
    jar,
    cookie(name: string, value: string) {
      jar.set[name] = value;
      return res;
    },
    clearCookie(name: string) {
      jar.cleared.push(name);
      return res;
    },
  };
  return res as unknown as FakeResponse;
}

function fakeReq(cookieToken?: string): Request {
  return {
    cookies: cookieToken ? { [REFRESH_COOKIE_NAME]: cookieToken } : {},
    headers: {},
  } as unknown as Request;
}

function refreshTokenOf(body: object): string | undefined {
  return (body as { refreshToken?: string }).refreshToken;
}

function hash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

describe.skipIf(!hasDb)('auth session contract (web cookie vs native body)', () => {
  let prisma: PrismaService;
  let jwt: JwtService;
  let cfg: ConfigService;
  let mail: MailService;
  let service: AuthService;
  let controller: AuthController;
  let seq = 0;

  const email = (label: string) => `auth-${RUN}-${label}-${seq++}@test.local`;

  async function isActive(token: string): Promise<boolean> {
    const row = await prisma.refreshToken.findUnique({ where: { tokenHash: hash(token) } });
    return Boolean(row && !row.revokedAt && row.expiresAt > new Date());
  }

  async function activeCount(userId: string): Promise<number> {
    return prisma.refreshToken.count({ where: { userId, revokedAt: null } });
  }

  async function nativeSession(label: string) {
    const body = await controller.register({ email: email(label), password: PASSWORD }, 'ios', fakeRes());
    const refreshToken = refreshTokenOf(body);
    if (!refreshToken) throw new Error('native register returned no refresh token');
    return { userId: body.user.id, userEmail: body.user.email, accessToken: body.accessToken, refreshToken };
  }

  async function webLogin(userEmail: string) {
    const res = fakeRes();
    const body = await controller.login({ email: userEmail, password: PASSWORD }, undefined, res);
    return { body, cookie: res.jar.set[REFRESH_COOKIE_NAME] };
  }

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    jwt = new JwtService({});
    cfg = config({ JWT_ACCESS_SECRET: 'contract-test-access-secret-32-chars-min', NODE_ENV: 'test' });
    mail = {
      sendWelcomeEmail: async () => true,
      sendNewRegistrationNotify: async () => true,
    } as unknown as MailService;
    service = new AuthService(prisma, jwt, cfg, mail, new MemberAccessService(config({})));
    controller = new AuthController(service);
  });

  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { email: { contains: `auth-${RUN}-` } } });
    await prisma?.$disconnect();
  });

  it('web register, login and refresh keep the refresh token in the httpOnly cookie only', async () => {
    const res = fakeRes();
    const registered = await controller.register({ email: email('web'), password: PASSWORD }, 'web', res);
    const cookie = res.jar.set[REFRESH_COOKIE_NAME];
    expect(cookie).toMatch(REFRESH_SHAPE);
    expect(refreshTokenOf(registered)).toBeUndefined();
    expect(JSON.stringify(registered)).not.toContain(cookie);
    expect(await isActive(cookie)).toBe(true);
    expect(await prisma.refreshToken.count({ where: { tokenHash: cookie } })).toBe(0);

    const login = await webLogin(registered.user.email);
    expect(refreshTokenOf(login.body)).toBeUndefined();
    expect(login.cookie).toMatch(REFRESH_SHAPE);

    const refreshRes = fakeRes();
    const refreshed = await controller.refresh(fakeReq(login.cookie), undefined, {}, refreshRes);
    expect(Object.keys(refreshed)).toEqual(['accessToken']);
    const rotatedCookie = refreshRes.jar.set[REFRESH_COOKIE_NAME];
    expect(rotatedCookie).toMatch(REFRESH_SHAPE);
    expect(rotatedCookie).not.toBe(login.cookie);
    expect(await isActive(login.cookie)).toBe(false);
    expect(await isActive(rotatedCookie)).toBe(true);
  });

  it('native register and login return both tokens in the body and set no cookie', async () => {
    const res = fakeRes();
    const registered = await controller.register({ email: email('native'), password: PASSWORD }, 'ios', res);
    expect(refreshTokenOf(registered)).toMatch(REFRESH_SHAPE);
    expect(res.jar.set).toEqual({});

    const loginRes = fakeRes();
    const login = await controller.login(
      { email: registered.user.email, password: PASSWORD },
      'android',
      loginRes,
    );
    expect(login.accessToken).toBeTruthy();
    expect(refreshTokenOf(login)).toMatch(REFRESH_SHAPE);
    expect(loginRes.jar.set).toEqual({});
  });

  it('native refresh rotates without cookies and the previous token stops working', async () => {
    const session = await nativeSession('rotate');
    const first = await controller.refresh(fakeReq(), 'ios', { refreshToken: session.refreshToken }, fakeRes());
    const next = refreshTokenOf(first);
    expect(next).toMatch(REFRESH_SHAPE);
    expect(next).not.toBe(session.refreshToken);

    await expect(
      controller.refresh(fakeReq(), 'ios', { refreshToken: session.refreshToken }, fakeRes()),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const second = await controller.refresh(fakeReq(), 'android', { refreshToken: next }, fakeRes());
    expect(refreshTokenOf(second)).toMatch(REFRESH_SHAPE);
  });

  it('body and cookie together: the body session rotates, the cookie session is untouched', async () => {
    const session = await nativeSession('both');
    const web = await webLogin(session.userEmail);

    const res = fakeRes();
    const out = await controller.refresh(fakeReq(web.cookie), 'web', { refreshToken: session.refreshToken }, res);
    expect(refreshTokenOf(out)).toBeUndefined();
    expect(await isActive(session.refreshToken)).toBe(false);
    expect(await isActive(web.cookie)).toBe(true);
    expect(await isActive(res.jar.set[REFRESH_COOKIE_NAME])).toBe(true);

    const nativeOut = await controller.refresh(
      fakeReq(web.cookie),
      'ios',
      { refreshToken: res.jar.set[REFRESH_COOKIE_NAME] },
      fakeRes(),
    );
    expect(refreshTokenOf(nativeOut)).toMatch(REFRESH_SHAPE);
    expect(await isActive(web.cookie)).toBe(true);
  });

  it('a native header with only the web cookie exposes nothing and consumes nothing', async () => {
    const session = await nativeSession('cookie-only');
    const web = await webLogin(session.userEmail);

    const res = fakeRes();
    await expect(controller.refresh(fakeReq(web.cookie), 'android', {}, res)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(res.jar.set).toEqual({});
    expect(await isActive(web.cookie)).toBe(true);
  });

  it('simultaneous refreshes of one token: at most one succeeds, one replacement is stored', async () => {
    const session = await nativeSession('race');
    const before = await activeCount(session.userId);

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => service.refresh(session.refreshToken, 'native', fakeRes())),
    );
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(4);
    for (const r of rejected) expect(r.reason).toBeInstanceOf(UnauthorizedException);
    expect(await isActive(session.refreshToken)).toBe(false);
    expect(await activeCount(session.userId)).toBe(before);
  });

  it('a failed write during rotation keeps the previous token valid', async () => {
    const session = await nativeSession('rollback');
    const collision = `collision-${RUN}`;
    await prisma.refreshToken.create({
      data: {
        userId: session.userId,
        tokenHash: hash(collision),
        expiresAt: new Date(Date.now() - 1000),
        revokedAt: new Date(),
      },
    });

    const patched = service as unknown as { newRefreshSecret: () => string };
    patched.newRefreshSecret = () => collision;
    try {
      await expect(service.refresh(session.refreshToken, 'native', fakeRes())).rejects.toThrow();
    } finally {
      delete (patched as { newRefreshSecret?: () => string }).newRefreshSecret;
    }

    expect(await isActive(session.refreshToken)).toBe(true);
    const recovered = await service.refresh(session.refreshToken, 'native', fakeRes());
    expect(refreshTokenOf(recovered)).toMatch(REFRESH_SHAPE);
  });

  it('logout: native requires its body token and revokes only that session; web clears the cookie', async () => {
    const session = await nativeSession('logout');
    const web = await webLogin(session.userEmail);

    await expect(controller.logout(fakeReq(), 'ios', {}, fakeRes())).rejects.toBeInstanceOf(BadRequestException);

    const nativeRes = fakeRes();
    await controller.logout(fakeReq(web.cookie), 'ios', { refreshToken: session.refreshToken }, nativeRes);
    expect(await isActive(session.refreshToken)).toBe(false);
    expect(await isActive(web.cookie)).toBe(true);
    expect(nativeRes.jar.cleared).toEqual([]);

    const webRes = fakeRes();
    await controller.logout(fakeReq(web.cookie), undefined, {}, webRes);
    expect(await isActive(web.cookie)).toBe(false);
    expect(webRes.jar.cleared).toContain(REFRESH_COOKIE_NAME);

    await expect(
      controller.refresh(fakeReq(), 'ios', { refreshToken: session.refreshToken }, fakeRes()),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logout-all revokes every refresh token; access tokens already issued live until they expire', async () => {
    const session = await nativeSession('all');
    const web = await webLogin(session.userEmail);
    const android = await controller.login({ email: session.userEmail, password: PASSWORD }, 'android', fakeRes());
    const androidRefresh = refreshTokenOf(android);
    if (!androidRefresh) throw new Error('android login returned no refresh token');

    const res = fakeRes();
    const out = await controller.logoutAll(
      { user: { sub: session.userId, email: session.userEmail, role: 'USER' } } as AuthenticatedRequest,
      undefined,
      res,
    );
    expect(out.revokedSessions).toBeGreaterThanOrEqual(3);
    expect(await activeCount(session.userId)).toBe(0);
    expect(res.jar.cleared).toContain(REFRESH_COOKIE_NAME);

    for (const token of [session.refreshToken, web.cookie, androidRefresh]) {
      await expect(service.refresh(token, 'native', fakeRes())).rejects.toBeInstanceOf(UnauthorizedException);
    }

    // Documented contract: JWT access tokens are not revoked server-side; they expire after 15 minutes.
    const guard = new JwtAuthGuard(jwt, cfg);
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: `Bearer ${session.accessToken}` } }),
      }),
    } as never;
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('rejects an unknown X-MK-Client before touching credentials', () => {
    expect(() =>
      controller.login({ email: email('bad-header'), password: PASSWORD }, 'desktop', fakeRes()),
    ).toThrow(BadRequestException);
  });

  it('/auth/me reports member access decided by the server, without changing role or subscription', async () => {
    const preview = await nativeSession('me-preview');
    const normal = await nativeSession('me-normal');
    const withList = new AuthService(
      prisma,
      jwt,
      cfg,
      mail,
      new MemberAccessService(config({ MEMBER_PREVIEW_USER_IDS: preview.userId })),
    );

    const previewMe = await withList.me(preview.userId);
    expect(previewMe.access).toEqual({ canUseMemberProduct: true, isMemberPreview: true });
    expect(previewMe.role).toBe('USER');
    expect(previewMe.subscription).toMatchObject({ status: 'TRIAL', trialEnd: null });

    const normalMe = await withList.me(normal.userId);
    expect(normalMe.access).toEqual({ canUseMemberProduct: true, isMemberPreview: false });
  });
});
