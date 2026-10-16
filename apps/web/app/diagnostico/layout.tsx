import type { ReactNode } from 'react';
import { DiagnosticAccessGate } from '@/components/diagnostico/DiagnosticAccessGate';
import { buildPageMetadata } from '@/lib/seo';
import '../ikigai/ikigai.css';

export const metadata = buildPageMetadata({
  title: 'Diagnóstico',
  description: 'Diagnóstico Maestro MK. Disponible para cuentas autenticadas.',
  path: '/diagnostico',
  noIndex: true,
});

/** Full-screen cinematic shell — no public nav, no footer. */
export default function DiagnosticoLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="dk-shell"
      style={{
        height: '100dvh',
        minHeight: '100dvh',
        background: 'var(--color-obsidian)',
        color: 'var(--color-text)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <DiagnosticAccessGate>{children}</DiagnosticAccessGate>
    </div>
  );
}
