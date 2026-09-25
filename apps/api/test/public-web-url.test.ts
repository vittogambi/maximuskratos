import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  configuredWebUrl,
  publicWebUrl,
} from '../src/mail/public-web-url';

const KEYS = [
  'WEB_URL',
  'APP_URL',
  'CORS_ORIGINS',
  'RAILWAY_SERVICE__MK_WEB_URL',
] as const;

const saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

beforeEach(() => {
  for (const key of KEYS) delete process.env[key];
});

afterAll(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe('publicWebUrl', () => {
  it('uses WEB_URL when Origin is missing', () => {
    process.env.WEB_URL = 'https://maximus-kratos.com';
    expect(configuredWebUrl()).toBe('https://maximus-kratos.com');
    expect(publicWebUrl()).toBe('https://maximus-kratos.com');
  });

  it('prefers Origin when it is in CORS_ORIGINS', () => {
    process.env.WEB_URL = 'https://maximus-kratos.com';
    process.env.CORS_ORIGINS = 'https://mkweb-staging.up.railway.app';
    expect(publicWebUrl('https://mkweb-staging.up.railway.app')).toBe(
      'https://mkweb-staging.up.railway.app',
    );
  });

  it('ignores Origin outside CORS_ORIGINS', () => {
    process.env.WEB_URL = 'https://maximus-kratos.com';
    process.env.CORS_ORIGINS = 'https://maximus-kratos.com';
    expect(publicWebUrl('https://evil.example')).toBe(
      'https://maximus-kratos.com',
    );
  });

  it('falls back to Railway web host when WEB_URL is unset', () => {
    process.env.RAILWAY_SERVICE__MK_WEB_URL = 'mkweb-staging.up.railway.app';
    expect(configuredWebUrl()).toBe('https://mkweb-staging.up.railway.app');
  });
});
