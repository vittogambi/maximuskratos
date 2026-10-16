'use client';

import { useAuthSession } from '@/components/auth-session-provider';
import { isMemberPreview } from '@/lib/member-access';

/** Shown only to accounts in the private review list while early access is on. */
export function ReviewVersionNote() {
  const { user } = useAuthSession();
  if (!isMemberPreview(user)) return null;

  return (
    <p className="mk-review-note">
      Versión privada de revisión. Este diagnóstico es un prototipo y sus resultados están en
      evaluación.
    </p>
  );
}
