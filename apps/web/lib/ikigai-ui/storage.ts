const KEY = 'mk_ikigai_session';

export type StoredIkigaiSession = { sessionId: string; token: string };

export function readStoredSession(): StoredIkigaiSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredIkigaiSession;
    if (!parsed.sessionId || !parsed.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredSession(value: StoredIkigaiSession) {
  localStorage.setItem(KEY, JSON.stringify(value));
}

export function clearStoredSession() {
  localStorage.removeItem(KEY);
}
