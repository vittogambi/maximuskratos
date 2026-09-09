'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/admin/lab/primitives';

export type UnsavedLeaveHandler = {
  isDirty: () => boolean;
  save: () => Promise<void>;
  discard: () => void;
};

type LeaveTarget = { href: string } | { action: () => void };

const UnsavedChangesContext = createContext<{
  register: (handler: UnsavedLeaveHandler | null) => void;
  tryNavigate: (href: string) => boolean;
  tryLeave: (action: () => void) => boolean;
} | null>(null);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const handlerRef = useRef<UnsavedLeaveHandler | null>(null);
  const [target, setTarget] = useState<LeaveTarget | null>(null);
  const [pending, setPending] = useState(false);

  const register = useCallback((handler: UnsavedLeaveHandler | null) => {
    handlerRef.current = handler;
  }, []);

  const blockIfDirty = useCallback((next: LeaveTarget) => {
    if (!handlerRef.current?.isDirty()) return false;
    setTarget(next);
    return true;
  }, []);

  const tryNavigate = useCallback(
    (href: string) => {
      if (blockIfDirty({ href })) return false;
      return true;
    },
    [blockIfDirty],
  );

  const tryLeave = useCallback(
    (action: () => void) => {
      if (blockIfDirty({ action })) return false;
      return true;
    },
    [blockIfDirty],
  );

  function proceed(next: LeaveTarget) {
    if ('href' in next) router.push(next.href);
    else next.action();
  }

  const value = useMemo(() => ({ register, tryNavigate, tryLeave }), [register, tryNavigate, tryLeave]);

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      {target ? (
        <Modal
          title="Tienes cambios sin guardar"
          onClose={() => setTarget(null)}
          actions={
            <>
              <button type="button" className="lab-btn lab-btn--ghost" onClick={() => setTarget(null)}>
                Seguir editando
              </button>
              <button
                type="button"
                className="lab-btn lab-btn--danger"
                onClick={() => {
                  handlerRef.current?.discard();
                  const next = target;
                  setTarget(null);
                  proceed(next);
                }}
              >
                Salir sin guardar
              </button>
              <button
                type="button"
                className="lab-btn"
                disabled={pending}
                onClick={() => {
                  const next = target;
                  setPending(true);
                  Promise.resolve(handlerRef.current?.save())
                    .then(() => {
                      setTarget(null);
                      proceed(next);
                    })
                    .catch(() => undefined)
                    .finally(() => setPending(false));
                }}
              >
                Guardar
              </button>
            </>
          }
        >
          <p className="lab-muted">Si sales ahora, lo que no hayas guardado se perderá.</p>
        </Modal>
      ) : null}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) {
    return {
      register: () => undefined,
      tryNavigate: () => true,
      tryLeave: () => true,
    };
  }
  return ctx;
}
