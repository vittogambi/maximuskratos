import type { Metadata } from 'next';
import { ComingSoon } from '@/components/journey/ComingSoon';

export const metadata: Metadata = { title: 'Hoja de ruta', robots: { index: false, follow: false } };

export default function PurposePage() {
  return (
    <ComingSoon
      title="Propósito"
      body="Aquí encontrarás la hoja de ruta de propósito, con tu origen, tu identidad, tu dirección, tus relaciones y tus finanzas, lista para firmar."
    />
  );
}
