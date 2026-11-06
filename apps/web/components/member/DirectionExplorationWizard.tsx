'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { writeDirectionExploreHandoff } from '@/lib/direction-explore-handoff';
import {
  confirmDirectionExploration,
  fetchDirectionExploration,
  saveDirectionExploration,
  type ConfirmableSource,
  type DirectionExplorationDraft,
  type ExplorationStep,
  type ExplorationView,
} from '@/lib/journey-api';
import { DirectionUnknownWelcome } from './DirectionUnknownWelcome';

type Learning = ExplorationView['learning'];

const STEP_LABELS: Record<ExplorationStep, string> = {
  intro: 'Inicio',
  sources: 'Ideas que ya compartiste',
  experience: 'Una experiencia',
  important: 'Lo importante',
  contribution: 'Tu aporte',
  connection: 'La conexión',
  synthesis: 'Lo que compartiste',
  trial: 'Una prueba',
  done: 'Listo',
};

const ALT_PROMPTS = {
  keep: {
    title: '¿Qué te gustaría conservar en tu vida?',
    help: 'Puede ser una rutina, una relación o algo que te da sentido.',
    placeholder: 'Por ejemplo: tiempo de calidad con mi familia los domingos',
  },
  miss: {
    title: '¿Qué echas de menos?',
    help: 'No hace falta una historia larga. Basta con nombrarlo.',
    placeholder: 'Por ejemplo: sentir que aporto algo concreto en el trabajo',
  },
  improve: {
    title: '¿Qué situación te gustaría mejorar?',
    help: 'Piensa en algo pequeño y real, no en resolverlo todo.',
    placeholder: 'Por ejemplo: cómo me organizo cuando hay mucha presión',
  },
} as const;

type Props = {
  onExit: () => void;
  onSavedDirection: () => void;
  /** When true, skip the welcome intro and open the first exploration step. */
  skipIntro?: boolean;
};

function explorationHasProgress(draft: DirectionExplorationDraft): boolean {
  if (draft.step !== 'intro') return true;
  return Boolean(
    draft.experience?.trim()
    || draft.whyImportant?.trim()
    || draft.contribution?.trim()
    || draft.connection?.trim()
    || draft.provisionalDirection?.trim()
    || draft.synthesisEdit?.trim()
    || draft.questionAccepted?.trim(),
  );
}

function progressIndex(step: ExplorationStep, hasSources: boolean): number {
  const order: ExplorationStep[] = hasSources
    ? ['intro', 'sources', 'experience', 'important', 'contribution', 'connection', 'synthesis', 'trial']
    : ['intro', 'experience', 'important', 'contribution', 'connection', 'synthesis', 'trial'];
  const idx = order.indexOf(step);
  return idx >= 0 ? idx + 1 : 1;
}

function progressTotal(hasSources: boolean): number {
  return hasSources ? 8 : 7;
}

function canAdvance(step: ExplorationStep, draft: DirectionExplorationDraft, sources: ConfirmableSource[]): boolean {
  if (step === 'intro') return true;
  if (step === 'sources') {
    return sources.every((row) => {
      const choice = draft.sourceConfirmations?.[row.id];
      return choice === 'yes' || choice === 'edit' || choice === 'skip';
    });
  }
  if (step === 'experience') return Boolean(draft.experience?.trim());
  if (step === 'important') return true;
  if (step === 'contribution') return true;
  if (step === 'connection') return true;
  if (step === 'synthesis') return Boolean(draft.provisionalDirection?.trim());
  if (step === 'trial') return true;
  return true;
}

const RECOGNITION_OPTIONS = [
  { value: 'represents', label: 'Esta conexión tiene sentido para mí' },
  { value: 'partial', label: 'Tiene sentido en parte' },
  { value: 'unseen', label: 'No veo esta conexión' },
  { value: 'reword', label: 'Quiero expresarlo de otra manera' },
] as const;

type Recognition = (typeof RECOGNITION_OPTIONS)[number]['value'];

