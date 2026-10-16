import type { Metadata } from 'next';
import { ComingSoon } from '@/components/journey/ComingSoon';

export const metadata: Metadata = { title: 'Asesores', robots: { index: false, follow: false } };

export default function AdvisorsPage() {
  return (
    <ComingSoon
      title="Asesores"
      body="Aquí encontrarás la solicitud de orientación cuando una ficha marcó algo que quieres que veamos. No hay un directorio de profesionales."
    />
  );
}
