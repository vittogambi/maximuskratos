import Link from 'next/link';
import { JourneyApiError } from '@/lib/journey-api';

export type JourneyNoticeState = {
  message: string;
  nextHref: string | null;
  alternatives: string[];
  code: string | null;
  scope: 'HEALTH' | 'CONVERSATION' | null;
} | null;

const TARGET_LABELS: Record<string, string> = {
  '/diagnostico': 'Abrir el cuestionario',
  '/proposito': 'Abrir la hoja de ruta',
  '/planes': 'Abrir planes',
};

export function noticeFrom(err: unknown, fallback: string): NonNullable<JourneyNoticeState> {
  if (err instanceof JourneyApiError) {
    const scope = err.scope === 'HEALTH' || err.scope === 'CONVERSATION' ? err.scope : null;
    return { message: err.message, nextHref: err.nextHref, alternatives: err.alternatives, code: err.code, scope };
  }
  return { message: err instanceof Error ? err.message : fallback, nextHref: null, alternatives: [], code: null, scope: null };
}

/** Shows why a write was refused and, when the server names one, the step that unblocks it. */
export function JourneyNotice({ notice }: { notice: JourneyNoticeState }) {
  if (!notice) return null;
  return (
    <p role="alert">
      {notice.message}
      {notice.alternatives.length > 0 ? ` Puedes: ${notice.alternatives.join('. ')}.` : null}
      {notice.nextHref ? (
        <>
          {' '}
          <Link href={notice.nextHref}>{TARGET_LABELS[notice.nextHref] ?? 'Continuar'}</Link>
        </>
      ) : null}
    </p>
  );
}
