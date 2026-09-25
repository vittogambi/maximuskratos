'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { IkigaiContrastStep } from '@/components/ikigai/contrast-step';
import { IkigaiFieldStep } from '@/components/ikigai/field-step';
import { IkigaiRelateStep } from '@/components/ikigai/relate-step';
import { IkigaiShell, trackStops } from '@/components/ikigai/shell';
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
import { FIELD_CTA_HINT } from '@/lib/ikigai-ui/copy';
import {
  contrastReady,
  contrastScreens,
  emptyUiDraft,
  FIELD_STEPS,
  fieldTitle,
  filledCount,
} from '@/lib/ikigai-ui/format';
import { reconcileDraft } from '@/lib/ikigai-ui/reconcile';
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

function applyDraft(previous: IkigaiDraft, candidate: IkigaiDraft): IkigaiDraft {
  return reconcileDraft(previous, candidate).draft;
}

function saveFailure(saved: { kind: string; message?: string }): string {
  if (saved.kind === 'conflict') {
    return 'Esta sesión cambió en otra pestaña. Tus cambios siguen aquí y aún no se han guardado.';
  }
  if (saved.kind === 'invalid' && saved.message) return saved.message;
  if (saved.kind === 'definition_changed') return 'La definición de esta prueba cambió. No se escribió nada.';
  return 'No pudimos guardar. Reintenta.';
}

function momentFor(step: Step) {
  if ((FIELD_STEPS as readonly string[]).includes(step)) {
    const index = FIELD_STEPS.indexOf(step as (typeof FIELD_STEPS)[number]);
    return { label: 'Explorar', position: index };
  }
  if (step === 'HIPOTESIS' || step === 'REVISION') {
    return { label: 'Conectar', position: 4 };
  }
  return { label: 'Contrastar', position: 5 };
}

