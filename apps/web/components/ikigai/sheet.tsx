'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function IkigaiSheet({
  open,
  title,
  context,
  onClose,
  onBack,
  backLabel = 'Volver',
  children,
  footer,
  variant = 'default',
}: {
  open: boolean;
  title: string;
  context?: string;
  onClose: () => void;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'default' | 'library';
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    const prev = document.documentElement.style.overflow;
    const main = document.querySelector('.ik-main');
    const prevMain = main instanceof HTMLElement ? main.style.overflow : '';
    document.documentElement.style.overflow = 'hidden';
    if (main instanceof HTMLElement) main.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      if (main instanceof HTMLElement) main.style.overflow = prevMain;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
  }, [open]);

  if (!open) return null;

  const sheet = (
    <div className={`ik-sheet${variant === 'library' ? ' ik-sheet--library' : ''}`} role="dialog" aria-modal aria-labelledby="ik-sheet-title">
      <div className="ik-sheet__scrim" onClick={onClose} />
      <div
        className={`ik-sheet__panel${variant === 'library' ? ' ik-sheet__panel--library' : ''}`}
        ref={panel}
        tabIndex={-1}
      >
        <div className="ik-sheet__handle" aria-hidden />
        <div className="ik-sheet__head">
          {onBack ? (
            <button type="button" className="ik-sheet__back" onClick={onBack}>
              {backLabel}
            </button>
          ) : null}
          <div className="ik-sheet__titles">
            {context ? <p className="ik-sheet__context">{context}</p> : null}
            <h2 id="ik-sheet-title" className="ik-sheet__title">
              {title}
            </h2>
          </div>
          <button type="button" className="ik-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="ik-sheet__body">{children}</div>
        {footer ? <div className="ik-sheet__foot">{footer}</div> : null}
      </div>
    </div>
  );

  return typeof document === 'undefined' ? sheet : createPortal(sheet, document.body);
}
