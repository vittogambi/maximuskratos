import type { Metadata } from 'next';
import { RoadmapClose } from '@/components/journey/RoadmapClose';

export const metadata: Metadata = {
  title: 'Hoja de ruta',
  robots: { index: false, follow: false },
};

export default function DiagnosticResultPage() {
  return <RoadmapClose />;
}
