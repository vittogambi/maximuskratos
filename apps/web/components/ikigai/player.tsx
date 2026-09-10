'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { IkigaiContrastStep } from '@/components/ikigai/contrast-step';
import { IkigaiFieldStep } from '@/components/ikigai/field-step';
import { IkigaiRelateStep } from '@/components/ikigai/relate-step';
import { IkigaiShell } from '@/components/ikigai/shell';
import {
  IkigaiApiError,
  ikigaiApi,
  type FieldClarity,
  type IkigaiDefinition,
  type IkigaiDraft,
  type IkigaiFieldKey,
  type IkigaiItem,
} from '@/lib/ikigai-api';
import { trackIkigai } from '@/lib/ikigai-ui/analytics';
import { useIkigaiAutosave } from '@/lib/ikigai-ui/autosave';
import {
  compactDraft,
  contrastReady,
  contrastScreens,
  emptyUiDraft,
  FIELD_STEPS,
  filledCount,
  HYPOTHESIS_MAX,
} from '@/lib/ikigai-ui/format';
import { readStoredSession } from '@/lib/ikigai-ui/storage';

const STEPS = [
  'PASION',
  'CAPACIDAD',
  'NECESIDAD',
  'VALOR',
  'REVISION',
  'HIPOTESIS',
  'CONTRASTE',
] as const;

type Step = (typeof STEPS)[number];

function isStep(value: string): value is Step {
  return (STEPS as readonly string[]).includes(value);
}

function pruneDraft(draft: IkigaiDraft): IkigaiDraft {
  const compact = compactDraft(draft);
  if (compact.noHypothesisYet) {
    return { ...compact, hypotheses: [], selectedHypothesisId: null };
  }
  return {
    ...compact,
    hypotheses: compact.hypotheses.filter(
      (h) => h.text.trim().length >= 12 && h.text.length <= HYPOTHESIS_MAX && h.itemIds.length >= 1,
    ),
  };
}

function momentFor(step: Step, contrastIndex: number) {
  if ((FIELD_STEPS as readonly string[]).includes(step)) {
    return {
      label: 'IKIGAI · EXPLORAR',
      value: FIELD_STEPS.indexOf(step as (typeof FIELD_STEPS)[number]) + 1,
      max: 4,
    };
  }
  if (step === 'HIPOTESIS' || step === 'REVISION') {
    return { label: 'IKIGAI · CONECTAR', value: 1, max: 1 };
  }
  return { label: 'IKIGAI · CONTRASTAR', value: contrastIndex + 1, max: 6 };
}