function SynthesisStep({
  draft,
  synthesis,
  busy,
  onPatch,
  onPersist,
  onSaveCard,
}: {
  draft: DirectionExplorationDraft;
  synthesis: ExplorationView['synthesis'] | undefined;
  busy: boolean;
  onPatch: (patch: Partial<DirectionExplorationDraft>) => void;
  onPersist: (patch: Partial<DirectionExplorationDraft>, next?: ExplorationStep) => void | Promise<void>;
  onSaveCard: (publishDirection: boolean) => void;
}) {
  const recognition = draft.recognition ?? null;
  const pair = synthesis?.pair ?? null;
  const own = synthesis?.ownConnection ?? null;
  const askPair = Boolean(pair && !own && !draft.connectionRejected);
  const phrase = draft.provisionalDirection ?? '';
  const writing = recognition === 'represents' || recognition === 'partial' || recognition === 'reword' || (!askPair && recognition !== 'unseen');
  const contribution = pair?.to.id === 'contribution' ? pair.to.text : '';

  function choose(value: Recognition) {
    void onPersist({
      recognition: value,
      ...(value === 'unseen' ? { provisionalDirection: '', synthesisEdit: '', partialNote: '' } : {}),
    });
  }

  return (
    <section className="mk-dir-exp__panel" aria-labelledby="dir-exp-shared-title">
      <h2 id="dir-exp-shared-title" className="mk-dir-exp__question">Lo que compartiste</h2>
      {synthesis?.shared.length ? (
        <ul className="mk-dir-exp__supports">
          {synthesis.shared.map((row) => (
            <li key={row.id}>
              <span className="mk-m-muted">{row.label}</span>
              <p className="mk-plans-body">{row.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mk-plans-body">Todavía no escribiste respuestas en esta exploración.</p>
      )}

      {own ? (
        <div className="mk-dir-exp__finish-block">
          <h3 className="mk-dir-exp__finish-label">La relación que viste</h3>
          <p className="mk-plans-body">{own}</p>
          <p className="mk-m-field-help">La escribiste tú. No hace falta que la confirmes.</p>
        </div>
      ) : null}

      {askPair && pair ? (
        <div className="mk-dir-exp__finish-block">
          <h3 className="mk-dir-exp__finish-label">Una posible conexión para revisar</h3>
          <p className="mk-plans-body">«{pair.from.text}»</p>
          <p className="mk-plans-body">«{pair.to.text}»</p>
          <p className="mk-m-field-help">{pair.rule}</p>
          <fieldset className="mk-dir-exp__recognition">
            <legend className="mk-m-label">¿Qué te parece?</legend>
            <div className="mk-m-actions">
              {RECOGNITION_OPTIONS.map((row) => (
                <button
                  key={row.value}
                  type="button"
                  className="mk-mx__action"
                  aria-pressed={recognition === row.value}
                  disabled={busy}
                  onClick={() => choose(row.value)}
                >
                  {row.label}
                </button>
              ))}
            </div>
          </fieldset>
          {recognition ? (
            <p className="mk-m-muted">Elegiste: {RECOGNITION_OPTIONS.find((row) => row.value === recognition)?.label}.</p>
          ) : null}
        </div>
      ) : null}

      {!own && !askPair ? (
        <p className="mk-m-callout mk-plans-body">
          {synthesis?.reason === 'REJECTED'
            ? 'Dijiste que no ves relación entre esas respuestas, así que no guardamos ninguna conexión como tuya. Puedes seguir explorando o escribir una dirección con tus propias palabras.'
            : 'Todavía no tenemos suficiente información para proponerte una conexión útil. Puedes seguir explorando o escribir una dirección con tus propias palabras.'}
        </p>
      ) : null}

      {recognition === 'unseen' && askPair ? (
        <div className="mk-dir-exp__finish-block">
          <p className="mk-plans-body">Está bien. Esta conexión no queda guardada como tuya.</p>
          <button type="button" className="mk-mx__textlink" disabled={busy} onClick={() => choose('reword')}>
            Escribir una dirección con mis palabras
          </button>
        </div>
      ) : null}

      {recognition === 'partial' ? (
        <label className="mk-m-label">
          ¿Qué parte sí tiene sentido y qué parte no? (opcional)
          <textarea className="mk-m-textarea" rows={2} value={draft.partialNote ?? ''} onChange={(e) => onPatch({ partialNote: e.target.value })} />
        </label>
      ) : null}

      {writing ? (
        <div className="mk-dir-exp__finish-block">
          <label className="mk-m-label" htmlFor="dir-exp-phrase">Si quieres, escribe con tus palabras la dirección que te gustaría explorar</label>
          <textarea
            id="dir-exp-phrase"
            className="mk-m-textarea"
            rows={3}
            value={phrase}
            onChange={(e) => onPatch({ provisionalDirection: e.target.value, synthesisEdit: e.target.value })}
          />
          {contribution && !phrase.trim() ? (
            <button type="button" className="mk-mx__textlink" onClick={() => onPatch({ provisionalDirection: contribution, synthesisEdit: contribution })}>
              Partir de lo que escribiste sobre lo que te gustaría aportar
            </button>
          ) : null}
          <p className="mk-m-field-help">Puede ser breve. Queda como dirección en exploración, no como una conclusión.</p>
        </div>
      ) : null}

      {recognition || !askPair ? (
        <label className="mk-m-label">
          Una duda que quieras seguir (opcional)
          <textarea className="mk-m-textarea" rows={2} value={draft.openDoubt ?? ''} onChange={(e) => onPatch({ openDoubt: e.target.value })} />
        </label>
      ) : null}

      <div className="mk-m-actions mk-dir-exp__synthesis-actions">
        {phrase.trim() ? (
          <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={busy} onClick={() => onSaveCard(true)}>
            Guardar como dirección en exploración
          </button>
        ) : null}
        {phrase.trim() || draft.openDoubt?.trim() ? (
          <button
            type="button"
            className="mk-mx__action"
            disabled={busy}
            onClick={() => void onPersist({
              provisionalDirection: phrase.trim(),
              recognition: recognition ?? 'reword',
              synthesisChoice: recognition === 'represents' ? 'accept' : 'edit',
            }, 'trial')}
          >
            Pensar en una prueba pequeña
          </button>
        ) : null}
        <button type="button" className="mk-mx__action" disabled={busy} onClick={() => onSaveCard(false)}>
          Guardar la exploración sin dirección
        </button>
        <button type="button" className="mk-mx__action" disabled={busy} onClick={() => void onPersist({ recognition: null }, 'experience')}>
          Seguir explorando
        </button>
      </div>
    </section>
  );
}

function nextStep(step: ExplorationStep, hasSources: boolean): ExplorationStep {
  const order: ExplorationStep[] = hasSources
    ? ['intro', 'sources', 'experience', 'important', 'contribution', 'connection', 'synthesis', 'trial', 'done']
    : ['intro', 'experience', 'important', 'contribution', 'connection', 'synthesis', 'trial', 'done'];
  const idx = order.indexOf(step);
  return order[Math.min(idx + 1, order.length - 1)] ?? 'done';
}

function prevStep(step: ExplorationStep, hasSources: boolean): ExplorationStep {
  const order: ExplorationStep[] = hasSources
    ? ['intro', 'sources', 'experience', 'important', 'contribution', 'connection', 'synthesis', 'trial']
    : ['intro', 'experience', 'important', 'contribution', 'connection', 'synthesis', 'trial'];
  const idx = order.indexOf(step);
  return order[Math.max(idx - 1, 0)] ?? 'intro';
}

function TrialStep({
  draft,
  learning,
  busy,
  onPatch,
  onPersist,
  onSaveCard,
}: {
  draft: DirectionExplorationDraft;
  learning: Learning | null;
  busy: boolean;
  onPatch: (patch: Partial<DirectionExplorationDraft>) => void;
  onPersist: (patch: Partial<DirectionExplorationDraft>, next?: ExplorationStep) => void | Promise<void>;
  onSaveCard: () => void;
  onDesign: () => void;
}) {
  const recognized = learning?.recognized;
  const doubt = draft.openDoubt?.trim() || '';
  const accepted = draft.questionAccepted?.trim() || '';
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [ownQuestion, setOwnQuestion] = useState(false);
  const [questionText, setQuestionText] = useState(accepted || doubt || learning?.question || '');
  const [editingTrial, setEditingTrial] = useState(false);
  const [trialText, setTrialText] = useState(draft.trialAccepted || learning?.trial || '');
  const [observeText, setObserveText] = useState(draft.observeAccepted || learning?.observe || '');

  if (!recognized && !doubt) {
    return (
      <section className="mk-dir-exp__panel" aria-label="Ficha de exploración">
        <h2 className="mk-m-section-title">Todavía no hay algo reconocido</h2>
        <p className="mk-plans-body">Puedes volver a elegir qué te importa, o guardar la ficha. No armo una prueba para completar el recorrido.</p>
        <div className="mk-m-actions">
          <button type="button" className="mk-mx__action" disabled={busy} onClick={() => void onPersist({}, 'synthesis')}>Volver</button>
          <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={busy} onClick={onSaveCard}>Guardar por ahora</button>
        </div>
      </section>
    );
  }

  return (
    <section className="mk-dir-exp__panel" aria-label="Qué quieres comprender">
      <p className="mk-plans-body">De lo que contaste, esto es lo que reconociste como importante: {recognized || doubt}</p>
      {!accepted ? (
        <>
          <h2 className="mk-m-section-title">¿Qué te gustaría descubrir al darle un poco de espacio?</h2>
          {doubt ? (
            <>
              <p className="mk-plans-body">{doubt}</p>
              <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={busy} onClick={() => void onPersist({ questionAccepted: doubt, openDoubt: doubt })}>
                Usar esta duda
              </button>
            </>
          ) : null}
          {!doubt && learning?.question ? (
            <>
              <p className="mk-m-muted">Propuesta de MK</p>
              <p className="mk-plans-body">{editingQuestion || ownQuestion ? '' : learning.question}</p>
              {editingQuestion || ownQuestion ? (
                <textarea className="mk-m-textarea" rows={3} value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
              ) : null}
              <div className="mk-m-actions">
                <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={busy} onClick={() => void onPersist({ questionSuggested: learning.question, questionAccepted: editingQuestion || ownQuestion ? questionText.trim() : learning.question })}>
                  {editingQuestion || ownQuestion ? 'Usar esta versión' : 'Usarla'}
                </button>
                <button type="button" className="mk-mx__action" onClick={() => { setEditingQuestion(true); setOwnQuestion(false); setQuestionText(learning.question || ''); }}>
                  Editarla
                </button>
                <button type="button" className="mk-mx__action" onClick={() => { setOwnQuestion(true); setEditingQuestion(false); setQuestionText(''); }}>
                  Escribir otra
                </button>
                <button type="button" className="mk-mx__action" disabled={busy} onClick={onSaveCard}>Guardar por ahora</button>
              </div>
            </>
          ) : null}
          {!doubt && !learning?.question && learning?.contextual ? (
            <>
              <p className="mk-plans-body">{learning.contextual}</p>
              <textarea className="mk-m-textarea" rows={3} value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
              <div className="mk-m-actions">
                <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={busy || questionText.trim().length < 12} onClick={() => void onPersist({ questionAccepted: questionText.trim() })}>
                  Usar lo que escribí
                </button>
                <button type="button" className="mk-mx__action" disabled={busy} onClick={onSaveCard}>Guardar por ahora</button>
              </div>
            </>
          ) : null}
        </>
      ) : (
        <>
          <h2 className="mk-m-section-title">Una prueba pequeña, si quieres</h2>
          <p className="mk-m-muted">Qué quiero comprender</p>
          <p className="mk-plans-body">{accepted}</p>
          {learning?.trial || editingTrial || trialText.trim() ? (
            <>
              <p className="mk-m-muted">Qué podría probar. No está aceptada hasta que tú lo digas.</p>
              {editingTrial || !learning?.trial ? (
                <textarea className="mk-m-textarea" rows={3} value={trialText} onChange={(e) => setTrialText(e.target.value)} />
              ) : (
                <p className="mk-plans-body">{trialText || learning.trial}</p>
              )}
              <p className="mk-m-muted">Qué observaré después</p>
              {editingTrial || !learning?.trial ? (
                <textarea className="mk-m-textarea" rows={2} value={observeText} onChange={(e) => setObserveText(e.target.value)} />
              ) : (
                <p className="mk-plans-body">{observeText || learning.observe}</p>
              )}
            </>
          ) : (
            <p className="mk-m-callout mk-plans-body">
              Todavía no tenemos una prueba concreta que salga de lo que escribiste. Puedes describir una tú o seguir sin ella.
            </p>
          )}
          <label className="mk-m-label">
            Cuándo quiero volver a mirarlo
            <input className="mk-m-input" value={draft.returnWhen ?? ''} onChange={(e) => onPatch({ returnWhen: e.target.value })} placeholder="Cuando tú lo decidas" />
          </label>
          <div className="mk-m-actions">
            <button
              type="button"
              className="mk-mx__action mk-mx__action--primary"
              disabled={busy || !(editingTrial ? trialText.trim() : (trialText || learning?.trial || '').trim())}
              onClick={() => void onPersist({
                questionSuggested: learning?.question ?? draft.questionSuggested,
                questionAccepted: accepted,
                trialSuggested: learning?.trial ?? null,
                trialAccepted: (editingTrial ? trialText : (trialText || learning?.trial || '')).trim(),
                observeSuggested: learning?.observe ?? null,
                observeAccepted: (editingTrial ? observeText : (observeText || learning?.observe || '')).trim(),
                returnWhen: draft.returnWhen,
                trialChoice: 'accepted',
                trialWhat: (editingTrial ? trialText : (trialText || learning?.trial || '')).trim(),
                trialDiscover: accepted,
                trialObserve: (editingTrial ? observeText : (observeText || learning?.observe || '')).trim(),
              }, 'done')}
            >
              Quiero probarlo
            </button>
            <button type="button" className="mk-mx__action" onClick={() => { setEditingTrial(true); setTrialText(trialText || learning?.trial || ''); setObserveText(observeText || learning?.observe || ''); }}>
              {learning?.trial ? 'Cambiar la propuesta' : 'Escribir una prueba'}
            </button>
            <button type="button" className="mk-mx__action" disabled={busy} onClick={() => void onPersist({ questionAccepted: accepted, trialChoice: 'skipped' }, 'done')}>
              Guardar sin probar
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function SavedExploration({
  draft,
  busy,
  onPatch,
  onPersist,
  onDirection,
  onDesign,
}: {
  draft: DirectionExplorationDraft;
  busy: boolean;
  onPatch: (patch: Partial<DirectionExplorationDraft>) => void;
  onPersist: (patch: Partial<DirectionExplorationDraft>, next?: ExplorationStep) => void | Promise<void>;
  onDirection: () => void;
  onDesign: () => void;
}) {
  const tried = draft.trialChoice === 'accepted';
  const answered = [draft.experience, draft.whyImportant, draft.contribution].filter(Boolean);
  const directionLine = draft.provisionalDirection?.trim() || null;
  const recognitionLine = draft.recognition === 'represents'
    ? 'Dijiste que la conexión entre tus respuestas tiene sentido para ti.'
    : draft.recognition === 'partial'
      ? `Dijiste que la conexión tiene sentido en parte.${draft.partialNote?.trim() ? ` ${draft.partialNote.trim()}` : ''}`
      : draft.recognition === 'unseen'
        ? 'Dijiste que no ves la conexión que pusimos lado a lado. No quedó guardada como tuya.'
        : null;
  return (
    <section className="mk-dir-exp__panel mk-dir-exp__finish" aria-label="Resumen de tu exploración">
      <h2 className="mk-dir-welcome__title">Tu exploración</h2>
      <p className="mk-dir-welcome__lead">
        Esto es lo que quedó registrado. Puedes conservarlo, ajustarlo o llevarlo a Diseñar cuando quieras.
      </p>

      {answered.length > 0 ? (
        <div className="mk-dir-exp__finish-block">
          <h3 className="mk-dir-exp__finish-label">Lo que respondiste</h3>
          <ul className="mk-dir-exp__finish-list">
            {answered.map((line) => (
              <li key={line} className="mk-plans-body">{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {recognitionLine ? <p className="mk-plans-body">{recognitionLine}</p> : null}

      {directionLine ? (
        <div className="mk-dir-exp__finish-block">
          <h3 className="mk-dir-exp__finish-label">{draft.directionPublished ? 'La dirección que guardaste' : 'Una frase que escribiste'}</h3>
          <p className="mk-plans-body">{directionLine}</p>
          <p className="mk-m-field-help">
            {draft.directionPublished
              ? 'Quedó como dirección en exploración, no como una etiqueta definitiva sobre quién eres.'
              : 'Todavía no la guardaste como dirección.'}
          </p>
        </div>
      ) : (
        <div className="mk-dir-exp__finish-block">
          <h3 className="mk-dir-exp__finish-label">Tu dirección</h3>
          <p className="mk-plans-body">Todavía no escribiste una dirección en palabras. No hace falta para seguir.</p>
        </div>
      )}

      {draft.questionAccepted || draft.openDoubt ? (
        <div className="mk-dir-exp__finish-block">
          <h3 className="mk-dir-exp__finish-label">Lo que aún quieres explorar</h3>
          <p className="mk-plans-body">{draft.questionAccepted || draft.openDoubt}</p>
        </div>
      ) : null}

      {tried ? (
        <>
          <p className="mk-m-muted">Prueba que aceptaste</p>
          <p className="mk-plans-body">{draft.trialAccepted || draft.trialWhat}</p>
          <p className="mk-m-muted">Qué observarás</p>
          <p className="mk-plans-body">{draft.observeAccepted || draft.trialObserve}</p>
          {draft.returnWhen ? <p className="mk-plans-body">Vuelves a mirarlo: {draft.returnWhen}</p> : null}
          <div className="mk-m-actions" role="group" aria-label="Cómo te fue con la prueba">
            <button type="button" className="mk-mx__action" aria-pressed={draft.trialFollowup === 'tried'} onClick={() => onPersist({ trialFollowup: 'tried' })}>La probé</button>
            <button type="button" className="mk-mx__action" aria-pressed={draft.trialFollowup === 'not_tried'} onClick={() => onPersist({ trialFollowup: 'not_tried' })}>No la probé</button>
            <button type="button" className="mk-mx__action" aria-pressed={draft.trialFollowup === 'adapted'} onClick={() => onPersist({ trialFollowup: 'adapted' })}>La adapté</button>
          </div>
          {draft.trialFollowup ? (
            <>
              <label className="mk-m-label">
                Qué ocurrió
                <textarea className="mk-m-textarea" rows={2} value={draft.trialHappened ?? ''} onChange={(e) => onPatch({ trialHappened: e.target.value })} />
              </label>
              <label className="mk-m-label">
                Qué quieres conservar o cambiar
                <textarea className="mk-m-textarea" rows={2} value={draft.trialKeep ?? ''} onChange={(e) => onPatch({ trialKeep: e.target.value })} />
              </label>
              {draft.trialFollowup === 'not_tried' ? <p className="mk-m-muted">No haberla probado no es un fracaso ni una deuda.</p> : null}
            </>
          ) : null}
        </>
      ) : (
        <p className="mk-plans-body">Guardaste la ficha sin una prueba.</p>
      )}
      <div className="mk-m-actions">
        <button type="button" className="mk-mx__action" disabled={busy} onClick={() => onPersist({ step: 'done' })}>Conservar lo aprendido</button>
        {tried ? (
          <button type="button" className="mk-mx__action" disabled={busy} onClick={() => onPersist({ step: 'trial', trialChoice: null })}>Ajustar la prueba</button>
        ) : null}
        <button type="button" className="mk-mx__action" disabled={busy} onClick={() => onPersist({ step: 'experience', recognition: null, questionAccepted: null, trialChoice: null, provisionalDirection: '', synthesisEdit: '', directionPublished: false, connection: '', connectionRejected: false })}>Explorar otra duda</button>
        {directionLine && !draft.directionPublished ? (
          <button type="button" className="mk-mx__action" disabled={busy} onClick={onDirection}>Guardar como dirección en exploración</button>
        ) : null}
        <button type="button" className="mk-mx__action" disabled={busy} onClick={onDesign}>Llevar a Diseñar</button>
      </div>
    </section>
  );
}

export function DirectionExplorationWizard({ onExit, onSavedDirection, skipIntro = false }: Props) {
  const [view, setView] = useState<ExplorationView | null>(null);
  const [draft, setDraft] = useState<DirectionExplorationDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const draftRef = useRef<DirectionExplorationDraft | null>(null);
  const skipIntroStarted = useRef(false);

  const load = useCallback(() => {
    const token = getAccessToken();
    if (!token) {
      setError('Inicia sesión para explorar tu dirección.');
      return;
    }
    fetchDirectionExploration(token)
      .then((data) => {
        setView(data);
        setDraft(data.draft);
      })
      .catch(() => setError('No pudimos cargar la exploración. Inténtalo nuevamente.'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sources = view?.sources ?? [];
  const hasSources = sources.length > 0;
  const step = draft?.step ?? 'intro';
  const synthesis = view?.synthesis;
  draftRef.current = draft;

  function patchDraft(patch: Partial<DirectionExplorationDraft>) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      draftRef.current = next;
      return next;
    });
  }

  const experiencePrompt = useMemo(() => {
    if (draft?.altEntry === 'keep') return ALT_PROMPTS.keep;
    if (draft?.altEntry === 'miss') return ALT_PROMPTS.miss;
    if (draft?.altEntry === 'improve') return ALT_PROMPTS.improve;
    return {
      title: 'Recuerda un momento en que sentiste que lo que hacías valía la pena. ¿Qué estabas haciendo?',
      help: 'Empieza por algo concreto. No hace falta que suene a propósito.',
      placeholder: 'Por ejemplo: ayudé a un compañero a entender un problema',
    };
  }, [draft?.altEntry]);

  async function persist(patch: Partial<DirectionExplorationDraft>, next?: ExplorationStep) {
    const token = getAccessToken();
    const base = draftRef.current;
    if (!token || !base) return;
    setBusy(true);
    setError(null);
    setSavedNotice(null);
    try {
      const merged = { ...base, ...patch, ...(next ? { step: next } : {}) };
      const data = await saveDirectionExploration(token, merged);
      setView(data);
      setDraft(data.draft);
      draftRef.current = data.draft;
      setSavedNotice('Progreso guardado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar. Inténtalo nuevamente.');
    } finally {
      setBusy(false);
    }
  }

  async function goNext() {
    const current = draftRef.current;
    if (!current) return;
    if (step === 'contribution' && !current.contribution?.trim()) {
      setError('Escribe qué te gustaría aportar o cuidar, aunque sea en una frase breve.');
      return;
    }
    if (step === 'important' && !current.whyImportant?.trim()) {
      await persist({ whyImportant: '' }, nextStep(step, hasSources));
      return;
    }
    if (step === 'synthesis') return;
    await persist({}, nextStep(step, hasSources));
  }

  async function goBack() {
    if (!draft || step === 'intro') return;
    await persist({}, prevStep(step, hasSources));
  }

  async function startExploring() {
    const next = hasSources ? 'sources' : 'experience';
    await persist({ step: next, altEntry: null });
  }

  useEffect(() => {
    if (!skipIntro || !draft || draft.step !== 'intro' || busy || skipIntroStarted.current) return;
    skipIntroStarted.current = true;
    void startExploring();
  }, [skipIntro, draft, busy]);

  function requestExit() {
    const current = draftRef.current;
    if (current && explorationHasProgress(current)) {
      setExitOpen(true);
      return;
    }
    onExit();
  }

  async function saveExplorationCard(publishDirection: boolean) {
    const token = getAccessToken();
    if (!token || !draft) return;
    setBusy(true);
    setError(null);
    try {
      if (publishDirection) {
        const statement = draft.provisionalDirection?.trim() ?? '';
        if (!statement) {
          setError('Escribe con tus palabras la dirección que quieres guardar.');
          return;
        }
        await confirmDirectionExploration(token, {
          statement,
          commandKey: crypto.randomUUID(),
          draft: { ...draft, provisionalDirection: statement, recognition: draft.recognition ?? 'reword' },
        });
        setSavedNotice('Dirección guardada en exploración. No es un plan.');
        onSavedDirection();
      }
      await persist({
        step: 'done',
        openDoubt: draft.openDoubt,
        partialNote: draft.partialNote,
        provisionalDirection: draft.provisionalDirection?.trim() ?? '',
        directionPublished: publishDirection,
        ...(publishDirection ? { recognition: draft.recognition ?? 'reword' } : {}),
      });
      if (!publishDirection) setSavedNotice('Exploración guardada, sin prueba y sin dirección publicada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar. Inténtalo nuevamente.');
    } finally {
      setBusy(false);
    }
  }

  function goToDesign() {
    writeDirectionExploreHandoff({
      statement: '',
      desiredChange: draft?.questionAccepted?.trim() || null,
      trialWhat: draft?.trialAccepted?.trim() || draft?.trialWhat?.trim(),
      trialDiscover: draft?.questionAccepted?.trim(),
      trialObserve: draft?.observeAccepted?.trim() || draft?.trialObserve?.trim(),
    });
    window.location.assign('/disenar');
  }

  if (error && !view) {
    return (
      <div className="mk-m-page">
        <p className="mk-m-error">{error}</p>
        <button type="button" className="mk-mx__action" onClick={load}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!view || !draft) {
    return (
      <div className="mk-m-page" aria-busy="true">
        <div className="mk-mx-skeleton"><span /><span /></div>
      </div>
    );
  }

  const progress = progressIndex(step, hasSources);
  const total = progressTotal(hasSources);

  return (
    <div className="mk-m-page mk-dir-exp">
      <header className="mk-dir-exp__header">
        {step === 'intro' ? (
          <h1 className="mk-m-title">Tu dirección</h1>
        ) : (
          <>
            <p className="mk-m-eyebrow">Exploración guiada</p>
            <p className="mk-dir-exp__progress" aria-live="polite">
              Paso {progress} de {total}
              <span className="mk-dir-exp__progress-sep" aria-hidden>
                {' '}
                ·{' '}
              </span>
              <span className="mk-dir-exp__progress-step">{STEP_LABELS[step]}</span>
            </p>
          </>
        )}
        <button type="button" className="mk-mx__textlink mk-dir-exp__change-mode" onClick={requestExit}>
          Elegir otra forma de empezar
        </button>
      </header>

      {step === 'intro' && !skipIntro ? (
        <DirectionUnknownWelcome
          variant="wizard"
          busy={busy}
          onPrimary={() => void startExploring()}
          onSecondary={requestExit}
        />
      ) : null}

      {step === 'intro' && skipIntro ? (
        <div className="mk-dir-exp__panel" aria-busy="true">
          <p className="mk-m-muted">Preparando la exploración…</p>
        </div>
      ) : null}

      {step === 'sources' ? (
        <section className="mk-dir-exp__panel">
          <h2 className="mk-dir-exp__question">¿Sigue representándote?</h2>
          <p className="mk-plans-body">
            Esto viene de respuestas que ya guardaste. Puedes usarlo, ajustarlo o dejarlo fuera.
          </p>
          <ul className="mk-dir-exp__sources">
            {sources.map((row) => {
              const choice = draft.sourceConfirmations?.[row.id];
              const editing = choice === 'edit';
              return (
                <li key={row.id} className="mk-dir-exp__source">
                  <p className="mk-m-muted">{row.origin}</p>
                  <p className="mk-plans-body">{row.text}</p>
                  <div className="mk-dir-exp__source-actions">
                    <button
                      type="button"
                      className={`mk-mx__action${choice === 'yes' ? ' is-selected' : ''}`}
                      onClick={() => setDraft((prev) => prev && ({
                        ...prev,
                        sourceConfirmations: { ...prev.sourceConfirmations, [row.id]: 'yes' },
                      }))}
                    >
                      Sí, me representa
                    </button>
                    <button
                      type="button"
                      className={`mk-mx__action${choice === 'edit' ? ' is-selected' : ''}`}
                      onClick={() => setDraft((prev) => prev && ({
                        ...prev,
                        sourceConfirmations: { ...prev.sourceConfirmations, [row.id]: 'edit' },
                        sourceEdits: { ...prev.sourceEdits, [row.id]: prev.sourceEdits?.[row.id] ?? row.text },
                      }))}
                    >
                      Quiero cambiarla
                    </button>
                    <button
                      type="button"
                      className={`mk-mx__action${choice === 'skip' ? ' is-selected' : ''}`}
                      onClick={() => setDraft((prev) => prev && ({
                        ...prev,
                        sourceConfirmations: { ...prev.sourceConfirmations, [row.id]: 'skip' },
                      }))}
                    >
                      Dejarla fuera
                    </button>
                  </div>
                  {editing ? (
                    <textarea
                      className="mk-m-textarea"
                      rows={2}
                      value={draft.sourceEdits?.[row.id] ?? row.text}
                      onChange={(e) => setDraft((prev) => prev && ({
                        ...prev,
                        sourceEdits: { ...prev.sourceEdits, [row.id]: e.target.value },
                      }))}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {step === 'experience' ? (
        <section className="mk-dir-exp__panel mk-dir-exp__step">
          <h2 className="mk-dir-exp__question">{experiencePrompt.title}</h2>
          <p className="mk-m-field-help">{experiencePrompt.help}</p>
          <textarea
            className="mk-m-textarea"
            rows={4}
            value={draft.experience ?? ''}
            placeholder={experiencePrompt.placeholder}
            onChange={(e) => patchDraft({ experience: e.target.value })}
          />
          <div className="mk-dir-exp__alt">
            <p className="mk-m-muted">Si no recuerdas un momento, prueba otra entrada:</p>
            <div className="mk-m-actions">
              {(['keep', 'miss', 'improve'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className={`mk-mx__action${draft.altEntry === kind ? ' is-selected' : ''}`}
                  onClick={() => setDraft((prev) => prev && { ...prev, altEntry: kind, experience: '' })}
                >
                  {kind === 'keep' ? 'Algo que conservar' : kind === 'miss' ? 'Algo que echo de menos' : 'Algo a mejorar'}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {step === 'important' ? (
        <section className="mk-dir-exp__panel">
          <h2 className="mk-dir-exp__question">¿Qué hizo que ese momento fuera importante para ti?</h2>
          <p className="mk-m-field-help">Identifica qué valoraste, no lo que “deberías” sentir.</p>
          <textarea
            className="mk-m-textarea"
            rows={3}
            value={draft.whyImportant ?? ''}
            placeholder="Por ejemplo: me importó que después pudiera resolverlo solo"
            onChange={(e) => patchDraft({ whyImportant: e.target.value })}
          />
          <button
            type="button"
            className="mk-mx__textlink"
            onClick={() => void persist({ whyImportant: '' }, nextStep(step, hasSources))}
          >
            Prefiero no responder esto ahora
          </button>
        </section>
      ) : null}

      {step === 'contribution' ? (
        <section className="mk-dir-exp__panel">
          <h2 className="mk-dir-exp__question">
            ¿Qué te gustaría aportar, cuidar o hacer posible para otras personas o tu entorno?
          </h2>
          <textarea
            className="mk-m-textarea"
            rows={3}
            value={draft.contribution ?? ''}
            placeholder="Por ejemplo: querría hacer eso con personas que están empezando"
            onChange={(e) => patchDraft({ contribution: e.target.value })}
          />
        </section>
      ) : null}

      {step === 'connection' ? (
        <section className="mk-dir-exp__panel">
          <h2 className="mk-dir-exp__question">
            ¿Qué relación encuentras entre lo que viviste y lo que te gustaría aportar?
          </h2>
          {synthesis?.pair ? (
            <ul className="mk-dir-exp__supports">
              <li>
                <span className="mk-m-muted">{synthesis.pair.from.label}</span>
                <p className="mk-plans-body">{synthesis.pair.from.text}</p>
              </li>
              <li>
                <span className="mk-m-muted">{synthesis.pair.to.label}</span>
                <p className="mk-plans-body">{synthesis.pair.to.text}</p>
              </li>
            </ul>
          ) : (
            <p className="mk-m-field-help">Con lo que escribiste hasta aquí no hay dos respuestas que poner lado a lado. Puedes escribir igual lo que veas, o seguir.</p>
          )}
          <label className="mk-m-label" htmlFor="dir-exp-connection">Si ves una relación, escríbela con tus palabras (opcional)</label>
          <textarea
            id="dir-exp-connection"
            className="mk-m-textarea"
            rows={3}
            value={draft.connection ?? ''}
            onChange={(e) => patchDraft({ connection: e.target.value, connectionRejected: false })}
          />
          {synthesis?.pair ? (
            <button
              type="button"
              className="mk-mx__action"
              aria-pressed={Boolean(draft.connectionRejected)}
              onClick={() => patchDraft({ connection: '', connectionRejected: !draft.connectionRejected })}
            >
              No veo relación entre estas respuestas
            </button>
          ) : null}
        </section>
      ) : null}

      {step === 'synthesis' ? (
        <SynthesisStep
          draft={draft}
          synthesis={synthesis}
          busy={busy}
          onPatch={patchDraft}
          onPersist={(patch, next) => persist(patch, next)}
          onSaveCard={(publish) => void saveExplorationCard(publish)}
        />
      ) : null}

      {step === 'trial' ? (
        <TrialStep
          draft={draft}
          learning={view?.learning ?? null}
          busy={busy}
          onPatch={patchDraft}
          onPersist={(patch, next) => persist(patch, next)}
          onSaveCard={() => void saveExplorationCard(false)}
          onDesign={() => goToDesign()}
        />
      ) : null}

      {step === 'done' ? (
        <SavedExploration
          draft={draft}
          busy={busy}
          onPatch={patchDraft}
          onPersist={(patch, next) => persist(patch, next)}
          onDirection={() => void saveExplorationCard(true)}
          onDesign={() => goToDesign()}
        />
      ) : null}

      {error ? <p className="mk-m-error" role="alert">{error}</p> : null}
      {savedNotice ? <p className="mk-m-success" role="status">{savedNotice}</p> : null}

      {step !== 'intro' && step !== 'synthesis' && step !== 'trial' && step !== 'done' ? (
        <div className="mk-m-actions mk-dir-exp__nav" role="navigation" aria-label="Pasos de la exploración">
          <button type="button" className="mk-mx__action mk-dir-exp__nav-back" disabled={busy} onClick={() => void goBack()}>
            Anterior
          </button>
          <button
            type="button"
            className="mk-mx__action mk-mx__action--primary mk-dir-exp__nav-next"
            disabled={busy || !canAdvance(step, draftRef.current ?? draft, sources)}
            onClick={() => void goNext()}
          >
            Continuar
          </button>
        </div>
      ) : null}

      {exitOpen ? (
        <div className="mk-m-modal" role="dialog" aria-labelledby="dir-exp-exit-title">
          <div className="mk-m-modal__panel">
            <h2 id="dir-exp-exit-title">¿Elegir otra forma de empezar?</h2>
            <p className="mk-plans-body">
              Tu progreso en esta exploración ya está guardado en el servidor. Puedes volver al selector de modos y retomarlo más tarde.
            </p>
            <div className="mk-week-task__actions">
              <button type="button" className="mk-mx__action mk-mx__action--primary" onClick={() => { setExitOpen(false); onExit(); }}>
                Ir al selector
              </button>
              <button type="button" className="mk-mx__action" onClick={() => setExitOpen(false)}>
                Seguir explorando
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
