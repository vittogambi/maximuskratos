'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { clearDirectionExploreHandoff, readDirectionExploreHandoff } from '@/lib/direction-explore-handoff';
import { patchDesign, type DesignView, type ResultMode } from '@/lib/intervention-api';
import { HORIZON_OPTIONS, weeksLabel } from '@/lib/plan-design';

type Props = { design: DesignView; onSaved: (view: DesignView) => void; onBack: () => void };

export function StepResult({ design, onSaved, onBack }: Props) {
  const saved = design.result;
  const [mode, setMode] = useState<ResultMode | null>(saved.mode);
  const [sought, setSought] = useState(saved.soughtOutcome ?? '');
  const [criterion, setCriterion] = useState(saved.criterion ?? '');
  const [evidence, setEvidence] = useState(saved.evidenceHint ?? '');
  const [horizon, setHorizon] = useState(saved.horizonWeeks);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (saved.saved) return;
    const handoff = readDirectionExploreHandoff();
    if (!handoff?.trialDiscover?.trim()) return;
    setMode('EXPLORATION');
    setSought((current) => current || handoff.trialDiscover!.trim());
    setCriterion((current) => current || handoff.trialObserve?.trim() || '');
  }, [saved.saved]);

  function choose(next: ResultMode) {
    if (next === mode) return;
    setMode(next);
    if (saved.mode !== next) {
      setSought('');
      setCriterion('');
    }
  }

  async function save() {
    const token = getAccessToken();
    if (!token || !mode) return;
    const exploring = mode === 'EXPLORATION';
    if (!sought.trim()) {
      setError(exploring ? 'Describe qué te gustaría explorar.' : 'Describe qué resultado te gustaría alcanzar en este ciclo.');
      return;
    }
    if (!criterion.trim()) {
      setError(exploring ? 'Escribe qué te gustaría aprender al terminar el ciclo.' : 'Explica cómo sabrás que alcanzaste ese resultado.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const view = await patchDesign(token, design.territory, design.planId, {
        section: 'result',
        mode,
        soughtOutcome: sought.trim(),
        criterion: criterion.trim(),
        evidenceHint: exploring ? null : evidence.trim() || null,
        horizonWeeks: horizon,
      });
      clearDirectionExploreHandoff();
      onSaved(view);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar. Lo que escribiste sigue aquí.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mk-ds-proposal">
      <div>
        <h2 className="mk-ds-question">¿Qué te gustaría conseguir con este cambio?</h2>
        <p className="mk-ds-help">Tu cambio: {design.change.text}</p>
      </div>
      <fieldset className="mk-ds-choices">
        <legend className="mk-dp-legend">¿Tienes claro qué resultado quieres alcanzar?</legend>
        <label className={mode === 'RESULT' ? 'is-selected' : undefined}>
          <input type="radio" name="result-mode" checked={mode === 'RESULT'} onChange={() => choose('RESULT')} />
          <span>
            <strong>Sé qué quiero conseguir</strong>
            <small>Defines un resultado y cómo vas a reconocerlo.</small>
          </span>
        </label>
        <label className={mode === 'EXPLORATION' ? 'is-selected' : undefined}>
          <input type="radio" name="result-mode" checked={mode === 'EXPLORATION'} onChange={() => choose('EXPLORATION')} />
          <span>
            <strong>Todavía quiero explorar</strong>
            <small>Defines qué vas a probar y qué quieres aprender. Al revisar anotas lo aprendido, no un resultado conseguido.</small>
          </span>
        </label>
      </fieldset>

      {mode === 'RESULT' ? (
        <>
          <label className="mk-ds-field">
            ¿Qué te gustaría que fuera diferente al terminar este ciclo?
            <textarea rows={2} maxLength={500} value={sought} onChange={(event) => setSought(event.target.value)} />
            <small>Algo que pueda pasar en pocas semanas. Si es una meta grande, elige el primer tramo.</small>
          </label>
          <label className="mk-ds-field">
            ¿Cómo sabrás que lo conseguiste?
            <textarea rows={2} maxLength={500} value={criterion} onChange={(event) => setCriterion(event.target.value)} />
            <small>Algo que puedas ver o contar. No hace falta un número.</small>
          </label>
          <label className="mk-ds-field">
            ¿Qué podría ayudarte a comprobarlo? (opcional)
            <input maxLength={500} value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Ej.: el comprobante, una foto, lo que me diga otra persona" />
          </label>
          <p className="mk-ds-need">Completar las acciones no demuestra por sí solo que lograste el resultado. Por eso lo revisamos aparte.</p>
        </>
      ) : null}

      {mode === 'EXPLORATION' ? (
        <>
          <label className="mk-ds-field">
            ¿Qué quieres explorar?
            <textarea rows={2} maxLength={500} value={sought} onChange={(event) => setSought(event.target.value)} placeholder="Ej.: ¿qué tipo de ejercicio disfruto lo suficiente para repetirlo?" />
          </label>
          <label className="mk-ds-field">
            ¿Qué te gustaría haber aprendido al terminar?
            <textarea rows={2} maxLength={500} value={criterion} onChange={(event) => setCriterion(event.target.value)} placeholder="Ej.: cuál de dos opciones quiero seguir" />
          </label>
        </>
      ) : null}

      {mode ? (
        <label className="mk-ds-field">
          ¿Cuándo quieres revisar tu avance?
          <select value={horizon} onChange={(event) => setHorizon(Number(event.target.value))}>
            {HORIZON_OPTIONS.map((weeks) => <option key={weeks} value={weeks}>En {weeksLabel(weeks)}</option>)}
          </select>
          <small>Es el momento de mirar si la estrategia te sirve. No es una promesa de resultado.</small>
        </label>
      ) : null}

      {error ? <p className="mk-ds-error" role="alert">{error}</p> : null}
      {!mode ? <p className="mk-ds-need">Elige si buscas un resultado concreto o si quieres explorar.</p> : null}
      <div className="mk-ds-foot">
        <button type="button" className="mk-mx__action" onClick={onBack}>Anterior</button>
        <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={busy || !mode} onClick={() => void save()}>
          {busy ? 'Guardando' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
