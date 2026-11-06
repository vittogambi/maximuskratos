import { journeyPlans, type PlanRow } from '@/lib/journey-api';

type Entry = { at: number; userKey: string; rows: PlanRow[] };

let cache: Entry | null = null;
const TTL_MS = 20_000;

function userKey(token: string): string {
  return token.slice(-24);
}

export async function fetchPlansList(
  token: string,
  options?: { force?: boolean; userId?: string | null },
): Promise<PlanRow[]> {
  const key = options?.userId ?? userKey(token);
  if (!options?.force && cache && cache.userKey === key && Date.now() - cache.at < TTL_MS) {
    return cache.rows;
  }
  const rows = await journeyPlans(token);
  cache = { at: Date.now(), userKey: key, rows };
  return rows;
}

export function invalidatePlansListCache() {
  cache = null;
}
