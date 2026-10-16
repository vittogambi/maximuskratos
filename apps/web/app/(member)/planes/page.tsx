import type { Metadata } from 'next';
import { ComingSoon } from '@/components/journey/ComingSoon';

export const metadata: Metadata = { title: 'Planes', robots: { index: false, follow: false } };

export default function PlansPage() {
  return (
    <ComingSoon
      title="Planes"
      body="Aquí encontrarás el plan vigente, el resultado que buscas, las acciones y el vínculo con la hoja de ruta."
    />
  );
}
