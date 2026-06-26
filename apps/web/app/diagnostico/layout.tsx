import type { ReactNode } from 'react';

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
      {children}
    </div>
  );
}
