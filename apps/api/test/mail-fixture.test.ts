import type { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MailService } from '../src/mail/mail.service';

const config = {
  get: (key: string) => (key === 'RESEND_API_KEY' ? 'test-key' : undefined),
} as unknown as ConfigService;

describe('registration notify', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not send anything for a fixture account, even though the recipient is the team', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const sent = await new MailService(config).sendNewRegistrationNotify('ana@fixtures.mk.invalid', new Date());
    expect(sent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('still notifies the team about a real registration', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await new MailService(config).sendNewRegistrationNotify('ana@example.com', new Date());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
