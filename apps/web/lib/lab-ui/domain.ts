import type { AppIconName } from '@/components/icons/registry';
import { DOMAINS } from '@/lib/mk-system';

export type LabDomainKey = 'MENTALIDAD' | 'RELACIONES' | 'FINANZAS' | 'CUERPO' | 'PROPÓSITO' | 'PURPOSE' | 'SAFETY';

export interface LabDomainToken {
  key: LabDomainKey;
  label: string;
  icon: AppIconName;
  css: string;
}

const landingIcon = (key: (typeof DOMAINS)[number]['key']): AppIconName =>
  DOMAINS.find((domain) => domain.key === key)!.icon;

export const LAB_DOMAIN_TOKENS: Record<string, LabDomainToken> = {
  MENTALIDAD: { key: 'MENTALIDAD', label: 'Mentalidad', icon: landingIcon('mentalidad'), css: 'mind' },
  RELACIONES: { key: 'RELACIONES', label: 'Relaciones', icon: landingIcon('relaciones'), css: 'relationships' },
  FINANZAS: { key: 'FINANZAS', label: 'Finanzas', icon: landingIcon('financiero'), css: 'finance' },
  CUERPO: { key: 'CUERPO', label: 'Cuerpo', icon: landingIcon('corporal'), css: 'body' },
  'PROPÓSITO': { key: 'PROPÓSITO', label: 'Propósito', icon: 'compass', css: 'purpose' },
  PURPOSE: { key: 'PURPOSE', label: 'Propósito', icon: 'compass', css: 'purpose' },
  SAFETY: { key: 'SAFETY', label: 'Alertas', icon: 'shield-alert', css: 'safety' },
};

export function domainToken(domain: string | null | undefined): LabDomainToken | null {
  if (!domain) return null;
  return LAB_DOMAIN_TOKENS[domain] ?? null;
}

export function humanDimensionLabel(label: string | null | undefined): string {
  if (!label) return '';
  if (label === label.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(label)) {
    return label
      .toLowerCase()
      .split(/[_\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return label;
}
