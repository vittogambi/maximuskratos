import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPlansList, invalidatePlansListCache } from '@/lib/plans-cache';
import * as journey from '@/lib/journey-api';

describe('fetchPlansList', () => {
  afterEach(() => {
    invalidatePlansListCache();
    vi.restoreAllMocks();
  });

  it('reuses cache within TTL for same user', async () => {
    const spy = vi.spyOn(journey, 'journeyPlans').mockResolvedValue([
      { id: 'p1', title: 'T', outcome: 'O', priorityNote: null, linkKind: null, valueRef: null, purposeRevisionId: null, status: 'ACTIVE', actions: [] },
    ]);
    const rows1 = await fetchPlansList('token-abc', { userId: 'u1' });
    const rows2 = await fetchPlansList('token-abc', { userId: 'u1' });
    expect(rows1).toEqual(rows2);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('misses cache when user changes', async () => {
    const spy = vi.spyOn(journey, 'journeyPlans').mockResolvedValue([
      { id: 'p1', title: 'T', outcome: 'O', priorityNote: null, linkKind: null, valueRef: null, purposeRevisionId: null, status: 'ACTIVE', actions: [] },
    ]);
    await fetchPlansList('token-abc', { userId: 'u1' });
    await fetchPlansList('token-abc', { userId: 'u2' });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('force bypasses cache', async () => {
    const spy = vi.spyOn(journey, 'journeyPlans').mockResolvedValue([
      { id: 'p1', title: 'T', outcome: 'O', priorityNote: null, linkKind: null, valueRef: null, purposeRevisionId: null, status: 'ACTIVE', actions: [] },
    ]);
    await fetchPlansList('token-abc', { userId: 'u1' });
    await fetchPlansList('token-abc', { userId: 'u1', force: true });
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
