'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CaseCard } from '@/components/admin/lab/case-card';
import { DirectionPairCompare } from '@/components/admin/lab/direction-pair-compare';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { PairCompare } from '@/components/admin/lab/pair-compare';
import { ReviewSaved } from '@/components/admin/lab/step-close';
import { LabCard, Skeleton } from '@/components/admin/lab/primitives';
import { labApi, type LabCaseRow, type LabFamilyRow, type LabPairCompare, type LabReviewAgenda } from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';
import { FAMILY_VERDICT_OPTIONS } from '@/lib/lab-ui/labels';
import { bothFamilyCasesReviewed, directionPairVisible, isDirectionCompareFamily } from '@/lib/lab-ui/direction-compare';

export default function LabFamilyPage() {
  const { familyId } = useParams<{ familyId: string }>();
  const [cases, setCases] = useState<LabCaseRow[] | null>(null);
  const [family, setFamily] = useState<LabFamilyRow | null>(null);
  const [pair, setPair] = useState<LabPairCompare | null>(null);
  const [agenda, setAgenda] = useState<LabReviewAgenda | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [justClosed, setJustClosed] = useState(false);

  useEffect(() => {
    Promise.all([labApi.cases(), labApi.sessionProgress(), labApi.reviewAgenda()])
      .then(([rows, progress, nextAgenda]) => {
        const next = (progress.families ?? []).find((item) => item.id === familyId) ?? null;
        setFamily(next);
        setCases(rows);
        setAgenda(nextAgenda);
        const runId =
          next?.next_run_id ??
          rows.find((item) => item.casebook_key && next?.keys.includes(item.casebook_key))?.latest_run?.id;
        if (!next?.compare || !runId) return undefined;
        if (isDirectionCompareFamily(next) && !bothFamilyCasesReviewed(rows, next)) return undefined;
        return labApi.pairCompare(runId).then(setPair);
      })
      .catch((err) => setError(humanError(err, 'No pudimos cargar esta prueba.').message));
  }, [familyId]);

  const members = (cases ?? []).filter((item) => item.casebook_key && family?.keys.includes(item.casebook_key));
  const pairReady = Boolean(family?.compare && pair?.available);
  const casesClosed =
    members.length > 0 && members.every((item) => item.family_reviews?.[familyId]?.case_done);
  const directionTest = isDirectionCompareFamily(family);
  const showDefaultPair = Boolean(family && !directionTest && pairReady);
  const showDirectionPair = Boolean(family && directionPairVisible(casesClosed, pairReady));
  const canClosePair = pairReady && casesClosed;
  const familyResolved = Boolean(
    family && ['Validada', 'Con hallazgo', 'Necesita evidencia'].includes(family.status),
  );
  const showConclusion = family?.verdict_at === 'pair' && canClosePair && !familyResolved;
  const nextExit =
    agenda && familyResolved && agenda.next.href !== `/admin/lab/families/${familyId}`
      ? {
          primary: { href: agenda.next.href, label: 'Continuar con la siguiente revisión' },
          secondary: { href: '/admin/lab', label: 'Volver al Lab' },
        }
      : null;

  const conclusionButtons = (
    <div className="lab-actions">
      {FAMILY_VERDICT_OPTIONS.map((item) => (
        <button
          key={item.value}
          type="button"
          className={item.value === 'REPRESENTS' ? 'lab-btn' : 'lab-btn lab-btn--ghost'}
          disabled={busy}
          onClick={() => void decide(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  async function decide(verdict: string) {
    setBusy(true);
    try {
      const runs = members.map((item) => item.latest_run?.id).filter(Boolean) as string[];
      for (const runId of runs) {
        await labApi.patchReviewVerdict(runId, {
          case_verdict: verdict,
          family_id: familyId,
          pair_conclusion: true,
        });
      }
      const [rows, progress, nextAgenda] = await Promise.all([
        labApi.cases(),
        labApi.sessionProgress(),
        labApi.reviewAgenda(),
      ]);
      setCases(rows);
      setFamily((progress.families ?? []).find((item) => item.id === familyId) ?? family);
      setAgenda(nextAgenda);
      setJustClosed(true);
    } catch (err) {
      setError(humanError(err, 'No pudimos guardar la conclusión.').message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <Link className="lab-btn lab-btn--ghost" href="/admin/lab">
          Volver a Revisión
        </Link>
        <p className="lab-eyebrow">Prueba</p>
        <h1 className="admin-page-header__title">{family?.label ?? 'Prueba'}</h1>
        {family?.intro
          ? family.intro.split('\n\n').map((paragraph, index) => (
              <p key={paragraph} className={index === 0 ? 'lab-lead' : undefined}>
                {paragraph}
              </p>
            ))
          : (
            <p className="lab-lead">{family?.question ?? family?.intent}</p>
          )}
      </header>
      {error ? (
        <div className="lab-alert lab-alert--danger">
          <p className="lab-alert__title">{error}</p>
        </div>
      ) : null}
      {!family || !cases ? (
        <Skeleton lines={6} />
      ) : family.needs_fixture ? (
        <p className="lab-muted">Esta prueba todavía no tiene un perfil cargado. Aparece en Cobertura de reglas.</p>
      ) : (
        <div className="lab-stack">
          {family.verdict_at !== 'pair' ? (
            <p className="lab-muted">
              {family.reviewed} de {family.total} casos revisados.
              {family.total > 1
                ? ' Para cerrar esta prueba, revisa todos los casos.'
                : ' La conclusión del caso cierra la prueba.'}
            </p>
          ) : !directionTest && !pairReady ? (
            <p className="lab-muted">Para cerrar esta prueba, revisa los casos de abajo y luego la comparación.</p>
          ) : null}
          {showDefaultPair ? (
            <PairCompare pair={pair!} title="Comparar los dos casos" showQuestion={false} />
          ) : null}
          {showConclusion && !directionTest ? (
            <LabCard title={family.question || family.review_prompt || 'Conclusión de la prueba'}>
              {conclusionButtons}
            </LabCard>
          ) : null}
          {justClosed && nextExit && !directionTest ? (
            <ReviewSaved exit={nextExit} />
          ) : nextExit && !directionTest ? (
            <div className="lab-actions">
              <Link className="lab-btn" href={nextExit.primary.href}>
                {nextExit.primary.label}
              </Link>
              <Link className="lab-btn lab-btn--ghost" href={nextExit.secondary.href}>
                {nextExit.secondary.label}
              </Link>
            </div>
          ) : null}
          {members.map((item) => (
            <CaseCard
              key={item.id}
              item={item}
              compactActions
              familyId={familyId}
              reviewLabel={
                directionTest
                  ? item.family_reviews?.[familyId]?.case_done
                    ? 'Revisada'
                    : 'Pendiente'
                  : undefined
              }
            />
          ))}
          {showDirectionPair && pair ? (
            <DirectionPairCompare
              pair={pair}
              question={
                family.question ||
                '¿Te parece correcto que estas diferencias sobre hacia dónde quiere ir Benjamín se conserven sin modificar su diagnóstico?'
              }
            >
              {showConclusion ? conclusionButtons : null}
            </DirectionPairCompare>
          ) : null}
          {justClosed && nextExit && directionTest ? (
            <ReviewSaved exit={nextExit} />
          ) : nextExit && directionTest && !justClosed ? (
            <div className="lab-actions">
              <Link className="lab-btn" href={nextExit.primary.href}>
                {nextExit.primary.label}
              </Link>
              <Link className="lab-btn lab-btn--ghost" href={nextExit.secondary.href}>
                {nextExit.secondary.label}
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
