'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useAuthSession } from '@/components/auth-session-provider';
import { NumberCounter } from '@/components/motion';
import {
  apiDiagnosticOutroSeen,
  apiDiagnosticState,
  type DiagnosticState,
} from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import {
  clearOutroBootstrap,
  readOutroBootstrap,
} from '@/lib/diagnostic-outro-bootstrap';
import { ProgressRail } from './ProgressRail';
import {
  outroBodyVariants,
  outroStaggerContainer,
  outroStaggerItem,
} from './diagnostic-motion';

function hasOutroContent(state: DiagnosticState | null): boolean {
  return state?.nextStep.type === 'module_outro';
}

export function ModuleOutro() {
  const router = useRouter();
  const params = useParams<{ moduleSlug: string }>();
  const { status, refresh } = useAuthSession();
  const reduced = useReducedMotion();
  const [state, setState] = useState<DiagnosticState | null>(() => readOutroBootstrap());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const token = getAccessToken();
    if (!token) return;

    apiDiagnosticState(token)
      .then((s) => {
        setState(s);
        clearOutroBootstrap();
      })
      .catch(() => {});
  }, [status]);

  async function handleContinue() {
    const token = getAccessToken();
    if (!token || !params.moduleSlug) return;
    setLoading(true);
    try {
      await apiDiagnosticOutroSeen(token, params.moduleSlug);
      const next = await apiDiagnosticState(token);
      if (next.nextStep.type === 'question' && next.sessionState.currentModuleSlug) {
        router.push(`/diagnostico/modulo/${next.sessionState.currentModuleSlug}/pregunta`);
      } else if (next.nextStep.type === 'diagnostic_complete') {
        await refresh({ force: true });
        router.push('/diagnostico/resultado');
      }
    } catch {
      setLoading(false);
    }
  }

  const outro =
    state?.nextStep.type === 'module_outro' ? state.nextStep.data : null;
  const ss = state?.sessionState;
  const selfPct = ss?.selfKnowledgePct;
  const showContent = hasOutroContent(state);

  return (
    <main className="dk-outro-shell">
      <ProgressRail
        pct={ss?.completionPct ?? 0}
        moduleTitle={ss?.currentModuleTitle ?? outro?.titleEs}
        variant="outro"
      />

      {showContent ? (
        <motion.div
          className="dk-outro-body"
          variants={reduced ? undefined : outroBodyVariants}
          initial={reduced ? false : 'initial'}
          animate={reduced ? undefined : 'animate'}
        >
          <motion.div
            variants={reduced ? undefined : outroStaggerContainer}
            initial={reduced ? false : 'hidden'}
            animate={reduced ? undefined : 'show'}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'inherit', width: '100%' }}
          >
            <motion.p className="dk-outro-eyebrow" variants={reduced ? undefined : outroStaggerItem}>
              MÓDULO COMPLETO
            </motion.p>

            {outro ? (
              <>
                <motion.h2 className="dk-outro-title" variants={reduced ? undefined : outroStaggerItem}>
                  {outro.titleEs}
                </motion.h2>
                <motion.p className="dk-outro-text" variants={reduced ? undefined : outroStaggerItem}>
                  {outro.outroText}
                </motion.p>
              </>
            ) : (
              <motion.h2 className="dk-outro-title" variants={reduced ? undefined : outroStaggerItem}>
                Módulo completado.
              </motion.h2>
            )}

            {selfPct !== undefined && (
              <motion.div
                className="dk-outro-metric dk-outro-metric--pulse"
                variants={reduced ? undefined : outroStaggerItem}
              >
                <NumberCounter
                  key={selfPct}
                  to={selfPct}
                  duration={0.85}
                  suffix="%"
                  className="dk-outro-metric-value"
                  startWhen="mount"
                />
                <span className="dk-outro-metric-label">AUTOCONOCIMIENTO</span>
              </motion.div>
            )}

            <motion.div variants={reduced ? undefined : outroStaggerItem}>
              <button
                type="button"
                className="ag-btn-cta font-label-lg dk-outro-cta"
                onClick={handleContinue}
                disabled={loading}
              >
                {loading ? 'Cargando…' : 'Continuar'}
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : (
        <div className="dk-outro-body dk-outro-body--loading" aria-hidden>
          <div className="dk-outro-skeleton dk-outro-skeleton--title" />
          <div className="dk-outro-skeleton dk-outro-skeleton--text" />
          <div className="dk-outro-skeleton dk-outro-skeleton--metric" />
        </div>
      )}
    </main>
  );
}
