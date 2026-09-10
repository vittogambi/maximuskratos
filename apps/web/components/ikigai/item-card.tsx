'use client';

import type { IkigaiItem } from '@/lib/ikigai-api';

export function IkigaiItemCard({
  item,
  evidenceLabel,
  onClick,
}: {
  item: IkigaiItem;
  evidenceLabel?: string | null;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="ik-item" onClick={onClick}>
      <p className="ik-item__text">{item.text}</p>
      {evidenceLabel ? <p className="ik-item__meta">{evidenceLabel}</p> : null}
    </button>
  );
}
