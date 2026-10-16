import type { Metadata } from 'next';
import { ComingSoon } from '@/components/journey/ComingSoon';

export const metadata: Metadata = { title: 'Mente', robots: { index: false, follow: false } };

export default function MentePage() {
  return (
    <ComingSoon
      title="Mente"
      body="Aquí encontrarás las acciones de Mente, con el criterio de terminado y el registro de lo que hiciste."
    />
  );
}
