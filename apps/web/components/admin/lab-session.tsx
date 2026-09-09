'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ErrorNote,
  LockedPanel,
  Modal,
  Skeleton,
  Stepper,
} from './lab/primitives';
import { DualStatus, LabNav } from './lab/lab-nav';
import { StepCase } from './lab/step-case';
import {
  StepChange,
} from './lab/step-change';
import {
  StepExperience,
  emptyExperienceDraft,
  emptyProductReviewDraft,
  projectionPayload,
  type ExperienceDraft,
  type ProductReviewDraft,
} from './lab/step-experience';
import { StepPrediction, emptyExpectationDraft, type ExpectationDraft } from './lab/step-prediction';
import { StepPurpose, emptyPurposeDraft, type PurposeDraft } from './lab/step-purpose';
import { StepResponses } from './lab/step-responses';
import { isDirectionCompareFamily } from '@/lib/lab-ui/direction-compare';
import { PairCompare } from './lab/pair-compare';
import { StepResult } from './lab/step-result';
import { StepClose, ReviewSaved } from './lab/step-close';
import { StepReview, draftFromReview, emptyReviewDraft, reviewPayload, type ReviewDraft } from './lab/step-review';
import { StepVerdict } from './lab/step-verdict';
import {
  LabApiError,
  labApi,
  type LabAssessments,
  type LabCatalog,
  type LabChangeOptions,
  type LabComparison,
  type LabExpectation,
  type LabExperience,
  type LabGuidedChangeResult,
  type LabQuestion,
  type LabResult,
  type LabReviewRecord,
  type LabPairCompare,
  type LabParentCompare,
  type LabRunSummary,
  type LabWorkSession,
} from '@/lib/lab-api';
import { useUnsavedChanges } from '@/components/admin/unsaved-changes';
import { formDiffKeys, snapshotForm } from '@/lib/lab-ui/dirty-form';
import {
  definitionChangeFromCause,
  findingLayerFromProblem,
  shouldRegisterFinding,
} from '@/lib/lab-ui/review-followup';
import { type ChangePreset } from '@/lib/lab-ui/change-preset';
import { humanError } from '@/lib/lab-ui/format';
import { setLabFlash } from '@/lib/lab-ui/flash';
import { labUiLabels } from '@/lib/lab-ui/labels';
import { buildReviewExit, type ReviewExit } from '@/lib/lab-ui/review-exit';
import {
  buildLabSteps,
  getLabRunHumanStatus,
  matrixTrackLabel,
  PRIMARY_STEPS,
  productTrackLabel,
  purposeTrackLabel,
  type LabStepId,
} from '@/lib/lab-ui/status';

function isBenignConflict(error: unknown): boolean {
  if (!(error instanceof LabApiError) || error.status !== 409) return false;
  const text = `${error.reason ?? ''} ${error.message ?? ''}`.toLowerCase();
  return (
    text.includes('already_frozen') ||
    text.includes('already frozen') ||
    text.includes('not awaiting expectation')
  );
}

