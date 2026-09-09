const DOMAIN_PREFIX: Record<string, string> = {
  MENTALIDAD: 'MEN',
  RELACIONES: 'REL',
  FINANZAS: 'FIN',
  CUERPO: 'CUE',
  PROPÓSITO: 'PRO',
  PROPOSITO: 'PRO',
};

export function foldAccents(text: string): string {
  return text.normalize('NFKD').replace(/\p{M}/gu, '');
}

export function slugify(label: string): string {
  return foldAccents(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

export function domainPrefix(domain: string): string {
  return DOMAIN_PREFIX[domain] ?? slugify(domain).slice(0, 3).toUpperCase();
}

export function dimensionKey(domain: string, canonicalLabel: string): string {
  return `${domainPrefix(domain)}.${slugify(canonicalLabel)}`;
}

export function yesNo(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const text = String(value ?? '')
    .trim()
    .toLowerCase();
  return text === 'sí' || text === 'si' || text === 'yes' || text === 'true';
}

export function asString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value);
  }
  return String(value).trim();
}

export function asNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function severityKey(
  value: unknown,
): 'MEDIA' | 'ALTA' | 'CRITICA' | null {
  const text = foldAccents(asString(value)).toUpperCase();
  if (text === 'MEDIA') return 'MEDIA';
  if (text === 'ALTA') return 'ALTA';
  if (text === 'CRITICA') return 'CRITICA';
  return null;
}
