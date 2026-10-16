import type { MeResponse } from '@/lib/api';
import { canUseMemberProduct } from '@/lib/member-access';

const DIAGNOSTIC_STEPS = new Set([
  'TERMS_PENDING',
  'DIAGNOSTICO_BIENVENIDA',
  'FASE1_EN_CURSO',
]);

/** Post-login/register destination based on role, member access and onboarding progress. */
export function getPostAuthPath(
  user: Pick<MeResponse, 'role' | 'onboardingStep' | 'access'>,
): string {
  if (user.role === 'ADMIN') return '/admin';
  if (!canUseMemberProduct(user)) return '/panel';
  if (!user.onboardingStep || DIAGNOSTIC_STEPS.has(user.onboardingStep)) return '/diagnostico';
  return '/panel';
}
