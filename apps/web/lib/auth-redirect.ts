import type { MeResponse } from '@/lib/api';
import { canUseMemberProduct } from '@/lib/member-access';

/** Post-login/register destination based on role and member access (T4.1). */
export function getPostAuthPath(
  user: Pick<MeResponse, 'role' | 'onboardingStep' | 'access'>,
): string {
  if (user.role === 'ADMIN') return '/admin';
  if (!canUseMemberProduct(user)) return '/panel';
  return '/panel';
}
