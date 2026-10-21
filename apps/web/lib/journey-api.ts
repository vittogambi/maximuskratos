import { apiFetch } from '@/lib/api';

export type MemberDashboard = {
  territories: { territory: string; label: string; state: string; required: number; settled: number }[];
  focusPlan: { id: string; title: string; stage: string; week: { done: number; upcoming: number; percent: number | null } | null } | null;
  chooseStart: boolean;
  otherActivePlans: number;
};

export function fetchDashboard(token: string) {
  return apiFetch<MemberDashboard>('/journey/dashboard', { token });
}

export function fetchMemory(token: string) {
  return apiFetch<{ plans: unknown[]; signedContract: unknown; draftPurpose: unknown }>('/journey/memory', { token });
}
