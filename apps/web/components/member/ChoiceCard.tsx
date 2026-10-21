'use client';

import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  selected?: boolean;
  onSelect?: () => void;
  children?: ReactNode;
};

export function ChoiceCard({ title, description, selected, onSelect, children }: Props) {
  return (
    <button
      type="button"
      className={`mk-m-choice${selected ? ' mk-m-choice--selected' : ''}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="mk-m-choice__title">{title}</span>
      {description ? <span className="mk-m-choice__desc">{description}</span> : null}
      {children}
    </button>
  );
}
