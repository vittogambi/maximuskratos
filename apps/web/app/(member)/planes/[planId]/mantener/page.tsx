'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import {
  fetchMaintenancePreview,
  journeyPlans,
  JourneyApiError,
  transitionPlanStage,
  type MaintenancePreview,
} from '@/lib/journey-api';
import { MemberPage } from '@/components/member/MemberPage';

export default function PlanMantenerPage() {
  const params = useParams<{ planId: string }>();
  const router = useRouter();
  const [preview, setPreview] = useState<MaintenancePreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [withoutOccasions, setWithoutOccasions] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    void journeyPlans(token).then((rows) => {
      const plan = rows.find((row) => row.id === params.planId);
      const stage = plan?.stage ?? (plan?.status === 'ACTIVE' ? 'ACTIVE' : 'PREPARING');
      if (stage === 'CLOSED' || plan?.status === 'ARCHIVED') {
        setBlocked('Este plan ya está cerrado. El mantenimiento se elige antes del logro.');
      }
    });
    fetchMaintenancePreview(token, params.planId)
      .then(setPreview)
      .catch(() => setPreview(null));
  }, [params.planId]);

  async function saveMaintenance() {
    const token = getAccessToken();
    if (!token) return;
    setBusy(true);
    setMessage(null);
    try {
      await transitionPlanStage(token, params.planId, {
        toStage: 'MAINTENANCE',
        reason: withoutOccasions ? 'MAINTENANCE_NO_OCCASIONS' : 'MAINTENANCE_MINIMUM',
      });
      router.replace('/panel');
    } catch (err) {
      setMessage(err instanceof JourneyApiError ? err.message : 'No pudimos guardar el mantenimiento. Inténtalo nuevamente.');
    } finally {
      setBusy(false);
    }
  }

  if (blocked) {
    return (
      <MemberPage title="Qué mantener" intro={blocked}>
        <Link href="/panel" className="mk-m-link">
          Volver al inicio
        </Link>
      </MemberPage>
    );
  }

  return (
    <MemberPage title="Qué mantener" intro="Elige qué quieres conservar de este cambio y cómo reconocerás si necesitas retomarlo.">
      {preview?.minimumAction && !withoutOccasions ? (
        <>
          <p className="mk-m-muted">
            Qué haces: {preview.minimumAction.title}. {preview.minimumAction.doneWhen}
          </p>
          <p className="mk-m-muted">
            Cuándo:{' '}
            {preview.minimumAction.weekday != null
              ? `Día ${preview.minimumAction.weekday} de la semana`
              : 'Sin día fijo'}
          </p>
        </>
      ) : (
        <p className="mk-m-muted">No se programarán nuevas acciones. Se conservarán tu logro y lo que aprendiste.</p>
      )}
      {preview?.reviewSignal ? <p className="mk-m-muted">{preview.reviewSignal}</p> : null}
      <label className="mk-m-check">
        <input type="checkbox" checked={withoutOccasions} onChange={(e) => setWithoutOccasions(e.target.checked)} />
        Mantener sin acciones programadas
      </label>
      <button type="button" className="mk-m-btn" disabled={busy} onClick={() => void saveMaintenance()}>
        {busy ? 'Guardando…' : 'Guardar el mantenimiento'}
      </button>
      {message ? <p className="mk-m-muted">{message}</p> : null}
    </MemberPage>
  );
}
