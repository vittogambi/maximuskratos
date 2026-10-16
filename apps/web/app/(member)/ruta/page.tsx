import type { Metadata } from 'next';
import { ComingSoon } from '@/components/journey/ComingSoon';

export const metadata: Metadata = { title: 'Ruta MK', robots: { index: false, follow: false } };

export default function RutaPage() {
  return (
    <ComingSoon
      title="Ruta"
      body="Aquí encontrarás las fichas del cuestionario en orden, con lo que ya respondiste y lo que sigue bloqueado hasta terminar la anterior."
    />
  );
}
