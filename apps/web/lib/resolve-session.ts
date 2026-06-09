import { apiMe, apiRefresh, type MeResponse } from '@/lib/api';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/lib/auth-storage';

let inflight: Promise<MeResponse | null> | null = null;

async function resolveSessionOnce(): Promise<MeResponse | null> {
  try {
    let token = getAccessToken();
    if (!token) {
      const refreshed = await apiRefresh();
      token = refreshed.accessToken;
      setAccessToken(token);
    }
    return await apiMe(token);
  } catch {
    clearAccessToken();
    return null;
  }
}

/** Resolve current user from sessionStorage + refresh cookie. Dedupes concurrent calls. */
export async function resolveSession(
  options?: { force?: boolean },
): Promise<MeResponse | null> {
  if (options?.force) {
    inflight = null;
  }
  if (!inflight) {
    inflight = resolveSessionOnce().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}
