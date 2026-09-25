'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResultView } from '@/components/ikigai/result-view';
import { IkigaiShell, trackStops } from '@/components/ikigai/shell';
import {
  IkigaiApiError,
  ikigaiApi,
  type ExperimentContext,
  type IkigaiDefinition,
  type IkigaiNextExperiment,
  type IkigaiResult,
} from '@/lib/ikigai-api';
import { readStoredSession } from '@/lib/ikigai-ui/storage';

export function ResultPage({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [result, setResult] = useState<IkigaiResult | null>(null);
  const [experiment, setExperiment] = useState<ExperimentContext>({ state: 'NONE' });
  const [draftVersion, setDraftVersion] = useState(0);
  const [definitionSha, setDefinitionSha] = useState('');
  const [revision, setRevision] = useState(1);
  const [definition, setDefinition] = useState<IkigaiDefinition | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStoredSession();
    if (!stored || stored.sessionId !== sessionId) {
      router.replace('/ikigai/empezar');
      return;
    }
    setToken(stored.token);
  }, [router, sessionId]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [sessionRes, resultRes] = await Promise.all([
        ikigaiApi.getSession(sessionId, token),
        ikigaiApi.result(sessionId, token),
      ]);
      setDefinition(sessionRes.definition);
      setResult(resultRes.result);
      setExperiment(resultRes.experiment);
      setDraftVersion(sessionRes.session.draftVersion);
      setDefinitionSha(resultRes.definitionSha256);
      setRevision(resultRes.revision);
    } catch {
      router.replace(`/ikigai/s/${sessionId}`);
    }
  }, [router, sessionId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onReopen() {
    if (!token) return;
    try {
      await ikigaiApi.reopen(sessionId, token, { draftVersion, definitionSha256: definitionSha });
      router.push(`/ikigai/s/${sessionId}`);
    } catch (err) {
      setError(err instanceof IkigaiApiError ? err.message : 'No pudimos reabrir el mapa.');
    }
  }

  async function onSaveExperiment(body: Omit<IkigaiNextExperiment, 'savedAt'>) {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await ikigaiApi.nextExperiment(sessionId, token, {
        ...body,
        draftVersion,
        definitionSha256: definitionSha,
      });
      setDraftVersion(res.draftVersion);
      setExperiment({ state: 'CURRENT', experiment: res.nextExperiment });
    } catch (err) {
      setError(err instanceof IkigaiApiError ? err.message : 'No pudimos guardar el experimento.');
      throw err;
    } finally {
      setBusy(false);
    }
  }

  if (!result || !definition) {
    return (
      <IkigaiShell moment="Mapa" stops={trackStops(6)} onExit={() => router.push('/ikigai/empezar')}>
        <p className="ik-hint">Cargando tu mapa…</p>
      </IkigaiShell>
    );
  }

  return (
    <IkigaiShell moment="Mapa" stops={trackStops(6)} onExit={() => router.push('/ikigai/empezar')}>
      <ResultView
        result={result}
        revision={revision}
        definition={definition}
        experiment={experiment}
        onReopen={() => void onReopen()}
        onSaveExperiment={onSaveExperiment}
        busy={busy}
        error={error}
      />
    </IkigaiShell>
  );
}
