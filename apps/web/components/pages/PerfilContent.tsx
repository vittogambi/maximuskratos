'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { SystemReport } from '@/components/profile/SystemReport';
import { apiDiagnosticProfile, apiDiagnosticProgress, type DiagnosticProgressDto, type MasterProfileDto } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { getArchetype } from '@/lib/archetypes';
import { isFounderAccessPhase } from '@/lib/product-phase';

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

  useEffect(() => {
    if (status === 'loading') return;
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }

    async function load() {
      try {
        const [p, progress] = await Promise.all([
          apiDiagnosticProfile(token!),
          apiDiagnosticProgress(token!).catch(() => null),
        ]);
        setProfile(p);
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
    if (isFounderAccessPhase()) {
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

  return (
    <div className="mk-dashboard">
      <SystemReport scores={scores} indices={indices} archetype={archetype} secondaryArchetype={secondaryMeta} />
    </div>
  );
}
