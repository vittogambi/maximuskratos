type Router = { push: (href: string) => void; prefetch?: (href: string) => void };

const KEY = 'mk-portal';
const DOMAINS = new Set(['/mente', '/espiritu', '/cuerpo']);
const COVER = 'cubic-bezier(0.65, 0, 0.35, 1)';
const REVEAL = 'cubic-bezier(0.22, 1, 0.36, 1)';
const BG = '#0a0a0a';

type Origin = { href: string; x: number; y: number; r: number };

let busy = false;

function reduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function remember(origin: Origin) {
  sessionStorage.setItem(KEY, JSON.stringify(origin));
}

function readOrigin(): Origin | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Origin;
    if (!DOMAINS.has(value.href)) return null;
    return value;
  } catch {
    return null;
  }
}

function measure(metric: HTMLElement): Omit<Origin, 'href'> {
  const circle = metric.querySelector('.mk-metric__value') ?? metric;
  const rect = circle.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    r: Math.max(rect.width, rect.height) / 2,
  };
}

function coverScale(origin: Pick<Origin, 'x' | 'y' | 'r'>) {
  const far = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  );
  return (far / Math.max(origin.r, 24)) * 1.06;
}

function clearIris() {
  document.getElementById('mk-portal-iris')?.remove();
}

function layer(origin: Pick<Origin, 'x' | 'y' | 'r'>, scale: number, hole: boolean) {
  clearIris();
  const el = document.createElement('div');
  el.id = 'mk-portal-iris';
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, {
    position: 'fixed',
    left: `${origin.x}px`,
    top: `${origin.y}px`,
    width: `${origin.r * 2}px`,
    height: `${origin.r * 2}px`,
    margin: '0',
    borderRadius: '50%',
    background: hole ? 'transparent' : BG,
    boxShadow: hole ? `0 0 0 120vmax ${BG}` : 'none',
    transform: `translate(-50%, -50%) scale(${scale})`,
    zIndex: '400',
    pointerEvents: 'none',
    willChange: 'transform, opacity',
  });
  document.body.appendChild(el);
  return el;
}

function waitFor(selector: string) {
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    if (document.querySelector(selector)) {
      finish();
      return;
    }
    const observer = new MutationObserver(() => {
      if (!document.querySelector(selector)) return;
      observer.disconnect();
      finish();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => {
      observer.disconnect();
      finish();
    }, 1200);
  });
}

async function scale(el: HTMLElement, from: number, to: number, duration: number, easing: string) {
  const anim = el.animate(
    [
      { transform: `translate(-50%, -50%) scale(${from})` },
      { transform: `translate(-50%, -50%) scale(${to})` },
    ],
    { duration, easing, fill: 'forwards' },
  );
  try {
    await anim.finished;
  } catch {
    /* cancelled */
  }
}

async function fade(el: HTMLElement) {
  const anim = el.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: 280, easing: REVEAL, fill: 'forwards' },
  );
  try {
    await anim.finished;
  } catch {
    /* cancelled */
  }
  el.remove();
}

async function openFrom(origin: Pick<Origin, 'x' | 'y' | 'r'>, selector: string, go: () => void) {
  const end = coverScale(origin);
  const el = layer(origin, 1, false);
  const covered = scale(el, 1, end, 620, COVER);
  await covered;
  go();
  await waitFor(selector);
  await fade(el);
}

async function closeInto(origin: Pick<Origin, 'x' | 'y' | 'r'>, selector: string, go: () => void) {
  const end = coverScale(origin);
  const el = layer(origin, end, true);
  await scale(el, end, 1, 560, COVER);
  go();
  await waitFor(selector);
  clearIris();
  const veil = layer(origin, end, false);
  await fade(veil);
}

export function enterPortal(href: string, metric: HTMLElement, router: Router) {
  if (busy || !DOMAINS.has(href)) return;
  const origin = { ...measure(metric), href };
  remember(origin);
  router.prefetch?.(href);
  if (reduced()) {
    router.push(href);
    return;
  }
  busy = true;
  void openFrom(origin, '.mk-ambit-page', () => router.push(href)).finally(() => {
    busy = false;
    clearIris();
  });
}

export function exitPortal(router: Router) {
  if (busy) return;
  const origin = readOrigin();
  if (!origin || origin.href !== window.location.pathname) return;
  sessionStorage.removeItem(KEY);
  if (reduced()) {
    router.push('/panel');
    return;
  }
  busy = true;
  void closeInto(origin, '.mk-home', () => router.push('/panel')).finally(() => {
    busy = false;
    clearIris();
  });
}

export function shouldExitPortal(pathname: string) {
  const origin = readOrigin();
  return Boolean(origin && origin.href === pathname);
}

export function isDomainPath(pathname: string) {
  return DOMAINS.has(pathname);
}
