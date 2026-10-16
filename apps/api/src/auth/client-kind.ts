import { BadRequestException } from '@nestjs/common';

export const CLIENT_HEADER = 'x-mk-client';

/** Response contract only. Never an authorization signal. */
export type ClientKind = 'web' | 'native';

export function parseClientKind(raw: string | string[] | undefined): ClientKind {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim().toLowerCase();
  if (!value || value === 'web') return 'web';
  if (value === 'ios' || value === 'android') return 'native';
  throw new BadRequestException('X-MK-Client inválido. Valores aceptados: web, ios, android.');
}

/**
 * Native clients never fall back to the browser cookie, so a native header
 * cannot turn an httpOnly cookie into a refresh token readable in JSON.
 */
export function presentedRefreshToken(
  client: ClientKind,
  bodyToken: string | undefined,
  cookieToken: string | undefined,
): string | undefined {
  if (client === 'native') return bodyToken;
  return bodyToken ?? cookieToken;
}
