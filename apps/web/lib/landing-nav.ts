export const PENDING_LANDING_HASH_KEY = 'mk:pending-landing-hash';

const LEGACY_HASH_MAP: Record<string, string> = {
  '#sistema': '#funcionamiento',
  '#marco': '#marco-central',
  '#faq': '#preguntas-frecuentes',
};

export function hashFromHref(href: string): string | null {
  const i = href.indexOf('#');
  return i === -1 ? null : href.slice(i);
}

export function normalizeLandingHash(hash: string): string {
  return LEGACY_HASH_MAP[hash] ?? hash;
}

export function writeLandingHash(hash: string) {
  window.history.replaceState(null, '', hash ? `/${hash}` : '/');
}

export function scrollToLandingSection(
  hash: string,
  attempt = 0,
  onComplete?: (found: boolean) => void,
  instant = false,
): void {
  const id = hash.replace('#', '');
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({
      behavior: instant || attempt === 0 ? 'auto' : 'smooth',
      block: 'start',
    });
    onComplete?.(true);
    return;
  }

  if (attempt < 100) {
    requestAnimationFrame(() => scrollToLandingSection(hash, attempt + 1, onComplete, instant));
    return;
  }

  if (attempt < 160) {
    window.setTimeout(() => scrollToLandingSection(hash, attempt + 1, onComplete, instant), 50);
    return;
  }

  onComplete?.(false);
}

export function queueLandingSectionNavigation(hash: string) {
  const normalized = normalizeLandingHash(hash);
  sessionStorage.setItem(PENDING_LANDING_HASH_KEY, normalized);
  return normalized;
}

export function peekPendingLandingHash(): string | null {
  const pending = sessionStorage.getItem(PENDING_LANDING_HASH_KEY);
  return pending ? normalizeLandingHash(pending) : null;
}

export function clearPendingLandingHash() {
  sessionStorage.removeItem(PENDING_LANDING_HASH_KEY);
}

export function resolveLandingHashFromLocation(): string | null {
  const pending = peekPendingLandingHash();
  if (pending) return pending;
  if (typeof window === 'undefined' || !window.location.hash) return null;
  return normalizeLandingHash(window.location.hash);
}

/** Cross-page: full navigation so the browser keeps the hash reliably. */
export function navigateToLandingSection(hash: string) {
  const normalized = queueLandingSectionNavigation(hash);
  window.location.assign(`/${normalized}`);
}

export function applyLandingHashFromLocation(onComplete?: (found: boolean) => void) {
  const hash = resolveLandingHashFromLocation();
  if (!hash) {
    onComplete?.(false);
    return null;
  }

  writeLandingHash(hash);
  scrollToLandingSection(hash, 0, (found) => {
    if (found) clearPendingLandingHash();
    onComplete?.(found);
  }, true);

  return hash;
}
