import { apiMe, apiRefresh, type MeResponse } from '@/lib/api';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/lib/auth-storage';

let inflight: Promise<MeResponse | null> | null = null;
let resolveEpoch = 0;

async function resolveSessionOnce(capturedEpoch: number): Promise<MeResponse | null> {
  try {
    let token = getAccessToken();
    if (!token) {
      const refreshed = await apiRefresh();
      if (capturedEpoch !== resolveEpoch) return null;
      token = refreshed.accessToken;
      setAccessToken(token);
    }
    if (capturedEpoch !== resolveEpoch) return null;
    return await apiMe(token);
  } catch {
    if (capturedEpoch === resolveEpoch) {
      clearAccessToken();
    }
    return null;
  }
}

/** Resolve current user from sessionStorage + refresh cookie. Dedupes concurrent calls. */
export async function resolveSession(
  options?: { force?: boolean },
): Promise<MeResponse | null> {
  if (options?.force) {
    resolveEpoch++;
    inflight = null;
  }
  const capturedEpoch = resolveEpoch;
  if (!inflight) {
    const current = resolveSessionOnce(capturedEpoch).finally(() => {
      if (inflight === current) {
        inflight = null;
      }
    });
    inflight = current;
  }
  const result = await inflight;
  if (capturedEpoch !== resolveEpoch) {
    return resolveSession();
  }
  return result;
}

/** Clear in-flight session resolution (e.g. after logout). */
export function resetResolveSession() {
  resolveEpoch++;
  inflight = null;
}