export function IkigaiPlayer({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [definition, setDefinition] = useState<IkigaiDefinition | null>(null);
  const [draft, setDraft] = useState<IkigaiDraft | null>(null);
  const [draftVersion, setDraftVersion] = useState(0);
  const [step, setStep] = useState<Step>('PASION');
  const [loadKey, setLoadKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [contrastIndex, setContrastIndex] = useState(0);
  const [fieldEditing, setFieldEditing] = useState(false);

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
      const res = await ikigaiApi.getSession(sessionId, token);
      if (res.session.status === 'COMPLETED' || res.session.status === 'FOLLOW_UP') {
        router.replace(`/ikigai/s/${sessionId}/resultado`);
        return;
      }
      const next = compactDraft(res.draft);
      setDefinition(res.definition);
      setDraft(next);
      setDraftVersion(res.session.draftVersion);
      const incoming = isStep(res.session.currentStep) ? res.session.currentStep : 'PASION';
      setStep(incoming === 'REVISION' ? 'HIPOTESIS' : incoming);
      setLoadKey(`${res.session.draftVersion}:${Date.now()}`);
      setError(null);
    } catch {
      router.replace('/ikigai/empezar');
    }
  }, [router, sessionId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const autosave = useIkigaiAutosave({
    sessionId,
    token: token ?? '',
    step,
    draft: draft ?? emptyUiDraft(),
    draftVersion,
    loadKey,
    enabled: Boolean(token && definition && draft),
    onVersion: setDraftVersion,
    onReload: async () => {
      setConflict(true);
      await load();
    },
  });

  const screens = draft ? contrastScreens(draft) : [];
  const moment = momentFor(step, contrastIndex);

  function go(next: Step) {
    setFieldEditing(false);
    setStep(next);
    if (next === 'CONTRASTE') {
      setContrastIndex(0);
      trackIkigai('contrast_started');
    }
  }

  function updateDraft(patch: Partial<IkigaiDraft>) {
    setDraft((prev) => (prev ? compactDraft({ ...prev, ...patch }) : prev));
  }

  function setItems(key: IkigaiFieldKey, items: IkigaiItem[]) {
    setDraft((prev) =>
      prev
        ? compactDraft({
            ...prev,
            items: { ...prev.items, [key]: items.map((item, order) => ({ ...item, order, evidence: null })) },
            fieldClarity: {
              ...prev.fieldClarity,
              [key]: items.filter((item) => item.text.trim().length >= 3).length > 0 ? 'ANSWERED' : prev.fieldClarity[key],
            },
          })
        : prev,
    );
  }

  function setClarity(key: IkigaiFieldKey, clarity: FieldClarity) {
    setDraft((prev) =>
      prev ? compactDraft({ ...prev, fieldClarity: { ...prev.fieldClarity, [key]: clarity } }) : prev,
    );
  }

  const canNext = useMemo(() => {
    if (!draft) return false;
    if ((FIELD_STEPS as readonly string[]).includes(step)) {
      const key = step as IkigaiFieldKey;
      return filledCount(draft.items[key]) > 0 || draft.fieldClarity[key] === 'UNCLEAR';
    }
    if (step === 'CONTRASTE') {
      const screen = screens[contrastIndex];
      if (!screen) return false;
      const hyp = draft.hypotheses.find((h) => h.id === screen.hypId);
      return Boolean(hyp && Object.prototype.hasOwnProperty.call(hyp.criteria, screen.criterionKey));
    }
    return false;
  }, [draft, step, screens, contrastIndex]);

  async function completeWith(nextDraft: IkigaiDraft) {
    if (!token) return;
    setDraft(nextDraft);
    setCompleting(true);
    setError(null);
    try {
      const ok = await autosave.flush({ draft: nextDraft, step });
      if (!ok) {
        setCompleting(false);
        setError('No pudimos guardar. Reintenta.');
        return;
      }
      if (nextDraft.hypotheses.length > 0) trackIkigai('contrast_completed');
      await ikigaiApi.complete(sessionId, token);
      router.push(`/ikigai/s/${sessionId}/resultado`);
    } catch (err) {
      setCompleting(false);
      if (err instanceof IkigaiApiError) {
        setError(err.message);
        if (err.step && isStep(err.step)) setStep(err.step);
      } else {
        setError('No pudimos cerrar el mapa. Reintenta.');
      }
    }
  }

  async function onNext() {
    if (!draft) return;
    if (step === 'PASION') go('CAPACIDAD');
    else if (step === 'CAPACIDAD') go('NECESIDAD');
    else if (step === 'NECESIDAD') go('VALOR');
    else if (step === 'VALOR') go('HIPOTESIS');
    else if (step === 'CONTRASTE') {
      if (contrastIndex < screens.length - 1) {
        setContrastIndex((i) => i + 1);
        return;
      }
      if (!contrastReady(draft)) return;
      await completeWith(pruneDraft(draft));
    }
  }

  function onBack() {
    if (step === 'CONTRASTE' && contrastIndex > 0) {
      setContrastIndex((i) => i - 1);
      return;
    }
    if (step === 'HIPOTESIS' || step === 'REVISION') {
      go('VALOR');
      return;
    }
    if (step === 'CONTRASTE') {
      go('HIPOTESIS');
      return;
    }
    const i = STEPS.indexOf(step);
    if (i > 0) go(STEPS[i - 1]);
  }

  async function onExit() {
    await autosave.flush();
    router.push('/ikigai/empezar');
  }

  if (!definition || !draft || !token) {
    return (
      <IkigaiShell onExit={() => router.push('/ikigai/empezar')}>
        <p className="ik-hint">Cargando…</p>
      </IkigaiShell>
    );
  }

  const banner = conflict
    ? 'Este mapa cambió en otra pestaña. Recargamos la versión más reciente.'
    : autosave.state === 'error'
      ? 'No pudimos guardar. Reintentando…'
      : null;

  let body: ReactNode = null;
  if ((FIELD_STEPS as readonly string[]).includes(step)) {
    body = (
      <IkigaiFieldStep
        key={step}
        definition={definition}
        fieldKey={step as IkigaiFieldKey}
        items={draft.items[step as IkigaiFieldKey]}
        clarity={draft.fieldClarity[step as IkigaiFieldKey]}
        onChange={(items) => setItems(step as IkigaiFieldKey, items)}
        onClarity={(clarity) => setClarity(step as IkigaiFieldKey, clarity)}
        onEditingChange={setFieldEditing}
      />
    );
  } else if (step === 'HIPOTESIS' || step === 'REVISION') {
    body = (
      <IkigaiRelateStep
        definition={definition}
        draft={draft}
        onChange={updateDraft}
        onContrast={(selectedHypothesisId) => {
          updateDraft({ selectedHypothesisId, noHypothesisYet: false });
          go('CONTRASTE');
        }}
        onNoHypothesis={() => {
          void completeWith(pruneDraft({ ...draft, noHypothesisYet: true, hypotheses: [] }));
        }}
      />
    );
  } else {
    body = (
      <IkigaiContrastStep
        definition={definition}
        draft={draft}
        index={contrastIndex}
        onChange={setDraft}
      />
    );
  }

  const hideShellCta = step === 'HIPOTESIS' || step === 'REVISION' || fieldEditing;
  const nextLabel =
    step === 'CONTRASTE' && contrastIndex >= screens.length - 1 ? 'Ver mi mapa' : 'Continuar';

  return (
    <IkigaiShell
      stepLabel={moment.label}
      progress={moment.value}
      progressMax={moment.max}
      banner={banner}
      onRetry={autosave.state === 'error' ? () => void autosave.retry() : undefined}
      onExit={() => void onExit()}
      actions={
        hideShellCta ? null : (
          <>
            {step !== 'PASION' || contrastIndex > 0 ? (
              <button type="button" className="ik-btn-quiet font-label-lg" onClick={onBack}>
                Atrás
              </button>
            ) : null}
            <button
              type="button"
              className="ag-btn-primary font-label-lg"
              disabled={!canNext || completing}
              onClick={() => void onNext()}
            >
              {nextLabel}
            </button>
          </>
        )
      }
    >
      <div className="ik-step" key={`${step}-${contrastIndex}`}>
        {error ? (
          <p className="ik-warn" role="alert">
            {error}
          </p>
        ) : null}
        {body}
      </div>
    </IkigaiShell>
  );
}
