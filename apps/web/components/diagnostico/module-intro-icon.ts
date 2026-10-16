import type { AppIconName } from '@/components/icons/registry';
import { resolveIconName } from '@/components/icons/registry';

/** Presentation mark for each section intro. The stored icon is the same for every module. */
const MODULE_INTRO_ICONS: Record<string, AppIconName> = {
  'e-aud-s1': 'brain',
  'e-aud-s2': 'activity',
  'e-aud-s3': 'compass',
  'e-aud-s4': 'wallet',
  'e-aud-s5': 'handshake',
  'e-aud-s6': 'flame',
  'f-rad-001-s1': 'muscles',
  'f-rad-001-s2': 'stethoscope',
  'f-rad-001-s3': 'heart-pulse',
  'f-rad-001-s4': 'dumbbell',
  'f-rad-001-s5': 'moon',
  'f-rad-001-s6': 'scan-eye',
  'f-rad-001-s7': 'activity',
  'f-rad-002-s1': 'heart',
  'f-rad-002-s2': 'users',
  'f-rad-002-s3': 'handshake',
  'f-rad-002-s4': 'briefcase',
  'f-rad-003-s1': 'wallet',
  'f-rad-003-s2': 'coins',
  'f-rad-003-s3': 'target',
  'f-rad-003-s4': 'lock',
  'f-rad-003-proy': 'building-2',
  'e-per-origen': 'anchor',
  'e-per-vision': 'helm',
  'e-per-valores': 'columns',
  'e-per-estandares': 'laurel-wreath',
  'e-per-identidad': 'rubik',
  'e-per-dificultades': 'shadow',
  'e-per-personalidad': 'brain',
  'e-per-ikigai': 'ikigai',
  'e-per-huella': 'fingerprint',
};

export function moduleIntroIcon(slug: string | null | undefined, stored: string | null | undefined): AppIconName | null {
  if (slug && MODULE_INTRO_ICONS[slug]) return MODULE_INTRO_ICONS[slug];
  if (stored) return resolveIconName(stored) ?? null;
  return null;
}
