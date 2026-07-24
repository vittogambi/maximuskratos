import { isEarlyAccessMode } from '@/lib/product-phase';

const DIAGNOSTIC_STEPS = new Set([
  'TERMS_PENDING',
  'DIAGNOSTICO_BIENVENIDA',
  'FASE1_EN_CURSO',
]);

/** Post-login/register destination based on role, early-access mode and onboarding progress. */
export function getPostAuthPath(role: string, onboardingStep?: string): string {
  if (role === 'ADMIN') return '/admin';
  if (isEarlyAccessMode()) return '/panel';
  if (!onboardingStep || DIAGNOSTIC_STEPS.has(onboardingStep)) return '/diagnostico';
  return '/panel';
}
