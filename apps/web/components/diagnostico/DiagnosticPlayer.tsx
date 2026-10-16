'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useAuthSession } from '@/components/auth-session-provider';
import {
  apiDiagnosticState,
  apiDiagnosticSubmitResponse,
  type DiagnosticState,
  type QuestionDto,
} from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { journeySynthesis, saveSynthesis } from '@/lib/journey-api';
import { continuePastModule } from '@/lib/diagnostic-continue';
import { AppIcon } from '@/components/app-icon';
import { ReviewVersionNote } from '@/components/app-shell/ReviewVersionNote';
import {
  buildInitialSelection,
  continueHint,
  isSelectionValid,
  FactorResult,
  QuestionCard,
  selectionToPayload,
  ShadowResult,
} from './QuestionCard';
import { DiagnosticCross, type CrossActivity, type CrossDraft } from './DiagnosticCross';
import { moduleIntroIcon } from './module-intro-icon';
import { ProgressRail, questionnaireStageLabel } from './ProgressRail';
import { PlayerStage } from './PlayerStage';
import { moduleDisplayTitle, moduleSectionIntro } from './section-copy';
import { activityAnswer, activityCounts, activityDraftReady, activityField, activityLens, isIkigaiClose, type ActivityFieldName } from '@/lib/activity-map';
import { oceanClosedReading } from '@/lib/ocean-reading';
import { shadowClosedReading, shadowPoints } from '@/lib/shadow-reading';
import {
  introIconItem,
  introStaggerContainer,
  introStaggerItem,
  moduleIntroVariants,
  questionScreenVariants,
} from './diagnostic-motion';

type PlayerStatus = 'loading' | 'module_intro' | 'question' | 'error';

function introAddsDetail(title: string | null | undefined, intro: string | null | undefined): boolean {
  const text = intro?.trim() ?? '';
  if (!text) return false;
  const heading = (title ?? '').toLocaleLowerCase('es').replace(/\s+/g, ' ').trim();
  const line = text.toLocaleLowerCase('es').replace(/\s+/g, ' ').trim();
  return heading !== line && !heading.includes(line);
}

const BROOKS_SCALE = [
  'Totalmente falso / casi nunca.',
  'Más falso que verdadero.',
  'Parcialmente verdadero.',
  'Mayoritariamente verdadero.',
  'Totalmente verdadero / casi siempre.',
];

function textHasDraft(question: QuestionDto, value: string): boolean {
  if (!value) return false;
  const kind = question.capture?.kind;
  if (kind === 'number' || kind === 'hours' || kind === 'birthdate') return value !== '';
  if (kind === 'measures' || kind === 'lines') {
    try {
      const data = JSON.parse(value) as Record<string, unknown>;
      return Object.values(data).some((item) => String(item ?? '').trim().length > 0);
    } catch {
      return value.trim().length > 0;
    }
  }
  if (kind === 'activity' || kind === 'ikigai') {
    try {
      const data = JSON.parse(value) as { ambit?: string; option?: string; answer?: string; activity?: string; also?: string[] };
      return Boolean(data.ambit || data.option || data.answer?.trim() || data.activity?.trim() || data.also?.length);
    } catch {
      return false;
    }
  }
  return value.trim().length > 0;
}

function answerPresence(question: QuestionDto, selection: ReturnType<typeof buildInitialSelection>): 'empty' | 'partial' | 'ready' {
  if (isSelectionValid(question, selection)) return 'ready';
  if (selection.type === 'text' && textHasDraft(question, selection.value)) return 'partial';
  if (selection.type === 'scale' && selection.reason.trim().length > 0) return 'partial';
  return 'empty';
}

type HistoryEntry = {
  state: DiagnosticState;
  selection: ReturnType<typeof buildInitialSelection>;
};

function choicePoints(question: QuestionDto, selection: ReturnType<typeof buildInitialSelection>): number | null {
  if (selection.type !== 'single' || !selection.selected) return null;
  const option = question.options.find((item) => item.id === selection.selected);
  return shadowPoints(option?.value ?? option?.textEs);
}

