export type DirectionExploreHandoff = {
  statement: string;
  desiredChange?: string | null;
  trialWhat?: string;
  trialDiscover?: string;
  trialObserve?: string;
};

const KEY = 'mk-direction-explore-handoff';

export function writeDirectionExploreHandoff(payload: DirectionExploreHandoff): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(KEY, JSON.stringify(payload));
}

export function readDirectionExploreHandoff(): DirectionExploreHandoff | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) || 'null') as DirectionExploreHandoff | null;
  } catch {
    return null;
  }
}

export function clearDirectionExploreHandoff(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(KEY);
}
