import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth-storage', () => ({
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
}));

import { fetchAuthed } from '@/lib/api';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('fetchAuthed', () => {
  it('retries once when the access token is expired and the refresh succeeds', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('expired', { status: 401 }))
      .mockResolvedValueOnce(json({ accessToken: 'fresh' }))
      .mockResolvedValueOnce(json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await fetchAuthed('stale', '/api/v1/diagnostic/state');
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[2][1].headers.Authorization)).toBe('Bearer fresh');
  });

  it('does not loop when the retry is also unauthorized', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('expired', { status: 401 }))
      .mockResolvedValueOnce(json({ accessToken: 'fresh' }))
      .mockResolvedValueOnce(new Response('still no', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await fetchAuthed('stale', '/api/v1/journey/plans');
    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('returns the original 401 when refresh fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('expired', { status: 401 }))
      .mockResolvedValueOnce(new Response('no session', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await fetchAuthed('stale', '/api/v1/diagnostic/state');
    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