export function LabSession({ runId, focusFamilyId }: { runId: string; focusFamilyId?: string | null }) {
  const [step, setStep] = useState<LabStepId>('case');
  const [run, setRun] = useState<LabRunSummary | null>(null);
  const [questions, setQuestions] = useState<LabQuestion[]>([]);
  const [catalog, setCatalog] = useState<LabCatalog | null>(null);
  const [result, setResult] = useState<LabResult | null>(null);
  const [why, setWhy] = useState('');
  const [trace, setTrace] = useState('');
  const [comparison, setComparison] = useState<LabComparison | null>(null);
  const [assessments, setAssessments] = useState<LabAssessments | null>(null);
  const [experience, setExperience] = useState<LabExperience | null>(null);
  const [expectation, setExpectation] = useState<LabExpectation | null>(null);
  const [review, setReview] = useState<LabReviewRecord | null>(null);
  const [changeOptions, setChangeOptions] = useState<LabChangeOptions | null>(null);
  const [changeResult, setChangeResult] = useState<LabGuidedChangeResult | null>(null);
  const [pair, setPair] = useState<LabPairCompare | null>(null);
  const [parentCompare, setParentCompare] = useState<LabParentCompare | null>(null);
  const [session, setSession] = useState<LabWorkSession | null>(null);

  const [expectationDraft, setExpectationDraft] = useState<ExpectationDraft>(emptyExpectationDraft);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft>(emptyReviewDraft);
  const [purposeDraft, setPurposeDraft] = useState<PurposeDraft>(emptyPurposeDraft);
  const [experienceDraft, setExperienceDraft] = useState<ExperienceDraft>(emptyExperienceDraft);
  const [productDraft, setProductDraft] = useState<ProductReviewDraft>(emptyProductReviewDraft);
  const [productSaved, setProductSaved] = useState(false);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ReturnType<typeof humanError> | null>(null);
  const [expectationPersisted, setExpectationPersisted] = useState<ExpectationDraft>(emptyExpectationDraft);
  const [reviewPersisted, setReviewPersisted] = useState<ReviewDraft>(emptyReviewDraft);
  const [purposePersisted, setPurposePersisted] = useState<PurposeDraft>(emptyPurposeDraft);
  const [experiencePersisted, setExperiencePersisted] = useState({
    experience: emptyExperienceDraft,
    product: emptyProductReviewDraft,
  });
  const [whyDomain, setWhyDomain] = useState<string | null>(null);
  const [changePreset, setChangePreset] = useState<ChangePreset | null>(null);
  const [compareOpen, setCompareOpen] = useState<'pair' | 'parent' | null>(null);
  const [otherReviews, setOtherReviews] = useState(false);
  const [closeExit, setCloseExit] = useState<ReviewExit | null>(null);
  const [leaveTo, setLeaveTo] = useState<LabStepId | null>(null);
  const [responsesDirty, setResponsesDirty] = useState(false);
  const responsesSaveRef = useRef<(() => Promise<void>) | null>(null);
  const responsesDiscardRef = useRef<(() => void) | null>(null);
  const router = useRouter();
  const { register, tryNavigate } = useUnsavedChanges();

  const loadRun = useCallback(async () => {
    const next = await labApi.run(runId);
    setRun(next);
    return next;
  }, [runId]);

  const inferredFamilyRef = useRef<string | null>(null);
  const familyLockRef = useRef(`${runId}|${focusFamilyId ?? ''}`);
  const familyLock = `${runId}|${focusFamilyId ?? ''}`;
  if (familyLockRef.current !== familyLock) {
    familyLockRef.current = familyLock;
    inferredFamilyRef.current = null;
  }
  const familyId = useMemo(() => {
    if (focusFamilyId) return focusFamilyId;
    if (inferredFamilyRef.current) return inferredFamilyRef.current;
    const families = run?.method_families ?? [];
    const pendingFamily = families.find((item) => !run?.family_reviews?.[item.id]?.case_done);
    const next = pendingFamily?.id ?? families[0]?.id ?? null;
    if (next) inferredFamilyRef.current = next;
    return next;
  }, [focusFamilyId, run]);

  const familyDone = Boolean(familyId && run?.family_reviews?.[familyId]?.case_done);
  const directionCompare = isDirectionCompareFamily({
    id: familyId,
    review_surface: run?.method_families?.find((item) => item.id === familyId)?.review_surface,
  });

  const loadCloseExit = useCallback(async () => {
    await loadRun();
    const [progress, cases, agenda] = await Promise.all([
      labApi.sessionProgress(),
      labApi.cases(),
      labApi.reviewAgenda(),
    ]);
    setCloseExit(
      buildReviewExit({
        familyId,
        runId,
        families: progress.families ?? [],
        cases,
        agenda,
      }),
    );
  }, [familyId, loadRun, runId]);

  useEffect(() => {
    if (!familyDone) {
      setCloseExit(null);
      return;
    }
    void loadCloseExit();
  }, [familyDone, loadCloseExit]);

  useEffect(() => {
    Promise.all([labApi.run(runId), labApi.responses(runId), labApi.catalog(runId)])
      .then(([nextRun, nextQuestions, nextCatalog]) => {
        setRun(nextRun);
        setQuestions(nextQuestions);
        setCatalog(nextCatalog);
        // A case that has not been closed yet starts on its story; one already in
        // progress opens where the work stopped.
        const queryStep = new URLSearchParams(window.location.search).get('step');
        const requested =
          queryStep &&
          ['case', 'responses', 'prediction', 'result', 'review', 'verdict', 'purpose', 'experience', 'change'].includes(
            queryStep,
          )
            ? (queryStep as LabStepId)
            : null;
        const mapped = requested === 'review' || requested === 'verdict' ? 'result' : requested;
        setStep(
          mapped ??
            (nextRun.status === 'COLLECTING'
              ? 'case'
              : !nextRun.has_expectation
                ? 'prediction'
                : 'result'),
        );
      })
      .catch((err) => setError(humanError(err, 'No pudimos cargar este caso.')));
  }, [runId]);

  const revealed = run?.status === 'REVEALED';

  const loadRevealed = useCallback(async () => {
    const [nextResult, whyBody, cmp, ass, rev] = await Promise.all([
      labApi.result(runId),
      labApi.trace(runId),
      labApi.comparison(runId),
      labApi.assessments(runId),
      labApi.getReview(runId),
    ]);
    setResult(nextResult);
    setWhy(whyBody.why);
    setTrace(JSON.stringify(whyBody.trace, null, 2));
    setComparison(cmp);
    setExpectation(cmp.expectation);
    setAssessments(ass);
    setReview(rev.latest);
    if (rev.latest) {
      const next = draftFromReview(rev.latest);
      setReviewDraft(next);
      setReviewPersisted(next);
    }
    if (cmp.expectation) {
      const next = draftFromExpectation(cmp.expectation);
      setExpectationDraft(next);
      setExpectationPersisted(next);
    }
    if (ass.purpose[0]) {
      const latest = ass.purpose[0];
      const next = {
        stage: latest.stage,
        evidence: latest.evidenceRefs ?? [],
        confidence: latest.confidence ?? 'MEDIA',
        notes: latest.notes ?? '',
      };
      setPurposeDraft(next);
      setPurposePersisted(next);
    }
  }, [runId]);

  useEffect(() => {
    if (!revealed) return;
    loadRevealed().catch((err) => setError(humanError(err, 'No pudimos cargar el resultado.')));
    labApi
      .experience(runId)
      .then(setExperience)
      .catch(() => setExperience(null));
    labApi
      .changeOptions(runId)
      .then(setChangeOptions)
      .catch(() => setChangeOptions(null));
    if (run?.pair && !directionCompare) {
      labApi
        .pairCompare(runId)
        .then(setPair)
        .catch(() => setPair(null));
    } else {
      setPair(null);
    }
    labApi
      .currentSession()
      .then(setSession)
      .catch(() => setSession(null));
    labApi
      .compareParent(runId)
      .then(setParentCompare)
      .catch(() => setParentCompare(null));
  }, [revealed, runId, loadRevealed, run?.pair, directionCompare]);

  useEffect(() => {
    if (run?.status !== 'AWAITING_EXPECTATION' && run?.status !== 'REVEALED') return;
    labApi
      .getExpectation(runId)
      .then((body) => {
        setExpectation(body.latest);
        if (!body.latest) return;
        const next = draftFromExpectation(body.latest);
        setExpectationDraft(next);
        setExpectationPersisted(next);
      })
      .catch(() => undefined);
  }, [run?.status, runId]);

  const persistedForStep = useMemo(() => {
    if (step === 'prediction') return expectationPersisted;
    if (step === 'review') return reviewPersisted;
    if (step === 'purpose') return purposePersisted;
    if (step === 'experience') return experiencePersisted;
    return null;
  }, [step, expectationPersisted, reviewPersisted, purposePersisted, experiencePersisted]);

  const draftForStep = useMemo(() => {
    if (step === 'prediction') return expectationDraft;
    if (step === 'review') return reviewDraft;
    if (step === 'purpose') return purposeDraft;
    if (step === 'experience') return { experience: experienceDraft, product: productDraft };
    return null;
  }, [step, expectationDraft, reviewDraft, purposeDraft, experienceDraft, productDraft]);

  const dirty = useMemo(() => {
    if (step === 'responses') return responsesDirty;
    if (draftForStep == null || persistedForStep == null) return false;
    return snapshotForm(draftForStep) !== snapshotForm(persistedForStep);
  }, [step, responsesDirty, draftForStep, persistedForStep]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !dirty || draftForStep == null || persistedForStep == null) {
      return;
    }
    console.debug('[lab-dirty]', step, formDiffKeys(draftForStep, persistedForStep));
  }, [dirty, step, draftForStep, persistedForStep]);

  const canSaveBeforeLeave = step === 'responses' || step === 'review' || step === 'purpose';
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;
  const saveCurrentRef = useRef<() => Promise<void>>(async () => undefined);
  const discardNowRef = useRef<() => void>(() => undefined);
  saveCurrentRef.current = saveCurrentStep;
  discardNowRef.current = () => restorePersisted(step);

  useEffect(() => {
    register({
      isDirty: () => dirtyRef.current,
      save: () => saveCurrentRef.current(),
      discard: () => discardNowRef.current(),
    });
    return () => register(null);
  }, [register]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const steps = useMemo(() => (run ? buildLabSteps(run) : []), [run]);

  const purposeEmpty = Boolean(
    run &&
      (run.purpose_answered === false ||
        run.evidence?.purpose.answered === 0 ||
        (questions.length > 0 &&
          !questions.some(
            (question) =>
              (question.domain === 'PROPÓSITO' ||
                question.domain === 'PURPOSE' ||
                question.domain === 'PROPOSITO') &&
              question.status === 'ANSWERED',
          ))),
  );

  function navigate(next: LabStepId) {
    const target = steps.find((item) => item.id === next);
    const allowEmptyPurpose = next === 'purpose' && purposeEmpty;
    if (target?.state === 'LOCKED' && !allowEmptyPurpose) {
      return;
    }
    if (dirty && next !== step) {
      setLeaveTo(next);
      return;
    }
    setStep(next);
  }

  async function guard(action: () => Promise<void>, fallback: string) {
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(humanError(err, fallback));
      if (err instanceof LabApiError && err.status === 409) {
        await loadRun().catch(() => undefined);
      }
    } finally {
      setPending(false);
    }
  }

  if (!run) {
    return (
      <div className="lab">
        <LabNav />
        {error ? <ErrorNote error={error} /> : <Skeleton lines={6} />}
      </div>
    );
  }

  return (
    <div className={`lab lab--${step}`} data-lab-dirty={`${step}:${dirty}`}>
      <LabNav />
      <header className="lab-casehead">
        <div className="lab-casehead__bar">
          <div className="lab-casehead__left">
            <button
              type="button"
              className="lab-back"
              onClick={() => {
                const href = familyId ? `/admin/lab/families/${familyId}` : '/admin/lab';
                if (tryNavigate(href)) router.push(href);
              }}
            >
              {familyId ? 'Volver a la prueba' : 'Volver a Revisión'}
            </button>
            <h1 className="lab-casehead__title">{run.case_label}</h1>
            {run.case_kind === 'SIMULATION' && run.derived_from_label ? (
              <span className="lab-badge">Simulación de {run.derived_from_label}</span>
            ) : run.casebook_key ? (
              <span className="lab-badge">Caso de prueba</span>
            ) : revealed && run.test_intent ? (
              <span className="lab-casehead__intent">{run.test_intent}</span>
            ) : (
              <span className="lab-badge">{labUiLabels.caseKind(run.case_kind)}</span>
            )}
            {run.pair_side ? <span className="lab-badge lab-badge--amber">Caso {run.pair_side}</span> : null}
          </div>
          <div className="lab-casehead__right">
            <span className="lab-badge">{matrixTrackLabel(run)}</span>
            {!directionCompare && pair?.available && pair.other_revealed ? (
              <button type="button" className="lab-btn lab-btn--ghost" onClick={() => setCompareOpen('pair')}>
                Comparar versiones
              </button>
            ) : null}
            {parentCompare?.available && parentCompare.parent ? (
              <button type="button" className="lab-btn lab-btn--ghost" onClick={() => setCompareOpen('parent')}>
                Comparar con {parentCompare.parent.label}
              </button>
            ) : null}
            {run.has_purpose || run.has_product_review || otherReviews ? (
            <button
              type="button"
              className="lab-btn lab-btn--quiet"
              onClick={() => setOtherReviews((value) => !value)}
            >
              {otherReviews ? 'Ocultar revisiones' : 'Ver revisiones'}
            </button>
            ) : null}
          </div>
        </div>
        {run.case_kind === 'SIMULATION' && run.status === 'COLLECTING' ? (
          <p className="lab-hint" style={{ margin: 0 }}>
            Simulación de {run.derived_from_label ?? 'otro caso'}. Cambia las respuestas, cierra y compara.
          </p>
        ) : null}
        {otherReviews ? (
          <div className="lab-stack lab-stack--tight">
            <DualStatus
              matrixLabel={matrixTrackLabel(run)}
              purposeLabel={purposeTrackLabel(run, run.evidence?.purpose.answered)}
              productLabel={productTrackLabel(run)}
            />
            <div className="lab-actions">
              <button
                type="button"
                className="lab-btn lab-btn--ghost"
                disabled={steps.find((item) => item.id === 'purpose')?.state === 'LOCKED' && !purposeEmpty}
                onClick={() => navigate('purpose')}
              >
                Propósito y dirección
              </button>
              <button
                type="button"
                className="lab-btn lab-btn--ghost"
                disabled={steps.find((item) => item.id === 'experience')?.state === 'LOCKED'}
                onClick={() => navigate('experience')}
              >
                Probar cómo se vería en MK
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <Stepper
        steps={steps.filter((item) => PRIMARY_STEPS.includes(item.id))}
        active={step === 'responses' || step === 'review' || step === 'verdict' ? (step === 'responses' ? 'case' : 'result') : step}
        onSelect={navigate}
        label="Revisión de la Matriz"
      />

      {error ? <ErrorNote error={error} onRetry={() => loadRun().catch(() => undefined)} /> : null}

      {!directionCompare && compareOpen === 'pair' && pair?.available ? (
        <div className="lab-stack">
          <div className="lab-actions">
            <button type="button" className="lab-btn lab-btn--ghost" onClick={() => setCompareOpen(null)}>
              Cerrar comparación
            </button>
          </div>
          <PairCompare pair={pair} />
        </div>
      ) : null}

      {compareOpen === 'parent' && parentCompare?.available ? (
        <div className="lab-stack">
          <div className="lab-actions">
            <button type="button" className="lab-btn lab-btn--ghost" onClick={() => setCompareOpen(null)}>
              Cerrar comparación
            </button>
          </div>
          <PairCompare
            pair={parentCompare}
            title="Qué cambia entre Original y Simulación"
            aColumn={parentCompare.columns?.a ?? 'Original'}
            bColumn={parentCompare.columns?.b ?? 'Simulación'}
          />
        </div>
      ) : null}

      {!compareOpen && step === 'case' ? (
        <StepCase
          run={run}
          questions={questions}
          focusFamilyId={familyId}
          onContinue={() => {
            if (run.status === 'COLLECTING') navigate('responses');
            else if (!run.has_expectation) navigate('prediction');
            else navigate('result');
          }}
        />
      ) : null}

      {!compareOpen && step === 'responses' ? (
        <StepResponses
          run={run}
          questions={questions}
          catalog={catalog}
          pending={pending}
          firedSafetyIds={
            revealed
              ? result?.snapshot.safety.alerts.filter((alert) => alert.fired).map((alert) => alert.question_id)
              : []
          }
          onQuestions={setQuestions}
          onDirty={setResponsesDirty}
          itemTraces={result?.lab_reading.item_trace}
          onOpenWhy={(domain) => {
            setWhyDomain(domain);
            navigate('result');
          }}
          onTryChange={(preset) => {
            setChangePreset(preset as ChangePreset);
            navigate('change');
          }}
          saveRef={responsesSaveRef}
          discardRef={responsesDiscardRef}
          onFreeze={() =>
            guard(async () => {
              try {
                await labApi.freeze(runId);
              } catch (err) {
                if (!isBenignConflict(err)) throw err;
              }
              const next = await loadRun();
              setQuestions(await labApi.responses(runId));
              setStep(getLabRunHumanStatus(next).step);
            }, 'No pudimos cerrar las respuestas.')
          }
        />
      ) : null}

      {!compareOpen && step === 'prediction' ? (
        steps.find((item) => item.id === 'prediction')?.state === 'LOCKED' ? (
          <LockedPanel step={steps.find((item) => item.id === 'prediction')} />
        ) : (
          <StepPrediction
            run={run}
            catalog={catalog}
            saved={expectation}
            draft={expectationDraft}
            onDraft={setExpectationDraft}
            pending={pending}
            onSubmit={() =>
              guard(async () => {
                await labApi.expectation(runId, {
                  expected_states: expectationDraft.expected_states,
                  expected_priority_domain:
                    expectationDraft.expected_priority_domain || expectationDraft.personal_first_domain || 'UNSURE',
                  expected_plan_id: expectationDraft.expected_plan_id || null,
                  expected_alerts: expectationDraft.expected_alerts,
                  expected_purpose_stage: expectationDraft.expected_purpose_stage || 'UNSURE',
                  confidence: expectationDraft.confidence || 'MEDIA',
                  notes: expectationDraft.notes || null,
                  open_what_is_happening: expectationDraft.open_what_is_happening || null,
                  open_main_concern: expectationDraft.open_main_concern || null,
                  open_first_focus: expectationDraft.open_first_focus || null,
                  open_first_action: expectationDraft.open_first_action || null,
                  personal_first_domain: expectationDraft.personal_first_domain || null,
                });
                setExpectationPersisted(expectationDraft);
                await loadRun();
                setStep('result');
              }, 'No pudimos guardar tu criterio.')
            }
            onRevealWithout={() =>
              guard(async () => {
                try {
                  await labApi.reveal(runId);
                } catch (err) {
                  if (!isBenignConflict(err)) throw err;
                }
                setExpectationPersisted(expectationDraft);
                await loadRun();
                setStep('result');
              }, 'No pudimos revelar el resultado.')
            }
          />
        )
      ) : null}

      {!compareOpen && step === 'result' ? (
        !revealed ? (
          <LockedPanel step={steps.find((item) => item.id === 'result')} />
        ) : result ? (
          <StepResult
            result={result}
            comparison={comparison}
            pair={directionCompare ? undefined : pair}
            parentCompare={parentCompare}
            questions={questions}
            expectation={expectation}
            why={why}
            trace={trace}
            initialWhyDomain={whyDomain}
            onTryAlternative={() => {
              setChangePreset({
                diagnosis: 'CALCULATION',
                kind: 'DOMAIN_AGGREGATION',
                target_id: 'LAB-SCORE-01.domain_aggregation',
                value: 'ITEM_WEIGHTED',
              });
              navigate('change');
            }}
            footer={
              closeExit ? (
                <ReviewSaved exit={closeExit} />
              ) : (
                <StepClose run={run} familyId={familyId} pending={pending} onSaved={loadCloseExit} />
              )
            }
          />
        ) : (
          <Skeleton lines={6} />
        )
      ) : null}

      {!compareOpen && step === 'review' ? (
        !revealed ? (
          <LockedPanel step={steps.find((item) => item.id === 'review')} />
        ) : result ? (
          <StepReview
            result={result}
            questions={questions}
            runId={runId}
            expectation={expectation}
            comparison={comparison}
            saved={review}
            draft={reviewDraft}
            onDraft={setReviewDraft}
            pending={pending}
            onSubmit={() =>
              guard(async () => {
                let linkedId = reviewDraft.linkedFindingId || null;
                if (shouldRegisterFinding(reviewDraft.overallSense, reviewDraft.firstDivergence)) {
                  if (linkedId) {
                    await labApi.linkFindingCases(linkedId, [run.case_id]);
                  } else {
                    const created = await labApi.createFinding({
                      title: (
                        labUiLabels.firstDivergence(reviewDraft.firstDivergence) || 'Hallazgo'
                      ).slice(0, 200),
                      summary: reviewDraft.notes || labUiLabels.firstDivergence(reviewDraft.firstDivergence),
                      layer: findingLayerFromProblem(reviewDraft.firstDivergence),
                      severity: 'IMPORTANT',
                      hypothesis: reviewDraft.findingConfidence
                        ? `Confianza: ${labUiLabels.confidence(reviewDraft.findingConfidence)}.`
                        : null,
                      current_behavior: labUiLabels.firstDivergence(reviewDraft.firstDivergence),
                      rafa_expected_behavior: reviewDraft.notes || 'Sin registrar',
                      evidence_ids: reviewDraft.evidence,
                      case_ids: [run.case_id],
                      content_change_required: definitionChangeFromCause(
                        reviewDraft.firstDivergence,
                        reviewDraft.rootCauses[0] ?? '',
                      ),
                    });
                    linkedId = created.id;
                  }
                }
                await labApi.review(runId, {
                  ...reviewPayload(reviewDraft),
                  linked_finding_id: linkedId,
                });
                setReviewPersisted({ ...reviewDraft, linkedFindingId: linkedId ?? '' });
                const [rev] = await Promise.all([labApi.getReview(runId), loadRun()]);
                setReview(rev.latest);
                setStep('verdict');
              }, 'No pudimos guardar tu evaluación.')
            }
            onContinue={() => navigate('verdict')}
          />
        ) : (
          <Skeleton lines={6} />
        )
      ) : null}

      {!compareOpen && step === 'verdict' ? (
        !revealed ? (
          <LockedPanel step={steps.find((item) => item.id === 'verdict')} />
        ) : result ? (
          <StepVerdict
            run={run}
            result={result}
            expectation={expectation}
            comparison={comparison}
            flaggedQuestions={questions.filter((item) => item.flagged_here).map((item) => item.id)}
            saved={review}
            reviewDraft={reviewDraft}
            pending={pending}
            onSaved={(next) => setReview(next)}
            onTryChange={(preset) => {
              setChangePreset(preset);
              navigate('change');
            }}
            onContinue={() => {
              setLabFlash('Cierre guardado');
              router.push('/admin/lab');
            }}
          />
        ) : (
          <Skeleton lines={6} />
        )
      ) : null}

      {!compareOpen && step === 'purpose' ? (
        !revealed && !purposeEmpty ? (
          <LockedPanel step={steps.find((item) => item.id === 'purpose')} />
        ) : result || purposeEmpty ? (
          <StepPurpose
            result={result}
            questions={questions}
            assessments={assessments}
            direction={experience?.projection.direction.statement ?? null}
            draft={purposeDraft}
            onDraft={setPurposeDraft}
            pending={pending}
            onSubmit={() =>
              guard(async () => {
                await labApi.purpose(runId, {
                  stage: purposeDraft.stage,
                  evidence_refs: purposeDraft.evidence,
                  confidence: purposeDraft.confidence,
                  notes: purposeDraft.notes || null,
                });
                setPurposePersisted(purposeDraft);
                const [ass] = await Promise.all([labApi.assessments(runId), loadRun()]);
                setAssessments(ass);
              }, 'No pudimos guardar tu criterio de Propósito.')
            }
            onContinue={() => navigate(purposeEmpty ? (run.status === 'COLLECTING' ? 'case' : 'responses') : 'experience')}
          />
        ) : (
          <Skeleton lines={6} />
        )
      ) : null}

      {!compareOpen && step === 'experience' ? (
        !revealed ? (
          <LockedPanel step={steps.find((item) => item.id === 'experience')} />
        ) : result ? (
          <StepExperience
            result={result}
            experience={experience}
            purposeStage={assessments?.purpose[0]?.stage ?? null}
            draft={experienceDraft}
            onDraft={setExperienceDraft}
            productDraft={productDraft}
            onProductDraft={setProductDraft}
            productSaved={productSaved}
            pending={pending}
            onProject={() =>
              guard(async () => {
                if (experienceDraft.direction.trim()) {
                  await labApi.direction(runId, {
                    statement: experienceDraft.direction.trim(),
                    source: experienceDraft.directionSource || 'RAFA_JUDGMENT',
                  });
                }
                const hasObjectives = (experience?.projection.objective.available.length ?? 0) > 0;
                const next = await labApi.project(runId, projectionPayload(experienceDraft, hasObjectives));
                setExperience(next);
                setExperiencePersisted({ experience: experienceDraft, product: productDraft });
              }, 'No pudimos generar la vista de la persona.')
            }
            onSaveProductReview={() =>
              guard(async () => {
                await labApi.productReview(runId, {
                  verdicts: productDraft.verdicts,
                  purpose_feels: productDraft.purposeFeels,
                  still_mk: productDraft.stillMk,
                  first_product_divergence: productDraft.divergence,
                  what_would_change: productDraft.wouldChange || null,
                  what_was_missing: productDraft.missing || null,
                });
                setProductSaved(true);
                setExperiencePersisted({ experience: experienceDraft, product: productDraft });
                await loadRun();
              }, 'No pudimos guardar la evaluación del producto.')
            }
          />
        ) : (
          <Skeleton lines={6} />
        )
      ) : null}

      {!compareOpen && step === 'change' ? (
        !revealed ? (
          <LockedPanel step={steps.find((item) => item.id === 'change')} />
        ) : session?.closeObservationBeforeChanges && !run.has_case_verdict ? (
          <div className="lab-alert" role="status">
            <p className="lab-alert__title">Cerrar observación antes de probar cambios</p>
            <p className="lab-muted" style={{ margin: 0 }}>
              Esta tanda pide terminar la revisión del caso antes de crear un cambio. Puedes
              desactivar esa opción al seleccionar casos para revisar.
            </p>
          </div>
        ) : (
          <StepChange
            runId={runId}
            options={changeOptions}
            preset={changePreset}
            reasonSeed={reviewDraft.notes || review?.notes || ''}
            pending={pending}
            result={changeResult}
            onSubmit={(body) =>
              guard(async () => {
                const next = await labApi.guidedChange(runId, body);
                setChangeResult(next);
              }, 'No pudimos crear este cambio.')
            }
            onVerdict={(verdict) =>
              guard(async () => {
                if (!changeResult) return;
                await labApi.verdict(changeResult.comparison.id, runId, verdict);
              }, 'No pudimos guardar el veredicto.')
            }
            onDiscard={() =>
              guard(async () => {
                if (!changeResult) return;
                await labApi.reject(changeResult.changeset_id);
                setChangeResult(null);
                setChangePreset(null);
              }, 'No pudimos descartar este cambio.')
            }
            onAdjust={() =>
              guard(async () => {
                if (!changeResult) return;
                await labApi.reject(changeResult.changeset_id);
                setChangeResult(null);
              }, 'No pudimos volver a ajustar este cambio.')
            }
          />
        )
      ) : null}

      {leaveTo ? (
        <Modal
          title="Tienes cambios sin guardar"
          onClose={() => setLeaveTo(null)}
          actions={
            <>
              <button type="button" className="lab-btn lab-btn--ghost" onClick={() => setLeaveTo(null)}>
                Seguir editando
              </button>
              <button
                type="button"
                className="lab-btn lab-btn--danger"
                onClick={() => {
                  restorePersisted(step);
                  setStep(leaveTo);
                  setLeaveTo(null);
                }}
              >
                Salir sin guardar
              </button>
              {canSaveBeforeLeave ? (
                <button
                  type="button"
                  className="lab-btn"
                  disabled={pending}
                  onClick={() => {
                    const dest = leaveTo;
                    void guard(async () => {
                      await saveCurrentStep();
                      if (dest) setStep(dest);
                      setLeaveTo(null);
                    }, 'No pudimos guardar los cambios.');
                  }}
                >
                  Guardar
                </button>
              ) : null}
            </>
          }
        >
          <p className="lab-muted">
            Si sales ahora, lo que no hayas guardado se perderá.
          </p>
        </Modal>
      ) : null}
    </div>
  );

  async function saveCurrentStep() {
    if (step === 'responses') {
      await responsesSaveRef.current?.();
      return;
    }
    if (step === 'review') {
      await labApi.review(runId, reviewPayload(reviewDraft));
      setReviewPersisted(reviewDraft);
      const [rev] = await Promise.all([labApi.getReview(runId), loadRun()]);
      setReview(rev.latest);
      return;
    }
    if (step === 'purpose') {
      await labApi.purpose(runId, {
        stage: purposeDraft.stage,
        evidence_refs: purposeDraft.evidence,
        confidence: purposeDraft.confidence,
        notes: purposeDraft.notes || null,
      });
      setPurposePersisted(purposeDraft);
      const [ass] = await Promise.all([labApi.assessments(runId), loadRun()]);
      setAssessments(ass);
    }
  }

  function restorePersisted(current: LabStepId) {
    if (current === 'responses') responsesDiscardRef.current?.();
    if (current === 'prediction') setExpectationDraft(expectationPersisted);
    if (current === 'review') setReviewDraft(reviewPersisted);
    if (current === 'purpose') setPurposeDraft(purposePersisted);
    if (current === 'experience') {
      setExperienceDraft(experiencePersisted.experience);
      setProductDraft(experiencePersisted.product);
    }
  }
}

function draftFromExpectation(saved: LabExpectation): ExpectationDraft {
  return {
    open_what_is_happening: saved.openWhatIsHappening ?? '',
    open_main_concern: saved.openMainConcern ?? '',
    open_first_focus: saved.openFirstFocus ?? '',
    open_first_action: saved.openFirstAction ?? '',
    personal_first_domain: saved.personalFirstDomain ?? '',
    expected_states: saved.expectedStates,
    expected_priority_domain: saved.expectedPriorityDomain,
    expected_plan_id: saved.expectedPlanId ?? '',
    expected_purpose_stage: saved.expectedPurposeStage,
    confidence: saved.confidence,
    notes: saved.notes ?? '',
    expected_alerts: [],
  };
}