function shadowScores(
  question: QuestionDto,
  selection: ReturnType<typeof buildInitialSelection>,
  history: HistoryEntry[],
): Record<string, number | null> {
  const scores: Record<string, number | null> = {};
  for (const [ref, value] of Object.entries(question.savedChoices ?? {})) {
    const points = shadowPoints(value);
    if (points != null) scores[ref] = points;
  }
  function apply(sourceRef: string | null | undefined, draft: ReturnType<typeof buildInitialSelection>, item: QuestionDto) {
    if (!sourceRef) return;
    if (draft.type === 'exception') {
      delete scores[sourceRef];
      return;
    }
    const points = choicePoints(item, draft);
    if (points != null) scores[sourceRef] = points;
  }
  for (const entry of history) {
    if (entry.state.nextStep.type !== 'question') continue;
    apply(entry.state.nextStep.data.sourceRef, entry.selection, entry.state.nextStep.data);
  }
  apply(question.sourceRef, selection, question);
  return scores;
}

function ikigaiMapFor(
  question: QuestionDto,
  selection: ReturnType<typeof buildInitialSelection>,
  history: HistoryEntry[],
) {
  const focus = activityLens(question.sourceRef);
  if (question.capture?.kind !== 'activity' || !focus) return null;
  const filled = new Set(question.filledActivities ?? []);
  const ideas = new Map((question.activityNotes ?? []).map((note) => [note.sourceRef, note.text]));
  for (const entry of history) {
    if (entry.state.nextStep.type !== 'question') continue;
    const prior = entry.state.nextStep.data;
    if (prior.capture?.kind !== 'activity' || !prior.sourceRef) continue;
    const text = entry.selection.type === 'text' ? activityAnswer(entry.selection.value) : '';
    if (entry.selection.type === 'text' && activityDraftReady(entry.selection.value)) {
      filled.add(prior.sourceRef);
      if (text) ideas.set(prior.sourceRef, text);
    } else {
      filled.delete(prior.sourceRef);
      ideas.delete(prior.sourceRef);
    }
  }
  if (question.sourceRef) {
    const live = selection.type === 'text' ? activityAnswer(selection.value) : '';
    if (selection.type === 'text' && (activityDraftReady(selection.value) || live.length >= 3)) filled.add(question.sourceRef);
    else filled.delete(question.sourceRef);
    ideas.delete(question.sourceRef);
  }
  const counts = activityCounts(filled);
  const reached = (Object.keys(counts) as Array<keyof typeof counts>).filter((key) => counts[key] > 0);
  const own = [...ideas.entries()]
    .filter(([ref]) => activityLens(ref) === focus)
    .map(([, text]) => text);
  return { focus, counts, reached, ideas: own };
}

function readCrossActivity(sourceRef: string, raw: string): CrossActivity | null {
  const field = activityField(sourceRef);
  if (!field) return null;
  try {
    const parsed = JSON.parse(raw) as { ambit?: string; option?: string; answer?: string };
    const answer = parsed.answer?.trim() ?? '';
    if (!answer) return null;
    return {
      sourceRef,
      field,
      ambit: parsed.ambit?.trim() ?? '',
      option: parsed.option?.trim() ?? '',
      answer,
    };
  } catch {
    return null;
  }
}

function crossActivities(
  question: QuestionDto,
  selection: ReturnType<typeof buildInitialSelection>,
  history: HistoryEntry[],
): CrossActivity[] {
  const byRef = new Map<string, CrossActivity>();
  for (const note of question.activityNotes ?? []) {
    const field = activityField(note.sourceRef);
    if (!field || !note.text.trim()) continue;
    byRef.set(note.sourceRef, { sourceRef: note.sourceRef, field, ambit: '', option: '', answer: note.text.trim() });
  }
  for (const entry of history) {
    if (entry.state.nextStep.type !== 'question') continue;
    const prior = entry.state.nextStep.data;
    if (prior.capture?.kind !== 'activity' || !prior.sourceRef || entry.selection.type !== 'text') continue;
    const activity = readCrossActivity(prior.sourceRef, entry.selection.value);
    if (activity) byRef.set(prior.sourceRef, activity);
    else byRef.delete(prior.sourceRef);
  }
  if (question.sourceRef && selection.type === 'text') {
    const activity = readCrossActivity(question.sourceRef, selection.value);
    if (activity) byRef.set(question.sourceRef, activity);
  }
  return [...byRef.values()];
}

