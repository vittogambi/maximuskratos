const KEY = 'mk-lab-flash';

type Listener = (message: string | null) => void;

let current: string | null = null;
const listeners = new Set<Listener>();

function readStored(): string | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function writeStored(message: string | null) {
  try {
    if (typeof sessionStorage === 'undefined') return;
    if (message) sessionStorage.setItem(KEY, message);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}

function emit(message: string | null) {
  current = message;
  writeStored(message);
  for (const listen of listeners) listen(message);
}

export function setLabFlash(message: string) {
  emit(message);
}

export function clearLabFlash() {
  emit(null);
}

export function subscribeLabFlash(listen: Listener) {
  const initial = current ?? readStored();
  if (initial && current == null) current = initial;
  listen(current);
  listeners.add(listen);
  return () => {
    listeners.delete(listen);
  };
}

export function consumeLabFlash(): string | null {
  const message = current ?? readStored();
  emit(null);
  return message;
}