export function IkigaiPlayer({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [definition, setDefinition] = useState<IkigaiDefinition | null>(null);
  const [draft, setDraft] = useState<IkigaiDraft | null>(null);
  const [draftVersion, setDraftVersion] = useState(0);
  const [definitionSha, setDefinitionSha] = useState('');
  const [step, setStep] = useState<Step>('PASION');
  const [loadKey, setLoadKey] = useState('');
  const [notice, setNotice] = useState<{ message: string; step?: Step } | null>(null);
  const [completing, setCompleting] = useState(false);
  const [contrastIndex, setContrastIndex] = useState(0);
  const [fieldEditing, setFieldEditing] = useState(false);
  const [connectShape, setConnectShape] = useState(false);

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
      setDefinition(res.definition);
      setDraft(res.draft);
      setDraftVersion(res.session.draftVersion);
      setDefinitionSha(res.definitionSha256);
      const incoming = isStep(res.session.currentStep) ? res.session.currentStep : 'PASION';
      setStep(incoming === 'REVISION' ? 'HIPOTESIS' : incoming);
      setLoadKey(`${res.session.draftVersion}:${Date.now()}`);
      setNotice(null);
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
    definitionSha256: definitionSha,
    loadKey,
    enabled: Boolean(token && definition && draft && definitionSha),
    onVersion: setDraftVersion,
    onCanonical: (next) => setDraft(next),
  });

  const screens = draft ? contrastScreens(draft) : [];
  const moment = momentFor(step);

  useEffect(() => {
    document.querySelector('.ik-main')?.scrollTo(0, 0);
  }, [step, contrastIndex]);

  function go(next: Step) {
    setFieldEditing(false);
    setConnectShape(false);
    setNotice(null);
    setStep(next);
    if (next === 'CONTRASTE') {
      setContrastIndex(0);
      trackIkigai('contrast_started');
    }
  }

  function updateDraft(patch: Partial<IkigaiDraft>) {
    setDraft((prev) => {
      if (!prev) return prev;
      const candidate: IkigaiDraft = {
        ...prev,
        ...patch,
        items: patch.items ? { ...prev.items, ...patch.items } : prev.items,
        fieldClarity: patch.fieldClarity ? { ...prev.fieldClarity, ...patch.fieldClarity } : prev.fieldClarity,
      };
      return applyDraft(prev, candidate);
    });
  }

  function setItems(key: IkigaiFieldKey, items: IkigaiItem[]) {
    setDraft((prev) => {
      if (!prev) return prev;
      const candidate: IkigaiDraft = {
        ...prev,
        items: { ...prev.items, [key]: items.map((item, order) => ({ ...item, order })) },
        fieldClarity: {
          ...prev.fieldClarity,
          [key]: items.filter((item) => item.text.trim().length >= 3).length > 0 ? 'ANSWERED' : prev.fieldClarity[key],
        },
      };
      return applyDraft(prev, candidate);
    });
  }

  function setClarity(key: IkigaiFieldKey, clarity: FieldClarity) {
    setDraft((prev) =>
      prev ? applyDraft(prev, { ...prev, fieldClarity: { ...prev.fieldClarity, [key]: clarity } }) : prev,
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
    setNotice(null);
    try {
      const saved = await autosave.flush(nextDraft);
      if (saved.kind !== 'saved') {
        setCompleting(false);
        setNotice({ message: saveFailure(saved) });
        return;
      }
      if (nextDraft.hypotheses.length > 0) trackIkigai('contrast_completed');
      await ikigaiApi.complete(sessionId, token, {
        draftVersion: saved.draftVersion,
        definitionSha256: saved.definitionSha256,
      });
      router.push(`/ikigai/s/${sessionId}/resultado`);
    } catch (err) {
      setCompleting(false);
      if (err instanceof IkigaiApiError) {
        setNotice({
          message: err.message,
          step: err.step && isStep(err.step) ? err.step : undefined,
        });
      } else {
        setNotice({ message: 'No pudimos cerrar el mapa. Reintenta.' });
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
      await completeWith(draft);
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
    const saved = await autosave.flush();
    if (saved.kind !== 'saved') {
      setNotice({ message: saveFailure(saved) });
      return;
    }
    router.push('/ikigai/empezar');
  }

  if (!definition || !draft || !token) {
    return (
      <IkigaiShell onExit={() => router.push('/ikigai/empezar')}>
        <p className="ik-hint">Cargando…</p>
      </IkigaiShell>
    );
  }

  const banner = autosave.conflict
    ? 'Esta sesión cambió en otra pestaña. Tus cambios siguen aquí y aún no se han guardado.'
    : notice?.message
      ? notice.message
      : autosave.detail
        ? autosave.detail
        : autosave.state === 'error'
          ? 'No pudimos guardar. Reintenta.'
          : null;
  const retry = notice?.step
    ? () => {
        setStep(notice.step as Step);
        setNotice(null);
      }
    : autosave.state === 'error' && !autosave.detail
      ? () => void autosave.retry()
      : undefined;

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
        linkedUses={(id) => draft.hypotheses.filter((hyp) => hyp.itemIds.includes(id)).length}
        itemsByField={draft.items}
        clarityByField={draft.fieldClarity}
        onContinue={() => void onNext()}
        continueLabel={
          step === 'VALOR'
            ? 'Ver mi mapa completo'
            : `Explorar ${fieldTitle(definition, step === 'PASION' ? 'CAPACIDAD' : step === 'CAPACIDAD' ? 'NECESIDAD' : 'VALOR').toLowerCase()}`
        }
      />
    );
  } else if (step === 'HIPOTESIS' || step === 'REVISION') {
    body = (
      <IkigaiRelateStep
        definition={definition}
        draft={draft}
        onChange={updateDraft}
        onExplore={(selectedHypothesisId) => {
          const next = applyDraft(draft, { ...draft, selectedHypothesisId, noHypothesisYet: false });
          setDraft(next);
          void autosave.flush(next).then((saved) => {
            if (saved.kind === 'saved') go('CONTRASTE');
            else setNotice({ message: saveFailure(saved) });
          });
        }}
        onStopExplore={() => updateDraft({ selectedHypothesisId: null })}
        onNoHypothesis={() => {
          if (draft.hypotheses.length > 0) return;
          void completeWith({ ...draft, noHypothesisYet: true, hypotheses: [], selectedHypothesisId: null });
        }}
        onEditField={(field) => go(field)}
        onShapeChange={setConnectShape}
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

  const hideShellCta = step === 'HIPOTESIS' || step === 'REVISION' || fieldEditing || (FIELD_STEPS as readonly string[]).includes(step);
  const nextLabel =
    step === 'CONTRASTE' && contrastIndex >= screens.length - 1 ? 'Guardar mi mapa' : 'Continuar';
  const ctaHint =
    canNext || completing
      ? null
      : step === 'CONTRASTE'
        ? 'Elige una respuesta o prefiere no responder.'
        : FIELD_CTA_HINT;

  return (
    <IkigaiShell
      moment={moment.label}
      stops={trackStops(moment.position)}
      ctaHint={hideShellCta ? null : ctaHint}
      banner={banner}
      onRetry={retry}
      retryLabel={notice?.step ? 'Ir allí' : 'Reintentar'}
      onExit={() => void onExit()}
      confirmExit
      backText={connectShape ? 'Ideas' : undefined}
      onBack={
        connectShape
          ? () => setConnectShape(false)
          : step !== 'PASION' || contrastIndex > 0
            ? onBack
            : undefined
      }
      actions={
        hideShellCta ? null : (
          <button
            type="button"
            className="ag-btn-primary font-label-lg"
            disabled={!canNext || completing}
            onClick={() => void onNext()}
          >
            {nextLabel}
          </button>
        )
      }
    >
      <div className="ik-step" key={`${step}-${contrastIndex}`}>
        {autosave.conflict ? (
          <div className="ik-inline-actions">
            <button
              type="button"
              className="ik-text"
              onClick={() => {
                const readable = {
                  ideas: draft.items,
                  posibilidades: draft.hypotheses.map((hyp) => ({ texto: hyp.text, ideas: hyp.itemIds })),
                };
                void navigator.clipboard?.writeText(JSON.stringify(readable, null, 2));
              }}
            >
              Copiar mis cambios
            </button>
            <button
              type="button"
              className="ik-text"
              onClick={() => {
                if (!window.confirm('Se sustituirá lo que ves por la versión guardada.')) return;
                void ikigaiApi.getSession(sessionId, token).then((res) => {
                  autosave.replaceWithServer(res.draft, res.session.draftVersion, res.definitionSha256);
                  setDraft(res.draft);
                  setDraftVersion(res.session.draftVersion);
                  setDefinitionSha(res.definitionSha256);
                });
              }}
            >
              Cargar la versión guardada
            </button>
          </div>
        ) : null}
        {body}
      </div>
    </IkigaiShell>
  );
}
