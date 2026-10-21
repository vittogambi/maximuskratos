import type { Metadata } from 'next';
import Link from 'next/link';
import { MemberPage } from '@/components/member/MemberPage';

export const metadata: Metadata = { title: 'Revisión de semana', robots: { index: false, follow: false } };

export default function SemanaRevisionPage() {
  return (
    <MemberPage
      eyebrow="MK · REVISIÓN"
      title="Revisión de la semana"
      intro="Reconcilia lo hecho, lee la situación con horizonte y confirma los ajustes con fecha efectiva."
    >
      <p className="mk-m-muted">
        El flujo completo de cuatro pasos se conecta al cierre existente. Mientras tanto puedes usar la vista previa desde la semana.
      </p>
      <Link href="/semana" className="mk-m-btn">
        Volver a la semana
      </Link>
    </MemberPage>
  );
}
