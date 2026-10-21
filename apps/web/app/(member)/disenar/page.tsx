import type { Metadata } from 'next';
import Link from 'next/link';
import { PlansScreen } from '@/components/journey/PlansScreen';

export const metadata: Metadata = { title: 'Diseñar', robots: { index: false, follow: false } };

export default function DisenarPage() {
  return (
    <div className="mk-m-page">
      <p className="mk-m-eyebrow">MK · DISEÑA</p>
      <h1 className="mk-m-title">Diseñar</h1>
      <p className="mk-m-intro">
        Prepara o ajusta un plan antes de activarlo.{' '}
        <Link href="/planes" className="mk-m-link">
          Ver todos los planes
        </Link>
      </p>
      <PlansScreen />
    </div>
  );
}
