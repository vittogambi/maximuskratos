'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { IkigaiLensMark } from '@/components/ikigai/lens-mark';
import type { FieldClarity, IkigaiDefinition, IkigaiFieldKey, IkigaiItem } from '@/lib/ikigai-api';
import { FIELD_STEPS, fieldTitle, filledItems } from '@/lib/ikigai-ui/format';

const INVITE: Record<IkigaiFieldKey, string> = {
  PASION: 'Algo que te encienda',
  CAPACIDAD: 'Algo que se te da bien',
  NECESIDAD: 'Alguien a quien ayudar',
  VALOR: 'Algo por lo que te pagarían',
};

const SLOT: Record<IkigaiFieldKey, (index: number) => CSSProperties> = {
  PASION: (i) => ({ left: '50%', top: `${10 + i * 8}%`, transform: 'translateX(-50%)', maxWidth: '34%' }),
  VALOR: (i) => ({ left: '50%', top: `${67 + i * 8}%`, transform: 'translateX(-50%)', maxWidth: '34%' }),
  CAPACIDAD: (i) => ({ left: '3%', top: `${33 + i * 10}%`, maxWidth: '30%' }),
  NECESIDAD: (i) => ({ right: '3%', top: `${33 + i * 10}%`, maxWidth: '30%' }),
};

function dotStyle(key: IkigaiFieldKey, index: number, count: number): CSSProperties {
  const off = (index - (count - 1) / 2) * 9;
  if (key === 'PASION') return { left: `${50 + off}%`, top: '24%' };
  if (key === 'VALOR') return { left: `${50 + off}%`, top: '76%' };
  if (key === 'CAPACIDAD') return { left: '16%', top: `${56 + off}%` };
  return { left: '84%', top: `${56 + off}%` };
}

function nodeStyle(index: number, count: number, wide: boolean): CSSProperties {
  const cy = wide ? 42 : 34;
  const rx = wide ? 26 : 24;
  const ry = wide ? 22 : 16;
  if (count === 1) return { left: '50%', top: `${cy}%` };
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / count;
  return { left: `${50 + Math.cos(angle) * rx}%`, top: `${cy + Math.sin(angle) * ry}%` };
}

