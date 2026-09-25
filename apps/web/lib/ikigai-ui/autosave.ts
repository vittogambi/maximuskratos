'use client';

import { useEffect, useRef, useState } from 'react';
import { IkigaiApiError, ikigaiApi, type IkigaiDraft } from '@/lib/ikigai-api';
import { reconcileDraft } from '@/lib/ikigai-ui/reconcile';

export type SaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'error' | 'conflict';

export type FlushResult =
  | { kind: 'saved'; draftVersion: number; definitionSha256: string }
  | { kind: 'conflict'; serverVersion: number }
  | { kind: 'definition_changed' }
  | { kind: 'invalid'; message: string }
  | { kind: 'error'; retryable: boolean };

export function saveLabel(state: SaveState): string {
  if (state === 'saving') return 'Guardando…';
  if (state === 'saved') return 'Guardado';
  if (state === 'offline') return 'Sin conexión: se guardará al reconectar';
  return '';
}

export function patchBody(draft: IkigaiDraft): IkigaiDraft {
  const next = { ...draft, nextExperiment: null };
  return next;
}

type SendResult = { draftVersion: number; draft: IkigaiDraft; definitionSha256: string };

export class DraftSaver {
  local: IkigaiDraft;
  step: string;
  private baseVersion: number;
  private baseSha: string;
  private baseDraft: IkigaiDraft;
  private baseStep: string;
  private dirty = false;
  private conflicted = false;
  private blocked: FlushResult | null = null;
  private tail: Promise<FlushResult>;

  constructor(
    draft: IkigaiDraft,
    step: string,
    version: number,
    sha: string,
    private send: (input: {
      draftVersion: number;
      definitionSha256: string;
      step: string;
      patch: IkigaiDraft;
    }) => Promise<SendResult>,
  ) {
    this.local = draft;
    this.baseDraft = draft;
    this.step = step;
    this.baseStep = step;
    this.baseVersion = version;
    this.baseSha = sha;
    this.tail = Promise.resolve({
      kind: 'saved',
      draftVersion: version,
      definitionSha256: sha,
    });
  }

  note(draft: IkigaiDraft, step: string) {
    this.local = draft;
    this.step = step;
    this.blocked = null;
    this.dirty = JSON.stringify(draft) !== JSON.stringify(this.baseDraft) || step !== this.baseStep;
  }

  adopt(draft: IkigaiDraft, version: number, sha: string, step: string) {
    this.baseDraft = draft;
    this.local = draft;
    this.baseVersion = version;
    this.baseSha = sha;
    this.step = step;
    this.baseStep = step;
    this.dirty = false;
    this.conflicted = false;
    this.blocked = null;
  }

  flush(): Promise<FlushResult> {
    const run = this.tail.then(() => this.pump());
    this.tail = run.then(
      (result) => result,
      () => ({ kind: 'error', retryable: true }) as FlushResult,
    );
    return run;
  }

  private async pump(): Promise<FlushResult> {
    if (this.conflicted) return { kind: 'conflict', serverVersion: this.baseVersion };
    if (this.blocked && !this.dirty) return this.blocked;
    let result: FlushResult = {
      kind: 'saved',
      draftVersion: this.baseVersion,
      definitionSha256: this.baseSha,
    };
    while (this.dirty) {
      const sent = this.local;
      const step = this.step;
      this.dirty = false;
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          this.dirty = true;
          return { kind: 'error', retryable: true };
        }
        const res = await this.send({
          draftVersion: this.baseVersion,
          definitionSha256: this.baseSha,
          step,
          patch: patchBody(sent),
        });
        this.baseVersion = res.draftVersion;
        this.baseSha = res.definitionSha256;
        this.baseDraft = res.draft;
        this.baseStep = step;
        if (this.local !== sent) {
          this.local = reconcileDraft(res.draft, this.local).draft;
          this.dirty = true;
        } else {
          this.local = res.draft;
        }
        result = { kind: 'saved', draftVersion: res.draftVersion, definitionSha256: res.definitionSha256 };
      } catch (err) {
        if (err instanceof IkigaiApiError && err.status === 422) {
          this.dirty = false;
          this.blocked = { kind: 'invalid', message: err.message || 'No se pudo guardar este borrador.' };
          return this.blocked;
        }
        this.dirty = true;
        if (err instanceof IkigaiApiError && err.status === 409 && err.reason === 'DEFINITION_CHANGED') {
          return { kind: 'definition_changed' };
        }
        if (err instanceof IkigaiApiError && err.status === 409) {
          this.conflicted = true;
          return { kind: 'conflict', serverVersion: err.draftVersion ?? this.baseVersion };
        }
        return { kind: 'error', retryable: true };
      }
    }
    return result;
  }
}

export function useIkigaiAutosave(opts: {
  sessionId: string;
  token: string;
  step: string;
  draft: IkigaiDraft;
  draftVersion: number;
  definitionSha256: string;
  loadKey: string;
  enabled: boolean;
  onVersion: (version: number) => void;
  onCanonical: (draft: IkigaiDraft) => void;
}) {
  const { sessionId, token, step, draft, draftVersion, definitionSha256, loadKey, enabled, onVersion, onCanonical } = opts;
  const [state, setState] = useState<SaveState>('idle');
  const [conflict, setConflict] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saver = useRef<DraftSaver | null>(null);
  const canonical = useRef<IkigaiDraft | null>(null);

  if (!saver.current && enabled && definitionSha256) {
    saver.current = new DraftSaver(draft, step, draftVersion, definitionSha256, (input) =>
      ikigaiApi.patchDraft(sessionId, token, input),
    );
  }

  useEffect(() => {
    if (!enabled || !definitionSha256) return;
    saver.current = new DraftSaver(draft, step, draftVersion, definitionSha256, (input) =>
      ikigaiApi.patchDraft(sessionId, token, input),
    );
    canonical.current = draft;
    setState('idle');
    setConflict(false);
    setDetail(null);
    // Reset only when the server load changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey, enabled]);

  useEffect(() => {
    if (!enabled || !saver.current) return;
    if (draft === canonical.current) return;
    saver.current.note(draft, step);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void flush();
    }, 500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, step, enabled]);

  async function flush(override?: IkigaiDraft): Promise<FlushResult> {
    const current = saver.current;
    if (!enabled || !current) return { kind: 'error', retryable: false };
    if (timer.current) clearTimeout(timer.current);
    if (override) current.note(override, step);
    setState('saving');
    const result = await current.flush();
    if (result.kind === 'saved') {
      onVersion(result.draftVersion);
      canonical.current = current.local;
      onCanonical(current.local);
      setState('saved');
      setConflict(false);
      setDetail(null);
      return result;
    }
    if (result.kind === 'conflict') {
      setConflict(true);
      setState('conflict');
      setDetail('Esta sesión cambió en otra pestaña. Tus cambios siguen aquí y aún no se han guardado.');
      return result;
    }
    if (result.kind === 'invalid') {
      setState('error');
      setDetail(result.message);
      return result;
    }
    if (result.kind === 'definition_changed') {
      setState('error');
      setDetail('La definición de esta prueba cambió. No se escribió nada.');
      return result;
    }
    setState(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error');
    return result;
  }

  function replaceWithServer(next: IkigaiDraft, version: number, sha: string) {
    saver.current?.adopt(next, version, sha, step);
    setConflict(false);
    setState('idle');
    setDetail(null);
    canonical.current = next;
  }

  return {
    state,
    conflict,
    detail,
    flush,
    retry: () => flush(),
    replaceWithServer,
    localDraft: () => saver.current?.local ?? draft,
  };
}
