'use client';

import type { ReactNode, Ref } from 'react';
import { AppIcon } from '@/components/app-icon';

type Action = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

type Props = {
  header: ReactNode;
  children: ReactNode;
  primary: Action;
  /** Section progress row above the primary button. */
  sectionsRail?: ReactNode;
  /** Id of the help that explains a blocked primary action. */
  describedBy?: string;
  /** One line under the button. The same slot exists on every screen. */
  note?: string | null;
  bodyRef?: Ref<HTMLDivElement>;
};

/** Header, scrolling body, stable bottom bar. Screens do not place their own button. */
export function PlayerStage({ header, children, primary, sectionsRail, describedBy, note, bodyRef }: Props) {
  return (
    <main className="dk-stage">
      <div className="dk-stage__header">{header}</div>
      <div className="dk-stage__body" ref={bodyRef}>
        {children}
      </div>
      <div className="dk-stage__nav">
        {sectionsRail}
        <button
          type="button"
          className="ag-btn-cta"
          onClick={primary.onClick}
          disabled={primary.disabled}
          aria-describedby={describedBy}
        >
          {primary.label}
          <AppIcon name="arrow-right" size={16} aria-hidden />
        </button>
        <p className="dk-stage__note">{note ?? ''}</p>
      </div>
    </main>
  );
}
