import { describe, expect, it } from 'vitest';
import { ledgerFrom, pickLedgerSession, type LedgerSession } from '../src/instrumentos/answer-ledger';

function session(partial: Partial<LedgerSession> & Pick<LedgerSession, 'id' | 'status'>): LedgerSession {
  return {
    completedAt: null,
    catalogVersion: 'formulario-completo@6',
    responses: [],
    ...partial,
  };
}

describe('answer ledger', () => {
  it('returns three responses from the active session', () => {
    const entries = ledgerFrom([
      session({
        id: 'active',
        status: 'ACTIVE',
        responses: [
          { sourceRef: 'a', revision: 1, answeredAt: new Date(), exceptionKind: null, freeText: '1', selectedOptionIds: [], skipped: false },
          { sourceRef: 'b', revision: 1, answeredAt: new Date(), exceptionKind: null, freeText: '2', selectedOptionIds: [], skipped: false },
          { sourceRef: 'c', revision: 1, answeredAt: new Date(), exceptionKind: null, freeText: '3', selectedOptionIds: [], skipped: false },
        ],
      }),
    ]);
    expect(entries).toHaveLength(3);
  });

  it('uses the latest completed session when no active session exists', () => {
    const chosen = pickLedgerSession([
      session({ id: 'old', status: 'COMPLETED', completedAt: new Date('2026-01-01') }),
      session({ id: 'new', status: 'COMPLETED', completedAt: new Date('2026-02-01') }),
    ]);
    expect(chosen?.id).toBe('new');
  });

  it('ignores abandoned sessions', () => {
    const entries = ledgerFrom([
      session({ id: 'ab', status: 'ABANDONED', responses: [{ sourceRef: 'x', revision: 1, answeredAt: new Date(), exceptionKind: null, freeText: 'n', selectedOptionIds: [], skipped: false }] }),
    ]);
    expect(entries).toHaveLength(0);
  });

  it('does not expose exception answers as values', () => {
    const entries = ledgerFrom([
      session({
        id: 's',
        status: 'ACTIVE',
        responses: [{ sourceRef: 'a', revision: 1, answeredAt: new Date(), exceptionKind: 'UNKNOWN', freeText: null, selectedOptionIds: [], skipped: false }],
      }),
    ]);
    expect(entries[0].value).toBeNull();
    expect(entries[0].exceptionKind).toBe('UNKNOWN');
  });

  it('keeps the highest revision for the same sourceRef', () => {
    const entries = ledgerFrom([
      session({
        id: 's',
        status: 'ACTIVE',
        responses: [
          { sourceRef: 'a', revision: 1, answeredAt: new Date(), exceptionKind: null, freeText: 'old', selectedOptionIds: [], skipped: false },
          { sourceRef: 'a', revision: 2, answeredAt: new Date(), exceptionKind: null, freeText: 'new', selectedOptionIds: [], skipped: false },
        ],
      }),
    ]);
    expect(entries[0].value).toBe('new');
    expect(entries[0].revision).toBe(2);
  });
});
