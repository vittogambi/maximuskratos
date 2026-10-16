import type { Metadata } from 'next';
import { ComingSoon } from '@/components/journey/ComingSoon';

export const metadata: Metadata = { title: 'Cuerpo', robots: { index: false, follow: false } };

export default function CuerpoPage() {
  return (
    <ComingSoon
      title="Cuerpo"
      body="Aquí encontrarás las acciones de Cuerpo, con el criterio de terminado y el registro de lo que hiciste."
    />
  );
}
