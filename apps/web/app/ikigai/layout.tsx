import type { ReactNode } from 'react';
import { buildPageMetadata } from '@/lib/seo';
import './ikigai.css';

export const metadata = buildPageMetadata({
  title: 'IKIGAI',
  description: 'Construye tu mapa de dirección. Sesión privada.',
  path: '/ikigai/empezar',
  noIndex: true,
});

export default function IkigaiLayout({ children }: { children: ReactNode }) {
  return <div className="ik-app font-body">{children}</div>;
}
