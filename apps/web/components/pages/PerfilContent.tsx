'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { ReviewVersionNote } from '@/components/app-shell/ReviewVersionNote';
import { ExcelProfile } from '@/components/profile/ExcelProfile';
import { SystemReport } from '@/components/profile/SystemReport';
import { apiDiagnosticProfile, apiDiagnosticProgress, type DiagnosticProgressDto, type MasterProfileDto } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { journeyState, type AlignmentReading, type JourneyState } from '@/lib/journey-api';
import { getArchetype } from '@/lib/archetypes';
import { canUseMemberProduct } from '@/lib/member-access';

const DIAGNOSTIC_IN_PROGRESS_STEPS = new Set([
  'TERMS_PENDING',
  'DIAGNOSTICO_BIENVENIDA',
  'FASE1_EN_CURSO',
]);

function isDiagnosticStarted(
  step: string | undefined,
  progress: DiagnosticProgressDto | null,
): boolean {
  if (step && DIAGNOSTIC_IN_PROGRESS_STEPS.has(step)) return true;
  if (!progress) return false;
  if (progress.completionPct > 0) return true;
  return progress.modules.some(
    (m) =>
      m.status === 'IN_PROGRESS' ||
      m.status === 'COMPLETE' ||
      m.answeredQuestions > 0,
  );
}

export function PerfilContent() {
  const { status, user } = useAuthSession();
  const [profile, setProfile] = useState<MasterProfileDto>(null);
  const [diagnosticStarted, setDiagnosticStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [alignment, setAlignment] = useState<AlignmentReading | null>(null);
  const [indexes, setIndexes] = useState<JourneyState['indexes']>(undefined);
  const [alignmentError, setAlignmentError] = useState(false);
  const [indexesError, setIndexesError] = useState(false);
  const [sheetSigned, setSheetSigned] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }

    async function load() {
      try {
        const [p, progress, journey] = await Promise.all([
          apiDiagnosticProfile(token!),
          apiDiagnosticProgress(token!).catch(() => null),
          journeyState(token!).then((row) => row).catch(() => null),
        ]);
        setProfile(p);
        if (journey) {
          setAlignment(journey.alignment);
          setIndexes(journey.indexes);
          setAlignmentError(false);
          setIndexesError(false);
          setSheetSigned(journey.purposeConfirmed);
        } else {
          setAlignment(null);
          setIndexes(undefined);
          setAlignmentError(true);
          setIndexesError(true);
          setSheetSigned(false);
        }
        setDiagnosticStarted(isDiagnosticStarted(user?.onboardingStep, progress));
      } catch {
        setError('No pudimos cargar tu perfil.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [status, user?.onboardingStep]);

  if (loading) {
    return (
      <div className="mk-dashboard">
        <div className="mk-skeleton mk-skeleton--radar" aria-hidden />
        <div className="mk-skeleton mk-skeleton--card" aria-hidden />
      </div>
    );
  }

  if (error || !profile) {
    if (!canUseMemberProduct(user)) {
      return (
        <div className="mk-dashboard">
          <div className="mk-progress-hero">
            <p className="mk-section-eyebrow">PROGRAMA FUNDADOR</p>
            <h2 className="mk-progress-hero__title">Perfil Maestro próximamente.</h2>
            <p className="mk-progress-hero__sub">
              Tu cuenta ya está creada. El Perfil Maestro se genera con el diagnóstico cuando
              lancemos la plataforma completa.
            </p>
            <Link href="/sistema" className="mk-btn-primary">
              Explorar el sistema →
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="mk-dashboard">
        <div className="mk-progress-hero">
          <p className="mk-section-eyebrow">PERFIL MAESTRO MK</p>
          <h2 className="mk-progress-hero__title">Perfil no disponible.</h2>
          <p className="mk-progress-hero__sub">
            {error ?? 'Completa el diagnóstico para generar tu perfil.'}
          </p>
          <Link href="/diagnostico" className="mk-btn-primary">
            {diagnosticStarted ? 'Continuar diagnóstico →' : 'Comenzar diagnóstico →'}
          </Link>
        </div>
      </div>
    );
  }

  const archetype = getArchetype(profile.archetypePrimary) ?? {
    slug: profile.archetypePrimary, label: profile.archetypePrimary,
    tagline: '', description: '', roman: '', symbol: '?', image: '',
    shadow: { label: '', description: '' },
  };
  const secondaryMeta = profile.archetypeSecondary ? getArchetype(profile.archetypeSecondary) : null;
  const scores  = (profile.scores  ?? {}) as Record<string, number>;
  const indices = (profile.indices ?? {}) as Record<string, number>;
  const rawIndices = (profile.indices ?? {}) as Record<string, unknown>;
  // Provenance decides the layout. A missing audit total does not switch to the system report.
  const isFormularioReading = typeof rawIndices.scoringVersion === 'string' && rawIndices.scoringVersion.startsWith('formulario-score');
  if (isFormularioReading) {
    return (
      <div className="mk-dashboard">
        <ExcelProfile form={indices as never} alignment={alignment} alignmentError={alignmentError} indexes={indexes} indexesError={indexesError} sheetSigned={sheetSigned} />
        <ReviewVersionNote />
      </div>
    );
  }

  return (
    <div className="mk-dashboard">
      <SystemReport scores={scores} indices={indices} archetype={archetype} secondaryArchetype={secondaryMeta} />
      <ReviewVersionNote />
    </div>
  );
}
