import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAccessToken = vi.fn();
const setAccessToken = vi.fn();
const apiRefresh = vi.fn();

vi.mock('@/lib/auth-storage', () => ({
  getAccessToken: () => getAccessToken(),
  setAccessToken: (token: string) => setAccessToken(token),
}));

vi.mock('@/lib/api', () => ({
  getApiBaseUrl: () => 'http://localhost:4000',
  apiRefresh: () => apiRefresh(),
}));

describe('labRequest refresh on 401', () => {
  beforeEach(() => {
    getAccessToken.mockReset();
    setAccessToken.mockReset();
    apiRefresh.mockReset();
    vi.unstubAllGlobals();
  });

  it('retries replay-reviewed after refreshing an expired token', async () => {
    getAccessToken.mockReturnValue('expired');
    apiRefresh.mockResolvedValue({ accessToken: 'fresh' });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'replay-1', changesetId: 'cs-1', results: [] }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { labRequest } = await import('@/lib/lab-api');
    const body = await labRequest<{ id: string }>('/candidates/replay-reviewed', {
      method: 'POST',
      body: JSON.stringify({ changeset_id: 'cs-1' }),
    });

    expect(apiRefresh).toHaveBeenCalledOnce();
    expect(setAccessToken).toHaveBeenCalledWith('fresh');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer fresh');
    expect(body.id).toBe('replay-1');
  });

  it('refreshes when there is no access token yet', async () => {
    getAccessToken.mockReturnValue(null);
    apiRefresh.mockResolvedValue({ accessToken: 'fresh' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'ok' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { labRequest } = await import('@/lib/lab-api');
    const body = await labRequest<{ id: string }>('/cases');

    expect(apiRefresh).toHaveBeenCalledOnce();
    expect(setAccessToken).toHaveBeenCalledWith('fresh');
    expect(body.id).toBe('ok');
  });
});
