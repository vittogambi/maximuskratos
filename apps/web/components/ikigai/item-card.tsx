'use client';

import { IkigaiLensMark } from '@/components/ikigai/lens-mark';
import type { IkigaiFieldKey, IkigaiItem } from '@/lib/ikigai-api';

export function IkigaiItemCard({
  item,
  fieldKey,
  index,
  evidenceLabel,
  onClick,
}: {
  item: IkigaiItem;
  fieldKey: IkigaiFieldKey;
  index?: number;
  evidenceLabel?: string | null;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="ik-item ik-piece" onClick={onClick}>
      <span className="ik-piece__mark" aria-hidden>
        <IkigaiLensMark field={fieldKey} />
        {index ? <span className="ik-piece__index">{index}</span> : null}
      </span>
      <span className="ik-piece__body">
        <p className="ik-item__text">{item.text}</p>
        {evidenceLabel ? <p className="ik-item__meta">{evidenceLabel}</p> : null}
      </span>
      <span className="ik-piece__edit">Editar</span>
    </button>
  );
}
