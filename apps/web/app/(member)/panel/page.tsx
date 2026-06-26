import type { Metadata } from 'next';
import { InicioDashboard } from '@/components/pages/InicioDashboard';

export const metadata: Metadata = {
  title: 'Inicio | Maximus Kratos',
  robots: { index: false, follow: false },
};

export default function PanelPage() {
  return <InicioDashboard />;
}
