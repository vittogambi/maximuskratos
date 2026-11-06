'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import {
  addPlanEvidence,
  declarePlanAchievement,
  journeyPlans,
  JourneyApiError,
  planAllowsAchievement,
  type PlanRow,
} from '@/lib/journey-api';
import { MemberPage } from '@/components/member/MemberPage';

const EVIDENCE_KINDS = [
  { id: 'DELIVERABLE', label: 'Algo que terminé' },
  { id: 'DECISION', label: 'Una decisión' },
  { id: 'OTHER_PERSON_RESPONSE', label: 'La respuesta de otra persona' },
  { id: 'MEASURE', label: 'Una medida' },
  { id: 'NOTE', label: 'Otro' },
] as const;

export default function PlanLogroPage() {
  const params = useParams<{ planId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const paso = searchParams.get('paso') ?? 'evidencia';

  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceKind, setEvidenceKind] = useState<(typeof EVIDENCE_KINDS)[number]['id']>('DELIVERABLE');
  const [criterionAffirmed, setCriterionAffirmed] = useState(false);
  const [achieved, setAchieved] = useState('');
  const [worked, setWorked] = useState('');
  const [learned, setLearned] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      setMessage('Inicia sesión.');
      return;
    }
    journeyPlans(token)
      .then((rows) => {
        const match = rows.find((row) => row.id === params.planId) ?? null;
        setPlan(match);
        if (!match) setMessage('No encontramos este plan.');
        else if (!planAllowsAchievement(match)) {
          setMessage('Para registrar un logro, primero confirma cómo sabrás que lo lograste.');
        }
      })
      .catch(() => setMessage('No pudimos cargar tu plan. Inténtalo nuevamente.'))
      .finally(() => setLoading(false));
  }, [params.planId]);

  const allowed = plan ? planAllowsAchievement(plan) : false;

  async function submitEvidence() {
    const token = getAccessToken();
    if (!token || !plan || !allowed) return;
    if (!evidenceText.trim()) {
      setMessage('Escribe qué te permite comprobarlo.');
      return;
    }
    if (!criterionAffirmed) {
      setMessage('Confirma que se cumplió el criterio acordado.');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await addPlanEvidence(token, plan.id, {
        kind: evidenceKind,
        status: 'OBSERVED',
        text: evidenceText.trim().slice(0, 600),
        commandKey: `evidence:${plan.id}:${Date.now()}`,
      });
      router.replace(`/planes/${plan.id}/logro?paso=cierre`);
    } catch (err) {
      setMessage(err instanceof JourneyApiError ? err.message : 'No pudimos guardar la evidencia. Inténtalo nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitAchievement() {
    const token = getAccessToken();
    if (!token || !plan || !allowed) return;
    const parts = [achieved.trim(), worked.trim(), learned.trim()].filter(Boolean);
    const learningNote = parts.length
      ? parts.map((text, index) => (index === 0 ? `Conseguí: ${text}` : index === 1 ? `Funcionó: ${text}` : `Aprendí: ${text}`)).join(' ')
      : null;
    setSubmitting(true);
    setMessage(null);
    try {
      await declarePlanAchievement(token, plan.id, {
        confirm: true,
        commandKey: `achievement:${plan.id}`,
        learningNote,
      });
      router.replace(`/planes/${plan.id}/logro?paso=sigue`);
    } catch (err) {
      if (err instanceof JourneyApiError && err.code === 'ACHIEVEMENT_EVIDENCE_REQUIRED') {
        router.replace(`/planes/${plan.id}/logro?paso=evidencia`);
        setMessage(err.message);
      } else if (err instanceof JourneyApiError) {
        setMessage(err.message);
      } else {
        setMessage('No pudimos registrar el logro. Inténtalo nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <MemberPage title="Registrar un logro" intro="Cargando tu plan…">
        <div className="mk-m-skeleton" aria-hidden />
      </MemberPage>
    );
  }

  if (!allowed) {
    return (
      <MemberPage title="Registrar un logro" intro="Este plan aún no puede cerrarse por logro.">
        <p className="mk-m-muted">{message ?? 'Confirma el criterio en el plan.'}</p>
        <Link href={`/planes/${params.planId}`} className="mk-m-link">
          Volver al plan
        </Link>
      </MemberPage>
    );
  }

  if (paso === 'cierre') {
    return (
      <MemberPage title="Cierre del ciclo" intro="Opcional: deja constancia de qué conseguiste. Al registrar el logro, el plan se cerrará.">
        <label className="mk-m-field">
          <span>Qué conseguiste</span>
          <textarea className="mk-m-input" value={achieved} onChange={(e) => setAchieved(e.target.value)} rows={2} />
        </label>
        <label className="mk-m-field">
          <span>Qué funcionó</span>
          <textarea className="mk-m-input" value={worked} onChange={(e) => setWorked(e.target.value)} rows={2} />
        </label>
        <label className="mk-m-field">
          <span>Qué aprendiste</span>
          <textarea className="mk-m-input" value={learned} onChange={(e) => setLearned(e.target.value)} rows={2} />
        </label>
        <button type="button" className="mk-m-btn" disabled={submitting} onClick={() => void submitAchievement()}>
          {submitting ? 'Registrando…' : 'Registrar el logro'}
        </button>
        {message ? <p className="mk-m-muted">{message}</p> : null}
      </MemberPage>
    );
  }

  if (paso === 'sigue') {
    const territory = plan?.territory ?? '';
    return (
      <MemberPage title="Logro registrado" intro="Este ciclo quedó cerrado. La evidencia y el aprendizaje siguen en el plan.">
        <nav className="mk-m-actions">
          <Link href={`/planes/${params.planId}`} className="mk-m-btn">
            Ver el plan cerrado
          </Link>
          <Link href="/memoria" className="mk-m-link">
            Ver el historial
          </Link>
          <Link href={territory ? `/disenar?territorio=${territory}` : '/disenar'} className="mk-m-link">
            Elegir el siguiente cambio
          </Link>
          <Link href="/panel" className="mk-m-link">
            Terminar por ahora
          </Link>
        </nav>
      </MemberPage>
    );
  }

  return (
    <MemberPage title="Registrar un logro" intro="Registras un resultado con evidencia. Al confirmar el logro, este plan se cerrará.">
      {plan?.criterionText?.trim() ? (
        <blockquote className="mk-m-muted">{plan.criterionText.trim()}</blockquote>
      ) : null}
      <fieldset className="mk-m-field">
        <legend>Tipo de evidencia</legend>
        {EVIDENCE_KINDS.map((kind) => (
          <label key={kind.id} className="mk-m-check">
            <input
              type="radio"
              name="evidence-kind"
              checked={evidenceKind === kind.id}
              onChange={() => setEvidenceKind(kind.id)}
            />
            {kind.label}
          </label>
        ))}
      </fieldset>
      <label className="mk-m-field">
        <span>¿Qué te permite comprobarlo?</span>
        <textarea
          className="mk-m-input"
          maxLength={600}
          value={evidenceText}
          onChange={(e) => setEvidenceText(e.target.value)}
          rows={4}
        />
      </label>
      <label className="mk-m-check">
        <input type="checkbox" checked={criterionAffirmed} onChange={(e) => setCriterionAffirmed(e.target.checked)} />
        Se cumplió el criterio acordado
      </label>
      <button type="button" className="mk-m-btn" disabled={submitting} onClick={() => void submitEvidence()}>
        {submitting ? 'Guardando…' : 'Continuar'}
      </button>
      {message ? <p className="mk-m-muted">{message}</p> : null}
    </MemberPage>
  );
}
