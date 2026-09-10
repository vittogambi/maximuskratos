'use client';

import { useEffect, type ReactNode } from 'react';

export function IkigaiSheet({
  open,
  title,
  onClose,
  children,
  variant = 'default',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  variant?: 'default' | 'library';
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`ik-sheet${variant === 'library' ? ' ik-sheet--library' : ''}`} role="dialog" aria-modal aria-labelledby="ik-sheet-title">
      <div className="ik-sheet__scrim" onClick={onClose} />
      <div className={`ik-sheet__panel${variant === 'library' ? ' ik-sheet__panel--library' : ''}`}>
        <div className="ik-sheet__handle" aria-hidden />
        <div className="ik-sheet__head">
          <h2 id="ik-sheet-title" className="ik-sheet__title">
            {title}
          </h2>
          <button type="button" className="ik-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
