import type { MeResponse } from '@/lib/api';

type WithAccess = Pick<MeResponse, 'access'> | null | undefined;

/** Reads the capability returned by /auth/me. Missing data means no access. */
export function canUseMemberProduct(user: WithAccess): boolean {
  return user?.access?.canUseMemberProduct === true;
}

export function isMemberPreview(user: WithAccess): boolean {
  return user?.access?.isMemberPreview === true;
}
