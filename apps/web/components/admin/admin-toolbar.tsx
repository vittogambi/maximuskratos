'use client';

import type { ReactNode } from 'react';
import { AppIcon } from '@/components/app-icon';

type AdminToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  children?: ReactNode;
};

export function AdminToolbar({
  search,
  onSearchChange,
  placeholder = 'Buscar…',
  children,
}: AdminToolbarProps) {
  return (
    <div className="admin-toolbar">
      <label className="admin-search">
        <AppIcon name="scan-line" size={16} aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </label>
      {children ? <div className="admin-toolbar__actions">{children}</div> : null}
    </div>
  );
}

type AdminFilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export function AdminFilterChip({ label, active, onClick }: AdminFilterChipProps) {
  return (
    <button
      type="button"
      className={`admin-filter-chip${active ? ' is-active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
