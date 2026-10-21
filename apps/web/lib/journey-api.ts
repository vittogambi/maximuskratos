import { apiBaseUrl } from '@/lib/api';

export type MemberDashboard = {
  territories: { territory: string; label: string; state: string; required: number; settled: number }[];
  focusPlan: { id: string; title: string; stage: string; week: { done: number; upcoming: number; percent: number | null } | null } | null;
  chooseStart: boolean;
  otherActivePlans: number;
};

async function journeyGet<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${apiBaseUrl()}/api/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export function fetchDashboard(accessToken: string) {
  return journeyGet<MemberDashboard>(accessToken, '/journey/dashboard');
}

export function fetchMemory(accessToken: string) {
  return journeyGet<{ plans: unknown[]; signedContract: unknown; draftPurpose: unknown }>(accessToken, '/journey/memory');
}
