'use client';

import { useEffect, useRef, useState } from 'react';
import { IkigaiApiError, ikigaiApi, type IkigaiDraft } from '@/lib/ikigai-api';

export type SaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'error' | 'conflict';

export function saveLabel(state: SaveState): string {
  if (state === 'saving') return 'Guardando…';
  if (state === 'saved') return 'Guardado';
  if (state === 'offline') return 'Sin conexión: se guardará al reconectar';
  return '';
}

function snapshot(draft: IkigaiDraft, step: string) {
  return JSON.stringify({ draft, step });
}

export function useIkigaiAutosave(opts: {
  sessionId: string;
  token: string;
  step: string;
  draft: IkigaiDraft;
  draftVersion: number;
  loadKey: string;
  enabled: boolean;
  onVersion: (version: number) => void;
  onReload: () => Promise<void>;
}) {
  const { sessionId, token, step, draft, draftVersion, loadKey, enabled, onVersion, onReload } = opts;
  const [state, setState] = useState<SaveState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mutex = useRef(Promise.resolve());
  const baseline = useRef<string>('');
  const latest = useRef({ draft, step, draftVersion });
  latest.current = { draft, step, draftVersion };

  useEffect(() => {
    baseline.current = snapshot(draft, step);
    setState('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when server load changes
  }, [loadKey]);

  async function flush(override?: { draft?: IkigaiDraft; step?: string }): Promise<boolean> {
    if (!enabled || !token) return false;
    let release: () => void = () => undefined;
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    const prev = mutex.current;
    mutex.current = prev.then(() => wait);
    await prev;
    try {
      const current = {
        ...latest.current,
        ...(override?.draft ? { draft: override.draft } : {}),
        ...(override?.step ? { step: override.step } : {}),
      };
      if (override?.draft) latest.current.draft = override.draft;
      if (override?.step) latest.current.step = override.step;
      const key = snapshot(current.draft, current.step);
      if (key === baseline.current) return true;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setState('offline');
        return false;
      }
      setState('saving');
      const res = await ikigaiApi.patchDraft(sessionId, token, {
        draftVersion: current.draftVersion,
        step: current.step,
        patch: current.draft,
      });
      onVersion(res.draftVersion);
      latest.current.draftVersion = res.draftVersion;
      baseline.current = snapshot(current.draft, current.step);
      setState('saved');
      return true;
    } catch (err) {
      if (err instanceof IkigaiApiError && err.status === 409) {
        setState('conflict');
        await onReload();
        return true;
      }
      setState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
      return false;
    } finally {
      release();
    }
  }

  useEffect(() => {
    if (!enabled) return;
    if (timer.current) clearTimeout(timer.current);
    const key = snapshot(draft, step);
    if (key === baseline.current) return;
    timer.current = setTimeout(() => {
      void flush();
    }, 800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, step, enabled]);

  useEffect(() => {
    function onOnline() {
      void flush();
    }
    function onOffline() {
      setState('offline');
    }
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return { state, flush, retry: flush };
}
