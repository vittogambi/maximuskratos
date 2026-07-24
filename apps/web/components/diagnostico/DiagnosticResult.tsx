'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { SystemReport } from '@/components/profile/SystemReport';
import { apiDiagnosticProfile, apiDiagnosticStart, type MasterProfileDto } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { getArchetype } from '@/lib/archetypes';

// ── Main component ────────────────────────────────────────────────────────────

export function DiagnosticResult() {
  const router = useRouter();
  const { status } = useAuthSession();
  const [profile, setProfile] = useState<MasterProfileDto>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'guest') { router.replace('/login'); return; }
    const token = getAccessToken();
    if (!token) { router.replace('/login'); return; }

    async function loadProfile() {
      try {
        let p = await apiDiagnosticProfile(token!);
        if (!p) {
          await apiDiagnosticStart(token!);
          p = await apiDiagnosticProfile(token!);
        }
        if (!p) {
          setError('Tu perfil no está disponible. Completa el diagnóstico para generarlo.');
          return;
        }
        setProfile(p);
      } catch {
        setError('No pudimos cargar tu perfil. Intenta de nuevo en unos segundos.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [status, router]);

  if (loading) {
    return (
      <main style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-loading"><span className="auth-spinner" aria-hidden /></div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem', textAlign: 'center' }}>
        <p className="font-body-md" style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '420px' }}>
          {error ?? 'Perfil no disponible.'}
        </p>
        <Link href="/diagnostico" className="ag-btn-cta font-label-lg">Comenzar diagnóstico →</Link>
        <Link href="/panel" className="font-label-md" style={{ color: 'rgba(255,255,255,0.4)' }}>Volver al panel</Link>
      </main>
    );
  }

  const archetype = getArchetype(profile.archetypePrimary) ?? {
    slug: profile.archetypePrimary,
    label: profile.archetypePrimary,
    tagline: '',
    description: '',
    roman: '',
    symbol: '?',
    image: '',
    shadow: { label: '', description: '' },
  };
  const secondaryMeta = profile.archetypeSecondary ? getArchetype(profile.archetypeSecondary) : null;

  const scores  = (profile.scores  ?? {}) as Record<string, number>;
  const indices = (profile.indices ?? {}) as Record<string, number>;

  return (
    <main className="dk-result-page">
      <div className="dk-result-body">
        <SystemReport scores={scores} indices={indices} archetype={archetype} secondaryArchetype={secondaryMeta} />

        <Link href="/panel" className="ag-btn-cta font-label-lg" style={{ textAlign: 'center' }}>
          ← Volver al panel
        </Link>
      </div>
    </main>
  );
}
