function normalizeOrigin(raw: string): string {
  return raw.trim().replace(/\/$/, '');
}

export function allowedCorsOrigins(): string[] {
  return (
    process.env.CORS_ORIGINS ??
    'http://localhost:3000,http://127.0.0.1:3000'
  )
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
}

export function configuredWebUrl(): string {
  const explicit = process.env.WEB_URL ?? process.env.APP_URL;
  if (explicit?.trim()) return normalizeOrigin(explicit);

  const railway = process.env.RAILWAY_SERVICE__MK_WEB_URL?.trim();
  if (railway) {
    const host = railway.replace(/^https?:\/\//, '');
    return `https://${host}`;
  }

  return 'http://localhost:3000';
}

export function publicWebUrl(requestOrigin?: string | null): string {
  const origin = requestOrigin ? normalizeOrigin(requestOrigin) : '';
  if (origin && allowedCorsOrigins().includes(origin)) {
    return origin;
  }
  return configuredWebUrl();
}
