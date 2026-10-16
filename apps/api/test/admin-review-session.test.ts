import { describe, expect, it } from 'vitest';
import { pickAdminReviewSession } from '../src/admin/member-journey.service';

const row = (
  id: string,
  status: string,
  responses: number,
  lastActivityAt: string,
  completedAt: string | null = null,
) => ({
  id,
  status,
  completedAt: completedAt ? new Date(completedAt) : null,
  lastActivityAt: new Date(lastActivityAt),
  version: { definitionRef: 'formulario-completo' as string | null },
  _count: { responses },
});

describe('pickAdminReviewSession', () => {
  it('prefers a completed formulario over a newer active session', () => {
    const picked = pickAdminReviewSession([
      row('active-empty', 'ACTIVE', 0, '2026-10-16T18:00:00.000Z'),
      row('done', 'COMPLETED', 120, '2026-10-10T12:00:00.000Z', '2026-10-10T12:00:00.000Z'),
    ]);
    expect(picked?.id).toBe('done');
  });
});
