import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { parseClientKind, presentedRefreshToken } from '../src/auth/client-kind';
import {
  MemberAccessService,
  parsePreviewUserIds,
  resolveMemberAccess,
} from '../src/auth/member-access';
import { DiagnosticOpenGuard } from '../src/diagnostic/diagnostic-open.guard';
import { EARLY_ACCESS_MODE } from '../src/product-phase';

const PREVIEW_ID = '6f1c9d2e-0000-4000-8000-000000000001';
const OTHER_ID = '6f1c9d2e-0000-4000-8000-000000000002';

function configWith(values: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

function guardContext(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
}

describe('resolveMemberAccess', () => {
  const previewUserIds = parsePreviewUserIds(` ${PREVIEW_ID.toUpperCase()} , ,${OTHER_ID}x`);

  it('parses a comma list, trimming blanks and case', () => {
    expect(previewUserIds.has(PREVIEW_ID)).toBe(true);
    expect(previewUserIds.size).toBe(2);
    expect(parsePreviewUserIds(undefined).size).toBe(0);
  });

  it('early access on: every authenticated account enters the questionnaire; the list only marks the review note', () => {
    expect(resolveMemberAccess({ earlyAccess: true, previewUserIds, userId: PREVIEW_ID })).toEqual({
      canUseMemberProduct: true,
      isMemberPreview: true,
    });
    expect(resolveMemberAccess({ earlyAccess: true, previewUserIds, userId: OTHER_ID })).toEqual({
      canUseMemberProduct: true,
      isMemberPreview: false,
    });
  });

  it('early access off: every authenticated account keeps the normal journey', () => {
    expect(resolveMemberAccess({ earlyAccess: false, previewUserIds, userId: OTHER_ID })).toEqual({
      canUseMemberProduct: true,
      isMemberPreview: false,
    });
    expect(
      resolveMemberAccess({ earlyAccess: false, previewUserIds: new Set(), userId: PREVIEW_ID }),
    ).toEqual({ canUseMemberProduct: true, isMemberPreview: false });
  });

  it('denies without an authenticated user in both modes', () => {
    for (const earlyAccess of [true, false]) {
      expect(resolveMemberAccess({ earlyAccess, previewUserIds, userId: undefined }).canUseMemberProduct).toBe(
        false,
      );
    }
  });
});

describe('DiagnosticOpenGuard', () => {
  const guard = new DiagnosticOpenGuard(
    new MemberAccessService(configWith({ MEMBER_PREVIEW_USER_IDS: PREVIEW_ID })),
  );

  it('uses the checked-in early access flag (these cases assume it is on)', () => {
    expect(EARLY_ACCESS_MODE).toBe(true);
  });

  it('lets a designated account through', () => {
    expect(guard.canActivate(guardContext({ user: { sub: PREVIEW_ID, role: 'USER' } }))).toBe(true);
  });

  it('lets a normal account through, on web and on a native client', () => {
    expect(
      guard.canActivate(
        guardContext({ user: { sub: OTHER_ID, role: 'USER' }, headers: { 'x-mk-client': 'ios' } }),
      ),
    ).toBe(true);
    expect(guard.canActivate(guardContext({ user: { sub: OTHER_ID, role: 'ADMIN' } }))).toBe(true);
  });

  it('rejects a request without a verified subject', () => {
    expect(() => guard.canActivate(guardContext({ headers: { 'x-mk-client': 'ios' } }))).toThrow(
      UnauthorizedException,
    );
  });

  it('still lets an authenticated account through when the review list is empty', () => {
    const closed = new DiagnosticOpenGuard(new MemberAccessService(configWith({})));
    expect(closed.canActivate(guardContext({ user: { sub: PREVIEW_ID } }))).toBe(true);
  });
});

describe('X-MK-Client contract', () => {
  it('maps absent or web to the browser contract, ios and android to native', () => {
    expect(parseClientKind(undefined)).toBe('web');
    expect(parseClientKind('web')).toBe('web');
    expect(parseClientKind('iOS')).toBe('native');
    expect(parseClientKind(['android'])).toBe('native');
  });

  it('rejects unknown values', () => {
    expect(() => parseClientKind('desktop')).toThrow(BadRequestException);
    expect(() => parseClientKind('ios, web')).toThrow(BadRequestException);
  });

  it('native never reads the cookie; web prefers the body', () => {
    expect(presentedRefreshToken('native', undefined, 'cookie-token')).toBeUndefined();
    expect(presentedRefreshToken('native', 'body-token', 'cookie-token')).toBe('body-token');
    expect(presentedRefreshToken('web', 'body-token', 'cookie-token')).toBe('body-token');
    expect(presentedRefreshToken('web', undefined, 'cookie-token')).toBe('cookie-token');
  });
});
