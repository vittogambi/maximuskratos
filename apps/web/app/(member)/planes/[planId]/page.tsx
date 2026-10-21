'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MemberPage } from '@/components/member/MemberPage';

export default function PlanDetailPage() {
  const params = useParams<{ planId: string }>();
  const planId = params.planId;
  return (
    <MemberPage eyebrow="MK · PLAN" title="Plan" intro="Detalle del plan y acciones de etapa.">
      <p className="mk-m-muted">Identificador: {planId}</p>
      <nav className="mk-m-actions" aria-label="Acciones del plan">
        <Link href={`/disenar/${planId}`} className="mk-m-link">
          Diseñar
        </Link>
        <Link href={`/planes/${planId}/logro`} className="mk-m-link">
          Declarar logro
        </Link>
        <Link href={`/planes/${planId}/mantener`} className="mk-m-link">
          Mantenimiento
        </Link>
        <Link href="/semana" className="mk-m-btn">
          Actuar esta semana
        </Link>
      </nav>
    </MemberPage>
  );
}
