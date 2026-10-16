const ACCESS_KEY = 'mk_access_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(ACCESS_KEY) ?? sessionStorage.getItem(ACCESS_KEY);
  if (stored) localStorage.setItem(ACCESS_KEY, stored);
  return stored;
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_KEY, token);
  sessionStorage.setItem(ACCESS_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(ACCESS_KEY);
}
