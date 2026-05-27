const ACCESS_KEY = 'mk_access_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ACCESS_KEY);
}

export function setAccessToken(token: string): void {
  sessionStorage.setItem(ACCESS_KEY, token);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(ACCESS_KEY);
}