export function IkigaiMap({
  definition,
  items,
  clarity,
  focus = null,
  chosenIds = [],
  badges = {},
  interactive = false,
  wide = false,
  onPick,
  onOpen,
}: {
  definition: IkigaiDefinition;
  items: Record<IkigaiFieldKey, IkigaiItem[]>;
  clarity: Partial<Record<IkigaiFieldKey, FieldClarity | null>>;
  focus?: IkigaiFieldKey | null;
  chosenIds?: string[];
  badges?: Record<string, number[]>;
  interactive?: boolean;
  wide?: boolean;
  onPick?: (id: string) => void;
  onOpen?: (field: IkigaiFieldKey) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Array<{ id: string; x1: number; y1: number; x2: number; y2: number }>>([]);
  const [peek, setPeek] = useState<string | null>(null);

  const filled = Object.fromEntries(FIELD_STEPS.map((key) => [key, filledItems(items[key] ?? [])])) as Record<IkigaiFieldKey, IkigaiItem[]>;
  const chosen = chosenIds.filter((id) => FIELD_STEPS.some((key) => filled[key].some((item) => item.id === id)));

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !interactive) {
      setLines([]);
      return;
    }
    const box = wrap.getBoundingClientRect();
    const next = chosen.flatMap((id) => {
      const from = wrap.querySelector<HTMLElement>(wide ? `[data-piece="${id}"]` : `[data-dot="${id}"]`);
      const node = wrap.querySelector<HTMLElement>(`[data-node="${id}"]`);
      const to = node && node.getBoundingClientRect().width ? node : wrap.querySelector<HTMLElement>('.ik-map__center');
      if (!from || !to) return [];
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      if (!a.width) return [];
      return [{ id, x1: a.left + a.width / 2 - box.left, y1: a.top + a.height / 2 - box.top, x2: b.left + b.width / 2 - box.left, y2: b.top + b.height / 2 - box.top }];
    });
    setLines(next);
  }, [interactive, wide, chosen.join('|'), filled.PASION.length, filled.CAPACIDAD.length, filled.NECESIDAD.length, filled.VALOR.length]);

  const peekItem = peek ? FIELD_STEPS.flatMap((key) => filled[key].filter((item) => item.id === peek).map((item) => ({ item, key })))[0] : null;

  return (
    <div className="ik-map" ref={wrapRef}>
      <svg className="ik-map__lines" aria-hidden>
        {lines.map((line) => (
          <line key={line.id} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
        ))}
      </svg>
      {FIELD_STEPS.map((key) => {
        const n = filled[key].length;
        const empty = n === 0;
        const unclear = empty && clarity[key] === 'UNCLEAR';
        const count = empty ? INVITE[key] : n === 1 ? '1 idea' : `${n} ideas`;
        const dim = focus != null && focus !== key;
        const Tag = interactive && !wide && onOpen ? 'button' : 'p';
        return (
          <div key={key}>
            <div className={`ik-map__lens${unclear ? ' is-unclear' : ''}${focus === key ? ' is-active' : ''}${dim ? ' is-dim' : ''}`} data-k={key} />
            <Tag
              {...(Tag === 'button' ? { type: 'button' as const, onClick: () => onOpen?.(key), 'aria-label': `${fieldTitle(definition, key)}, ${count}. Abrir círculo` } : {})}
              className={`ik-map__tag ik-connect__count${dim ? ' is-dim' : ''}`}
              data-k={key}
            >
              <IkigaiLensMark field={key} />
              <span>
                {fieldTitle(definition, key)}
                <small>{count}</small>
              </span>
            </Tag>
          </div>
        );
      })}
      {FIELD_STEPS.flatMap((key) => {
        const all = filled[key];
        const shown = all.length > 3 ? all.slice(0, 2) : all;
        const pieces = shown.map((item, index) => {
          const on = chosenIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`ik-map__piece${on ? ' is-on' : ''}`}
              data-piece={item.id}
              style={SLOT[key](index)}
              aria-pressed={interactive ? on : undefined}
              disabled={!interactive && !onPick}
              onClick={() => onPick?.(item.id)}
              onMouseEnter={() => wide && setPeek(item.id)}
              onMouseLeave={() => setPeek((current) => (current === item.id ? null : current))}
              onFocus={() => wide && setPeek(item.id)}
              onBlur={() => setPeek((current) => (current === item.id ? null : current))}
            >
              <i aria-hidden>{on ? '✓' : ''}</i>
              <span>{item.text}</span>
              {(badges[item.id] ?? []).map((n) => (
                <b key={n}>{n}</b>
              ))}
            </button>
          );
        });
        const more = all.length > 3 && onOpen ? (
          <button key={`${key}-more`} type="button" className="ik-map__more" style={SLOT[key](2)} onClick={() => onOpen(key)}>
            +{all.length - 2} ideas
          </button>
        ) : null;
        const dots = all.map((item, index) => (
          <button
            key={`${item.id}-dot`}
            type="button"
            className={`ik-map__dot${chosenIds.includes(item.id) ? ' is-on' : ''}`}
            data-dot={item.id}
            style={dotStyle(key, index, all.length)}
            aria-label={`${fieldTitle(definition, key)}: ${item.text}`}
            onClick={() => (interactive && !wide && onOpen ? onOpen(key) : onPick?.(item.id))}
          >
            {index + 1}
          </button>
        ));
        return [...pieces, more, ...dots];
      })}
      {interactive ? (
        <div className={`ik-map__center${chosen.length ? ' has' : ''}`}>
          {chosen.map((id, index) => {
            const field = FIELD_STEPS.find((key) => filled[key].some((item) => item.id === id))!;
            return (
              <button
                key={id}
                type="button"
                className="ik-map__node"
                data-node={id}
                style={nodeStyle(index, chosen.length, wide)}
                aria-label={filled[field].find((item) => item.id === id)?.text}
                onMouseEnter={() => wide && setPeek(id)}
                onMouseLeave={() => setPeek((current) => (current === id ? null : current))}
                onFocus={() => setPeek(id)}
                onBlur={() => setPeek((current) => (current === id ? null : current))}
              >
                <IkigaiLensMark field={field} size={wide ? 16 : 12} />
              </button>
            );
          })}
          <p>
            <strong>Tu conexión</strong>
            {chosen.length ? (chosen.length === 1 ? '1 idea' : `${chosen.length} ideas`) : 'Trae aquí lo que se cruza'}
          </p>
        </div>
      ) : null}
      {peekItem ? (
        <div className="ik-map__peek" role="status">
          <p>{fieldTitle(definition, peekItem.key)}</p>
          <p>{peekItem.item.text}</p>
        </div>
      ) : null}
    </div>
  );
}