export function DiagnosticPlayer() {
  const router = useRouter();
  const { status, refresh } = useAuthSession();
  const reduced = useReducedMotion();
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('loading');
  const [state, setState] = useState<DiagnosticState | null>(null);
  const [selection, setSelection] = useState<ReturnType<typeof buildInitialSelection> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [leaveUnsaved, setLeaveUnsaved] = useState(false);
  const shownAtRef = useRef<number>(Date.now());
  const historyRef = useRef<HistoryEntry[]>([]);
  const heldRef = useRef<DiagnosticState | 'outro' | null>(null);
  const [reveal, setReveal] = useState<
    | { kind: 'shadow' | 'ocean'; lines: { label: string; detail: string }[] }
    | { kind: 'cross'; activities: CrossActivity[] }
    | null
  >(null);
  const [crossStep, setCrossStep] = useState<0 | 1>(0);
  const [crossDraft, setCrossDraft] = useState<CrossDraft | null>(null);
  const crossDismissed = useRef(false);
  const stateRef = useRef(state);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingOutroRef = useRef<string | null>(null);
  stateRef.current = state;

  useEffect(() => {
    if (status === 'guest') {
      router.replace('/login');
      return;
    }

    const token = getAccessToken();
    if (status === 'loading' && !token) return;
    if (!token) {
      router.replace('/login');
      return;
    }

    let cancelled = false;

    apiDiagnosticState(token)
      .then((s) => {
        if (cancelled) return;
        if (s.sessionState.showWelcomeScreen) {
          router.replace('/diagnostico/bienvenida');
          return;
        }
        applyState(s);
      })
      .catch(() => {
        if (cancelled) return;
        setError('No se pudo cargar el cuestionario.');
        setPlayerStatus('error');
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function applyState(s: DiagnosticState, skipIntro = false, pushHistory = false) {
    if (s.sessionState.showWelcomeScreen) {
      router.replace('/diagnostico/bienvenida');
      return;
    }
    if (pushHistory && state?.nextStep.type === 'question' && selection) {
      const saved = state.nextStep.data;
      historyRef.current = [...historyRef.current, {
        selection,
        state: {
          ...state,
          nextStep: {
            ...state.nextStep,
            data: { ...saved, answerRevision: (saved.answerRevision ?? 0) + 1 },
          },
        },
      }];
    }
    if (s.nextStep.type === 'module_outro') {
      void passModule(s.nextStep.data.moduleSlug);
      return;
    }
    setState(s);
    if (s.nextStep.type === 'question') {
      if (s.sessionState.isModuleStart && !skipIntro) {
        setPlayerStatus('module_intro');
      } else {
        setSelection(buildInitialSelection(s.nextStep.data));
        setPlayerStatus('question');
        shownAtRef.current = Date.now();
      }
    } else if (s.nextStep.type === 'diagnostic_complete') {
      router.replace('/diagnostico/resultado');
    }
  }

  async function passModule(slug: string) {
    const token = getAccessToken();
    if (!token) return;
    try {
      const next = await continuePastModule(token, slug);
      if (next.nextStep.type === 'diagnostic_complete') {
        pendingOutroRef.current = null;
        await refresh({ force: true });
        router.replace('/diagnostico/resultado');
        return;
      }
      if (next.nextStep.type === 'module_outro') {
        pendingOutroRef.current = next.nextStep.data.moduleSlug;
        setError('No pudimos continuar. Revisa tu conexión e intenta de nuevo.');
        if (!stateRef.current) setPlayerStatus('error');
        return;
      }
      pendingOutroRef.current = null;
      applyState(next);
    } catch {
      pendingOutroRef.current = slug;
      setError('No pudimos continuar. Revisa tu conexión e intenta de nuevo.');
      if (!stateRef.current) setPlayerStatus('error');
    }
  }

  function handleGoBack() {
    if (isSubmitting || isExiting) return;
    if (reveal?.kind === 'cross' && crossStep > 0) {
      setCrossStep(0);
      return;
    }
    if (reveal?.kind === 'cross') crossDismissed.current = true;
    if (reveal) {
      heldRef.current = null;
      pendingOutroRef.current = null;
      setReveal(null);
      return;
    }
    const prev = historyRef.current.at(-1);
    if (!prev) return;
    historyRef.current = historyRef.current.slice(0, -1);
    setState(prev.state);
    setSelection(prev.selection);
    setPlayerStatus('question');
    shownAtRef.current = Date.now();
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    if (pendingOutroRef.current) {
      setIsSubmitting(true);
      setError(null);
      try {
        await passModule(pendingOutroRef.current);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    if (!state || !selection) return;
    if (state.nextStep.type !== 'question') return;
    if (!isSelectionValid(state.nextStep.data, selection)) return;

    const token = getAccessToken();
    if (!token) return;

    const submittedId = state.nextStep.data.id;
    const submittedSelection = selection;
    setIsSubmitting(true);
    setError(null);
    setLeaveUnsaved(false);

    try {
      const next = await apiDiagnosticSubmitResponse(token, {
        questionId: submittedId,
        ...selectionToPayload(submittedSelection),
        expectedRevision: state.nextStep.data.answerRevision ?? 0,
        latencyMs: Date.now() - shownAtRef.current,
      });

      const current = stateRef.current;
      const stillHere = current?.nextStep.type === 'question' && current.nextStep.data.id === submittedId;
      if (!stillHere) return;

      const scores = shadowScores(state.nextStep.data, submittedSelection, historyRef.current);
      const shadowLines = shadowClosedReading(state.nextStep.data.sourceRef, scores);
      const oceanLines = oceanClosedReading(state.nextStep.data.sourceRef, scores);
      const closed = shadowLines.length > 0
        ? { kind: 'shadow' as const, lines: shadowLines }
        : oceanLines.length > 0
          ? { kind: 'ocean' as const, lines: oceanLines }
          : isIkigaiClose(state.nextStep.data.sourceRef)
            ? { kind: 'cross' as const, activities: crossActivities(state.nextStep.data, submittedSelection, historyRef.current) }
            : null;
      if (closed) {
        heldRef.current = next.nextStep.type === 'module_outro' ? 'outro' : next;
        if (next.nextStep.type === 'module_outro') pendingOutroRef.current = next.nextStep.data.moduleSlug;
        if (closed.kind === 'cross') {
          setCrossStep(0);
          setCrossDraft(null);
        }
        setReveal(closed);
        return;
      }

      if (next.nextStep.type === 'module_outro') {
        await passModule(next.nextStep.data.moduleSlug);
        return;
      }

      applyState(next, false, true);
    } catch (err) {
      const status = (err as { status?: number }).status;
      const current = stateRef.current;
      const stillHere = current?.nextStep.type === 'question' && current.nextStep.data.id === submittedId;
      if (!stillHere) {
        // A late failure belongs to the earlier question. It must not replace the one on screen.
        setError('No se pudo guardar la respuesta anterior. Vuelve a ella para reintentar.');
        return;
      }
      setError(status === 409
        ? 'Otra sesión escribió después. Recarga el cuestionario antes de guardar.'
        : 'No se pudo guardar. El texto sigue aquí. Puedes reintentar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function finishCross() {
    if (reveal?.kind !== 'cross' || !crossDraft?.sentence) return;
    const token = getAccessToken();
    if (!token) return;
    const chosen = crossDraft.mixes.find((mix) => mix.id === crossDraft.chosenId);
    if (!chosen) return;
    const links = [];
    const order: ActivityFieldName[] = ['pasion', 'vocacion', 'mision', 'profesion'];
    const combinations = crossDraft.mixes.map((mix) => ({
      id: mix.id,
      reason: '',
      valuation: null,
      valuationReason: '',
      experiment: '',
    }));
    for (const mix of crossDraft.mixes) {
      for (let index = 0; index < order.length - 1; index += 1) {
        links.push({
          id: crypto.randomUUID(),
          fromRef: mix.parts[order[index]],
          toRef: mix.parts[order[index + 1]],
          combinationId: mix.id,
          reason: '',
          status: 'ACTIVE' as const,
        });
      }
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await saveSynthesis(token, {
        activities: reveal.activities,
        links,
        combinations,
        purpose: {
          status: 'EXPLORANDO',
          parts: chosen.parts,
          generated: crossDraft.sentence,
          edited: null,
          open: [],
        },
      });
      crossDismissed.current = true;
      handleRevealContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cruce.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRevealContinue() {
    const held = heldRef.current;
    heldRef.current = null;
    setReveal(null);
    if (held === 'outro') {
      const slug = pendingOutroRef.current;
      if (!slug) return;
      setIsSubmitting(true);
      void passModule(slug).finally(() => setIsSubmitting(false));
      return;
    }
    if (held) applyState(held, false, true);
  }

  async function handleSaveAndExit() {
    if (isSubmitting || isExiting) return;
    if (reveal) {
      router.push('/panel');
      return;
    }
    const question = state?.nextStep.type === 'question' ? state.nextStep.data : null;
    const presence = playerStatus === 'question' && question && selection
      ? answerPresence(question, selection)
      : 'empty';

    if (presence === 'partial' && question) {
      setLeaveUnsaved(true);
      setError(`${continueHint(question)} Si sales ahora, lo escrito en esta pregunta no se guarda.`);
      return;
    }

    if (presence !== 'ready' || !question || !selection) {
      router.push('/panel');
      return;
    }

    setIsSubmitting(true);
    setIsExiting(true);
    setLeaveUnsaved(false);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) throw new Error('missing_token');
      await apiDiagnosticSubmitResponse(token, {
        questionId: question.id,
        ...selectionToPayload(selection),
        expectedRevision: question.answerRevision ?? 0,
        latencyMs: Date.now() - shownAtRef.current,
      });
      router.push('/panel');
    } catch {
      setError('No pudimos guardar tu respuesta. Revisa tu conexión e intenta de nuevo.');
      setIsExiting(false);
      setIsSubmitting(false);
    }
  }

  function handleStartModule() {
    if (!state || state.nextStep.type !== 'question') return;
    setSelection(buildInitialSelection(state.nextStep.data));
    setPlayerStatus('question');
    shownAtRef.current = Date.now();
  }

  const currentQuestion =
    state?.nextStep.type === 'question' ? state.nextStep.data : null;
  const isValid =
    currentQuestion && selection ? isSelectionValid(currentQuestion, selection) : false;
  const ss = state?.sessionState;
  const canGoBack = historyRef.current.length > 0;
  const introKey = ss?.currentModuleSlug ?? 'intro';

  useEffect(() => {
    if (!state || reveal || crossDismissed.current) return;
    if (state.sessionState.currentModuleSlug !== 'e-per-huella' || !state.sessionState.isModuleStart) return;
    const token = getAccessToken();
    if (!token) return;
    let cancelled = false;
    journeySynthesis(token)
      .then((row) => {
        if (cancelled || crossDismissed.current) return;
        const parts = row.purpose?.parts ?? {};
        if (parts.pasion && parts.vocacion && parts.mision && parts.profesion) return;
        const activities = row.activities.flatMap((item) => (
          item.answer?.trim()
            ? [{ sourceRef: item.sourceRef, field: item.field, ambit: item.ambit ?? '', option: item.option ?? '', answer: item.answer.trim() }]
            : []
        ));
        if (activities.length === 0) return;
        heldRef.current = state;
        setCrossStep(0);
        setCrossDraft(null);
        setReveal({ kind: 'cross', activities });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [state, reveal]);

  useEffect(() => {
    if (playerStatus !== 'question' || !currentQuestion) return;
    if (currentQuestion.capture?.kind === 'activity') return;
    const scroller = scrollRef.current;
    if (scroller && typeof scroller.scrollTo === 'function') scroller.scrollTo({ top: 0 });
  }, [playerStatus, currentQuestion?.id, currentQuestion?.capture?.kind]);

  if (playerStatus === 'loading') {
    return (
      <main className="dk-player-shell">
        <div className="dk-player-center">
          <div className="auth-loading"><span className="auth-spinner" aria-hidden /></div>
        </div>
      </main>
    );
  }

  if (playerStatus === 'error' || !state || !ss) {
    return (
      <PlayerStage
        header={null}
        primary={{ label: 'Volver al inicio', onClick: () => router.push('/diagnostico') }}
      >
        <p className="dk-player-error" role="alert">{error ?? 'Ocurrió un error inesperado.'}</p>
      </PlayerStage>
    );
  }

  const onIntro = playerStatus === 'module_intro';
  const introStep =
    onIntro && ss.currentModuleOrder != null && ss.totalModules > 0
      ? `Módulo ${ss.currentModuleOrder} de ${ss.totalModules}`
      : null;
  const introMinutes =
    onIntro && ss.currentModuleEstimatedMinutes != null && ss.currentModuleEstimatedMinutes > 0
      ? ss.currentModuleEstimatedMinutes === 1
        ? '1 minuto'
        : `${ss.currentModuleEstimatedMinutes} minutos`
      : null;
  const introIcon = onIntro ? moduleIntroIcon(ss.currentModuleSlug, ss.currentModuleIcon) : null;
  const sectionIntro = moduleSectionIntro(ss.currentModuleSlug);

  const asking = playerStatus === 'question' && currentQuestion != null && selection != null;
  const primaryLabel = onIntro
    ? 'Comenzar'
    : isSubmitting && !isExiting
      ? 'Guardando…'
      : 'Continuar';

  return (
    <>
      <PlayerStage
        bodyRef={scrollRef}
        describedBy={asking && !reveal && !isValid ? 'dk-continue-hint' : undefined}
        note={asking && !reveal ? 'Tu respuesta se guarda al continuar.' : null}
        primary={{
          label: reveal?.kind === 'cross' && crossStep < 1 ? 'Siguiente' : primaryLabel,
          onClick: reveal?.kind === 'cross'
            ? () => { if (crossStep < 1) setCrossStep(1); else void finishCross(); }
            : reveal ? handleRevealContinue : onIntro ? handleStartModule : handleSubmit,
          disabled: reveal?.kind === 'cross' ? !crossDraft?.ready || isSubmitting : reveal ? isSubmitting : onIntro ? false : !isValid || isSubmitting,
        }}
        header={(
          <ProgressRail
            pct={ss.completionPct}
            questionIndex={playerStatus === 'question' ? ss.currentQuestionIndex : undefined}
            questionTotal={playerStatus === 'question' ? ss.moduleQuestionCount : undefined}
            contextLabel={questionnaireStageLabel(ss.currentModuleSlug)}
            exitLabel={playerStatus === 'question' ? 'Guardar y salir' : null}
            exitDisabled={isSubmitting || isExiting}
            onExit={playerStatus === 'question' ? handleSaveAndExit : undefined}
            back={(reveal || (asking && canGoBack)) ? { onClick: handleGoBack, disabled: isSubmitting || isExiting } : null}
          />
        )}
      >
        <div className="dk-stage__frame">
        <AnimatePresence mode="wait">
          {playerStatus === 'module_intro' && !reveal && (
            <motion.div
              key={`intro-${introKey}`}
              className="dk-read dk-intro-body"
              variants={reduced ? undefined : moduleIntroVariants}
              initial={reduced ? false : 'initial'}
              animate={reduced ? undefined : 'animate'}
              exit={reduced ? undefined : 'exit'}
            >
              <motion.div
                variants={reduced ? undefined : introStaggerContainer}
                initial={reduced ? false : 'hidden'}
                animate={reduced ? undefined : 'show'}
              >
                {ss.currentModuleOrder != null && ss.totalModules > 0 && (
                  <motion.p className="dk-intro-meta" variants={reduced ? undefined : introStaggerItem}>
                    Módulo {ss.currentModuleOrder} de {ss.totalModules}
                  </motion.p>
                )}
                {introIcon ? (
                  <motion.div
                    className="dk-module-icon-wrap"
                    variants={reduced ? undefined : introIconItem}
                  >
                    <AppIcon name={introIcon} size={28} />
                  </motion.div>
                ) : null}
                <motion.h1 className="dk-intro-title" variants={reduced ? undefined : introStaggerItem}>
                  {moduleDisplayTitle(ss.currentModuleSlug, ss.currentModuleTitle)}
                </motion.h1>
                {ss.currentModuleSlug === 'e-aud-s6' ? (
                  <motion.div className="dk-intro-brooks" variants={reduced ? undefined : introStaggerItem}>
                    <p className="dk-intro-text">
                      La siguiente sección está basada en el trabajo del profesor de Harvard Arthur Brooks. Para las siguientes preguntas, considera esta escala:
                    </p>
                    <ol className="dk-intro-scale">
                      {BROOKS_SCALE.map((label, index) => (
                        <li key={label}>
                          <span>{index + 1}</span>
                          <span>{label}</span>
                        </li>
                      ))}
                    </ol>
                  </motion.div>
                ) : sectionIntro ? (
                  sectionIntro.map((paragraph) => (
                    <motion.p key={paragraph} className="dk-intro-text" variants={reduced ? undefined : introStaggerItem}>
                      {paragraph}
                    </motion.p>
                  ))
                ) : introAddsDetail(ss.currentModuleTitle, ss.currentModuleIntro) ? (
                  <motion.p className="dk-intro-text" variants={reduced ? undefined : introStaggerItem}>
                    {ss.currentModuleIntro}
                  </motion.p>
                ) : null}
                {ss.currentModuleEstimatedMinutes != null && ss.currentModuleEstimatedMinutes > 0 && (
                  <motion.p className="dk-intro-duration" variants={reduced ? undefined : introStaggerItem}>
                    {ss.currentModuleEstimatedMinutes === 1
                      ? '1 minuto'
                      : `${ss.currentModuleEstimatedMinutes} minutos`}
                  </motion.p>
                )}
                <ReviewVersionNote />
              </motion.div>
            </motion.div>
          )}

          {reveal ? (
            <motion.div
              key="shadow-result"
              className="dk-read"
              variants={reduced ? undefined : questionScreenVariants}
              initial={reduced ? false : 'initial'}
              animate={reduced ? undefined : 'animate'}
              exit={reduced ? undefined : 'exit'}
            >
              {reveal.kind === 'cross' ? (
                <DiagnosticCross activities={reveal.activities} step={crossStep} onDraft={setCrossDraft} />
              ) : reveal.kind === 'ocean' ? (
                <FactorResult lines={reveal.lines} />
              ) : (
                <ShadowResult lines={reveal.lines} showNotes />
              )}
            </motion.div>
          ) : null}

          {asking && !reveal && (
            <motion.div
              key={currentQuestion.capture?.kind === 'activity' ? 'ikigai-activities' : currentQuestion.id}
              variants={reduced ? undefined : questionScreenVariants}
              initial={reduced ? false : 'initial'}
              animate={reduced ? undefined : 'animate'}
              exit={reduced ? undefined : 'exit'}
            >
              <QuestionCard
                question={currentQuestion}
                selection={selection}
                onChange={setSelection}
                locked={isSubmitting || isExiting}
                moduleTitle={moduleDisplayTitle(ss.currentModuleSlug, ss.currentModuleTitle)}
                questionIndex={ss.currentQuestionIndex}
                questionTotal={ss.moduleQuestionCount}
                ikigaiMap={ikigaiMapFor(currentQuestion, selection, historyRef.current)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {error ? <p className="dk-player-error" role="alert">{error}</p> : null}
        {leaveUnsaved ? (
          <button type="button" className="dk-exception" onClick={() => router.push('/panel')}>
            Salir sin guardar
          </button>
        ) : null}
        </div>
      </PlayerStage>
    </>
  );
}
