import type { Metadata } from 'next';
import { PanelContent } from '@/components/pages/panel-content';

export const metadata: Metadata = {
  title: 'Tu panel | Maximus Kratos',
  robots: { index: false, follow: false },
};

export default function PanelPage() {
  return <PanelContent />;
}
