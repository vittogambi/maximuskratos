import type { Metadata } from 'next';
import { ComingSoon } from '@/components/journey/ComingSoon';

export const metadata: Metadata = { title: 'Espíritu', robots: { index: false, follow: false } };

export default function EspirituPage() {
  return (
    <ComingSoon
      title="Espíritu"
      body="Aquí encontrarás las acciones de Espíritu, con el criterio de terminado y el registro de lo que hiciste."
    />
  );
}
