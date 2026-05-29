import { toAuthUserMessage, type AuthErrorContext } from './auth-errors';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

async function parseError(
  res: Response,
  context: AuthErrorContext,
): Promise<string> {
  let raw = res.statusText || '';
  try {
    const body = await res.json();
    if (Array.isArray(body.message)) raw = body.message.join(', ');
    else if (typeof body.message === 'string') raw = body.message;
  } catch {
    /* ignore */
  }
  return toAuthUserMessage(raw, res.status, context);
}

export async function apiRegister(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseError(res, 'register'));
  return res.json();
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseError(res, 'login'));
  return res.json();
}

export async function apiRefresh(): Promise<{ accessToken: string }> {
  const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiLogout(): Promise<void> {
  await fetch(`${API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function apiMe(accessToken: string): Promise<AuthUser & Record<string, unknown>> {
  const res = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export function getApiDocsUrl(): string {
  return `${API_URL}/api/v1/docs`;
}
