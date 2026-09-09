'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { LabCard, Skeleton } from '@/components/admin/lab/primitives';
import {
  labApi,
  type LabCandidateList,
  type LabCaseRow,
  type LabQuestionBankRow,
  type LabReviewAgenda,
  type LabRuleCoverage,
} from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';

const RESIDUE = /^(prueba|probe|mm|qa manual)/i;

function scenarioKey(label: string) {
  return label.replace(/\s+\d+$/, '').trim().toLowerCase();
}

export default function LabTechPage() {
  const [bank, setBank] = useState<{ questions: LabQuestionBankRow[]; without_role: number; without_current_consumer: number; broken_config: number } | null>(null);
  const [coverage, setCoverage] = useState<LabRuleCoverage | null>(null);
  const [cases, setCases] = useState<LabCaseRow[] | null>(null);
  const [versions, setVersions] = useState<LabCandidateList | null>(null);
  const [agenda, setAgenda] = useState<LabReviewAgenda | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      labApi.questionBank(),
      labApi.ruleCoverage(),
      labApi.cases(),
      labApi.candidates(),
      labApi.reviewAgenda(),
    ])
      .then(([nextBank, nextCoverage, nextCases, nextVersions, nextAgenda]) => {
        setBank({
          questions: nextBank.questions,
          without_role: nextBank.without_role ?? nextBank.without_function ?? 0,
          without_current_consumer: nextBank.without_current_consumer ?? 0,
          broken_config: nextBank.broken_config ?? 0,
        });
        setCoverage(nextCoverage);
        setCases(nextCases);
        setVersions(nextVersions);
        setAgenda(nextAgenda);
      })
      .catch((err) => setError(humanError(err, 'No pudimos cargar los detalles técnicos.').message));
  }, []);

  const qa = coverage?.rows.filter((item) => item.kind === 'qa') ?? [];
  const qaCovered = qa.filter((item) => item.status === 'covered').length;
  const sandboxGroups = new Set(
    (cases ?? [])
      .filter((item) => !item.casebook_key)
      .map((item) => scenarioKey(item.label)),
  ).size;
  const residueNote = (cases ?? []).some((item) => RESIDUE.test(item.label))
    ? 'Incluye corridos auxiliares de desarrollo.'
    : null;

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <h1 className="admin-page-header__title">Detalles técnicos</h1>
        <p className="lab-lead">Material de construcción. No forma parte del recorrido de revisión.</p>
      </header>
      {error ? <p className="lab-error">{error}</p> : null}
      {!bank || !coverage ? (
        <Skeleton lines={8} />
      ) : (
        <div className="lab-stack">
          <LabCard title="Banco de preguntas">
            <p className="lab-lead">
              {bank.questions.length} preguntas. {bank.without_role} sin rol. {bank.without_current_consumer} sin
              consumidor actual. {bank.broken_config} configuraciones rotas
            </p>
            <Link href="/admin/lab/questions/bank">Abrir banco</Link>
          </LabCard>
          <LabCard title="QA y cobertura">
            <p className="lab-lead">
              {qaCovered} / {qa.length} checks
            </p>
            <Link href="/admin/lab/coverage">Ver detalle técnico</Link>
          </LabCard>
          <LabCard title="Material original y procedencia">
            <p>Excel → Matriz v2 → refinamientos</p>
            <p className="lab-muted">{agenda?.legacy_catalogs?.length ?? 0} elementos en el inventario original.</p>
            <Link href="/admin/lab/maintenance/provenance">Ver procedencia</Link>
          </LabCard>
          <LabCard title="Sandbox">
            <p className="lab-lead">{sandboxGroups} corridos auxiliares</p>
            {residueNote ? <p className="lab-muted">{residueNote}</p> : null}
            <Link href="/admin/lab/sandbox">Abrir sandbox</Link>
          </LabCard>
          <LabCard title="Versiones">
            <p>Matriz v2 actual</p>
            <p className="lab-muted">
              {versions?.candidates.length ? `${versions.candidates.length} candidata(s) en prueba.` : 'No hay cambios aceptados para una nueva versión.'}
            </p>
            <Link href="/admin/lab/versions">Ver versiones</Link>
          </LabCard>
          <LabCard title="Próxima fase">
            <p>Separar el ámbito prioritario del diagnóstico del foco de intervención</p>
            <p className="lab-muted">Se revisará al comenzar el Motor de Intervención.</p>
          </LabCard>
        </div>
      )}
    </div>
  );
}
