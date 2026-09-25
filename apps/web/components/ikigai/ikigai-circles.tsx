'use client';

import { useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import type { IkigaiDefinition, IkigaiFieldKey } from '@/lib/ikigai-api';
import { fieldTitle } from '@/lib/ikigai-ui/format';

const CENTER = 400;
const OFFSET = 150;
const R = 222;

const TITLE_LINES: Record<IkigaiFieldKey, string[]> = {
  PASION: ['LO QUE', 'AMAS'],
  CAPACIDAD: ['EN LO QUE', 'ERES', 'BUENO'],
  NECESIDAD: ['LO QUE EL', 'MUNDO', 'NECESITA'],
  VALOR: ['POR LO QUE', 'TE PUEDEN', 'PAGAR'],
};

export const CIRCLE_LAYOUT: Record<IkigaiFieldKey, { x: number; y: number }> = {
  PASION: { x: CENTER, y: CENTER - OFFSET },
  CAPACIDAD: { x: CENTER - OFFSET, y: CENTER },
  NECESIDAD: { x: CENTER + OFFSET, y: CENTER },
  VALOR: { x: CENTER, y: CENTER + OFFSET },
};

type ZoneSpec = {
  id: string;
  name: string;
  fields: IkigaiFieldKey[];
  hint: string;
  x: number;
  y: number;
};

export const MAP_ZONES: ZoneSpec[] = [
  { id: 'PASION', name: 'Lo que amas', fields: ['PASION'], hint: 'Lo que amas', x: 400, y: 128 },
  { id: 'CAPACIDAD', name: 'En lo que eres bueno', fields: ['CAPACIDAD'], hint: 'En lo que eres bueno', x: 128, y: 400 },
  { id: 'NECESIDAD', name: 'Lo que el mundo necesita', fields: ['NECESIDAD'], hint: 'Lo que el mundo necesita', x: 672, y: 400 },
  { id: 'VALOR', name: 'Por lo que te pueden pagar', fields: ['VALOR'], hint: 'Por lo que te pueden pagar', x: 400, y: 672 },
  {
    id: 'CAPACIDAD+PASION',
    name: 'Pasión',
    fields: ['PASION', 'CAPACIDAD'],
    hint: 'Lo que amas y en lo que eres bueno',
    x: 300,
    y: 300,
  },
  {
    id: 'NECESIDAD+PASION',
    name: 'Misión',
    fields: ['PASION', 'NECESIDAD'],
    hint: 'Lo que amas y lo que el mundo necesita',
    x: 500,
    y: 300,
  },
  {
    id: 'CAPACIDAD+VALOR',
    name: 'Profesión',
    fields: ['CAPACIDAD', 'VALOR'],
    hint: 'En lo que eres bueno y por lo que te pueden pagar',
    x: 300,
    y: 500,
  },
  {
    id: 'NECESIDAD+VALOR',
    name: 'Vocación',
    fields: ['NECESIDAD', 'VALOR'],
    hint: 'Lo que el mundo necesita y por lo que te pueden pagar',
    x: 500,
    y: 500,
  },
  {
    id: 'PASION+VALOR',
    name: 'Arriba y abajo',
    fields: ['PASION', 'VALOR'],
    hint: 'Lo que amas y por lo que te pueden pagar',
    x: 400,
    y: 400,
  },
  {
    id: 'CAPACIDAD+NECESIDAD',
    name: 'Izquierda y derecha',
    fields: ['CAPACIDAD', 'NECESIDAD'],
    hint: 'En lo que eres bueno y lo que el mundo necesita',
    x: 400,
    y: 400,
  },
  {
    id: 'CAPACIDAD+NECESIDAD+PASION',
    name: 'Tres lentes',
    fields: ['PASION', 'CAPACIDAD', 'NECESIDAD'],
    hint: 'Sin por lo que te pueden pagar',
    x: 400,
    y: 360,
  },
  {
    id: 'CAPACIDAD+PASION+VALOR',
    name: 'Tres lentes',
    fields: ['PASION', 'CAPACIDAD', 'VALOR'],
    hint: 'Sin lo que el mundo necesita',
    x: 360,
    y: 400,
  },
  {
    id: 'NECESIDAD+PASION+VALOR',
    name: 'Tres lentes',
    fields: ['PASION', 'NECESIDAD', 'VALOR'],
    hint: 'Sin en lo que eres bueno',
    x: 440,
    y: 400,
  },
  {
    id: 'CAPACIDAD+NECESIDAD+VALOR',
    name: 'Tres lentes',
    fields: ['CAPACIDAD', 'NECESIDAD', 'VALOR'],
    hint: 'Sin lo que amas',
    x: 400,
    y: 440,
  },
  {
    id: 'CAPACIDAD+NECESIDAD+PASION+VALOR',
    name: 'Centro',
    fields: ['PASION', 'CAPACIDAD', 'NECESIDAD', 'VALOR'],
    hint: 'Los cuatro círculos',
    x: 400,
    y: 400,
  },
];

const NAMED_CROSSES = MAP_ZONES.filter(
  (zone) => zone.fields.length === 2 && zone.name !== 'Arriba y abajo' && zone.name !== 'Izquierda y derecha',
);
const CENTER_ID = 'CAPACIDAD+NECESIDAD+PASION+VALOR';

export function zoneKey(fields: Iterable<IkigaiFieldKey>): string {
  return [...new Set(fields)].sort().join('+');
}

export function zoneById(id: string): ZoneSpec | undefined {
  return MAP_ZONES.find((zone) => zone.id === id);
}

export type CircleMarker = { id: string; index: number; fields: IkigaiFieldKey[] };

function onZoneKey(event: KeyboardEvent, run: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    run();
  }
}

function insideFields(x: number, y: number): IkigaiFieldKey[] {
  return (Object.keys(CIRCLE_LAYOUT) as IkigaiFieldKey[]).filter((field) => {
    const spot = CIRCLE_LAYOUT[field];
    const dx = x - spot.x;
    const dy = y - spot.y;
    return dx * dx + dy * dy <= R * R;
  });
}

const FIELD_KEYS = Object.keys(CIRCLE_LAYOUT) as IkigaiFieldKey[];

function outerInner(field: IkigaiFieldKey) {
  const spot = CIRCLE_LAYOUT[field];
  const dx = spot.x - CENTER;
  const dy = spot.y - CENTER;
  const len = Math.hypot(dx, dy) || 1;
  return {
    ox: spot.x + (dx / len) * R,
    oy: spot.y + (dy / len) * R,
    ix: spot.x - (dx / len) * R,
    iy: spot.y - (dy / len) * R,
  };
}

function zoneAt(x: number, y: number): string | null {
  const inside = insideFields(x, y);
  if (inside.length >= 3) return CENTER_ID;
  if (inside.length === 1) return inside[0];
  if (inside.length === 2) {
    const id = zoneKey(inside);
    return NAMED_CROSSES.some((zone) => zone.id === id) ? id : null;
  }
  return null;
}

function LensPaint({
  id,
  fields,
  fillClass,
  lined,
}: {
  id: string;
  fields: IkigaiFieldKey[];
  fillClass: string;
  lined: boolean;
}) {
  const [a, b] = fields;
  const spotA = CIRCLE_LAYOUT[a];
  const spotB = CIRCLE_LAYOUT[b];
  const others = FIELD_KEYS.filter((field) => field !== a && field !== b);
  const maskId = `ik-cut-${id.replace(/\+/g, '-')}`;
  return (
    <g pointerEvents="none">
      <mask id={maskId} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="800" height="800">
        <rect width="800" height="800" fill="white" />
        {others.map((field) => {
          const spot = CIRCLE_LAYOUT[field];
          return <circle key={field} cx={spot.x} cy={spot.y} r={R} fill="black" />;
        })}
      </mask>
      <g mask={`url(#${maskId})`}>
        <circle className={fillClass} cx={spotA.x} cy={spotA.y} r={R} clipPath={`url(#ik-clip-${b})`} />
        {lined ? (
          <>
            <circle className="ik-map__glow-line" cx={spotA.x} cy={spotA.y} r={R} clipPath={`url(#ik-clip-${b})`} />
            <circle className="ik-map__glow-line" cx={spotB.x} cy={spotB.y} r={R} clipPath={`url(#ik-clip-${a})`} />
          </>
        ) : null}
      </g>
    </g>
  );
}

function CenterPaint({ fillClass, lined }: { fillClass: string; lined: boolean }) {
  const valor = CIRCLE_LAYOUT.VALOR;
  return (
    <g pointerEvents="none">
      <g clipPath="url(#ik-clip-PASION)">
        <g clipPath="url(#ik-clip-CAPACIDAD)">
          <g clipPath="url(#ik-clip-NECESIDAD)">
            <circle className={fillClass} cx={valor.x} cy={valor.y} r={R} />
          </g>
        </g>
      </g>
      {lined
        ? FIELD_KEYS.map((field) => {
            const spot = CIRCLE_LAYOUT[field];
            let node: ReactNode = <circle className="ik-map__glow-line" cx={spot.x} cy={spot.y} r={R} />;
            for (const other of FIELD_KEYS) {
              if (other === field) continue;
              node = <g clipPath={`url(#ik-clip-${other})`}>{node}</g>;
            }
            return <g key={field}>{node}</g>;
          })
        : null}
    </g>
  );
}

function ZonePaint({ id, fillClass, lined }: { id: string; fillClass: string; lined: boolean }) {
  const zone = zoneById(id);
  if (!zone) return null;
  if (zone.fields.length === 1) {
    const spot = CIRCLE_LAYOUT[zone.fields[0]];
    return <circle className="ik-map__glow" cx={spot.x} cy={spot.y} r={R} pointerEvents="none" />;
  }
  if (zone.fields.length === 2) return <LensPaint id={id} fields={zone.fields} fillClass={fillClass} lined={lined} />;
  if (id === CENTER_ID) return <CenterPaint fillClass={fillClass} lined={lined} />;
  return null;
}

const JOURNEY_CROSSES: Array<{
  id: string;
  name: string;
  fields: [IkigaiFieldKey, IkigaiFieldKey];
  x?: number;
  y?: number;
}> = [
  { id: 'CAPACIDAD+PASION', name: 'PASIÓN', fields: ['PASION', 'CAPACIDAD'] },
  { id: 'NECESIDAD+PASION', name: 'MISIÓN', fields: ['PASION', 'NECESIDAD'] },
  { id: 'CAPACIDAD+VALOR', name: 'PROFESIÓN', fields: ['CAPACIDAD', 'VALOR'], x: 286, y: 518 },
  { id: 'NECESIDAD+VALOR', name: 'VOCACIÓN', fields: ['NECESIDAD', 'VALOR'], x: 514, y: 518 },
];

export function IkigaiCircles({
  definition,
  counts,
  unclear,
  markers,
  activeId,
  interactive = true,
  focus = null,
  reached,
  onOpenCircle,
  onOpenMarker,
  onHoverZone,
}: {
  definition: IkigaiDefinition;
  counts: Record<IkigaiFieldKey, number>;
  unclear: Record<IkigaiFieldKey, boolean>;
  markers: CircleMarker[];
  activeId?: string | null;
  interactive?: boolean;
  focus?: IkigaiFieldKey | null;
  reached?: IkigaiFieldKey[];
  onOpenCircle?: (field: IkigaiFieldKey) => void;
  onOpenZone?: (zoneId: string) => void;
  onOpenMarker?: (id: string) => void;
  onHoverZone?: (zoneId: string | null) => void;
}) {
  const journey = reached != null;
  const done = new Set(reached ?? []);
  const crosses = journey ? JOURNEY_CROSSES.filter((cross) => cross.fields.every((field) => done.has(field))) : [];
  const allDone = journey && done.size === 4;
  const settled = allDone && focus == null;
  const fields: IkigaiFieldKey[] = ['PASION', 'CAPACIDAD', 'NECESIDAD', 'VALOR'];
  const [pointerZone, setPointerZone] = useState<string | null>(null);
  const [focusZone, setFocusZone] = useState<string | null>(null);
  const hoverId = pointerZone ?? focusZone;

  function readPoint(event: MouseEvent<SVGSVGElement>) {
    const point = event.currentTarget.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return null;
    return point.matrixTransform(matrix.inverse());
  }

  function onMapClick(event: MouseEvent<SVGSVGElement>) {
    if (!interactive) return;
    const target = event.target as Element;
    if (target.closest('.ik-map__spot, .ik-map__marker, .ik-map__center')) return;
    const local = readPoint(event);
    if (!local) return;
    const id = zoneAt(local.x, local.y);
    if (id === 'PASION' || id === 'CAPACIDAD' || id === 'NECESIDAD' || id === 'VALOR') {
      if (counts[id] > 0) onOpenCircle?.(id);
    }
  }

  function onMapMove(event: MouseEvent<SVGSVGElement>) {
    if (!interactive) return;
    const local = readPoint(event);
    if (!local) return;
    const id = zoneAt(local.x, local.y);
    setPointerZone((current) => {
      if (current !== id) onHoverZone?.(id);
      return id;
    });
  }

  function onZoneFocus(id: string) {
    if (interactive) setFocusZone(id);
  }

  function onZoneBlur(event: FocusEvent<SVGGElement>) {
    const next = event.relatedTarget;
    if (next instanceof Element && next.closest('.ik-map')) return;
    setFocusZone(null);
  }

  return (
    <svg
      className={`ik-map${interactive ? ' is-live' : ''}${journey ? ' is-journey' : ''}`}
      viewBox="0 0 800 800"
      role="group"
      aria-label="Mapa de cuatro círculos"
      onClick={onMapClick}
      onMouseMove={onMapMove}
      onMouseLeave={() => {
        setPointerZone(null);
        onHoverZone?.(null);
      }}
    >
      <defs>
        {fields.map((field) => {
          const pole = outerInner(field);
          const spot = CIRCLE_LAYOUT[field];
          return (
            <g key={field}>
              <linearGradient id={`ik-fill-${field}`} x1={pole.ox} y1={pole.oy} x2={pole.ix} y2={pole.iy} gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ff0000" />
                <stop offset="38%" stopColor="#c00100" />
                <stop offset="68%" stopColor="#8b0000" />
                <stop offset="100%" stopColor="#140000" />
              </linearGradient>
              <clipPath id={`ik-clip-${field}`} clipPathUnits="userSpaceOnUse">
                <circle cx={spot.x} cy={spot.y} r={R} />
              </clipPath>
            </g>
          );
        })}
      </defs>
      <rect className="ik-map__plane" x="0" y="0" width="800" height="800" />
      <g className="ik-map__fills">
        {fields.map((field) => {
          const spot = CIRCLE_LAYOUT[field];
          return (
            <circle
              key={`fill-${field}`}
              className={`ik-map__fill${journey && !settled ? (focus === field ? ' is-focus' : done.has(field) ? ' is-done' : ' is-ahead') : ''}`}
              fill={`url(#ik-fill-${field})`}
              cx={spot.x}
              cy={spot.y}
              r={R}
            />
          );
        })}
        {NAMED_CROSSES.map((zone) => (
          <LensPaint key={`shade-${zone.id}`} id={`shade-${zone.id}`} fields={zone.fields} fillClass="ik-map__shade" lined={false} />
        ))}
        <CenterPaint fillClass="ik-map__shade is-center" lined={false} />
      </g>
      <g className="ik-map__strokes">
        {fields.map((field) => {
          const spot = CIRCLE_LAYOUT[field];
          return (
            <circle
              key={`stroke-${field}`}
              className={`ik-map__stroke${unclear[field] ? ' is-unclear' : ''}${journey && focus === field ? ' is-focus' : ''}`}
              cx={spot.x}
              cy={spot.y}
              r={R}
            />
          );
        })}
      </g>
      {hoverId ? <ZonePaint id={hoverId} fillClass="ik-map__glow-fill" lined /> : null}
      {fields.map((field) => {
        const spot = MAP_ZONES.find((zone) => zone.id === field)!;
        const lines = TITLE_LINES[field];
        const name = fieldTitle(definition, field);
        const countLabel =
          unclear[field] && counts[field] === 0
            ? 'Por ahora, no lo tienes claro'
            : counts[field] === 0
              ? ''
              : counts[field] === 1
                ? '1 idea'
                : `${counts[field]} ideas`;
        const canOpen = interactive && counts[field] > 0;
        return (
          <g
            key={`label-${field}`}
            className="ik-map__spot"
            role={canOpen ? 'button' : undefined}
            tabIndex={canOpen ? 0 : undefined}
            aria-label={countLabel ? `${name}. ${countLabel}` : name}
            onClick={() => canOpen && onOpenCircle?.(field)}
            onKeyDown={(event) => canOpen && onZoneKey(event, () => onOpenCircle?.(field))}
            onFocus={() => canOpen && onZoneFocus(field)}
            onBlur={onZoneBlur}
          >
            <circle className="ik-map__spot-hit" cx={spot.x} cy={spot.y} r={lines.length === 2 ? 58 : 72} />
            <text className="ik-map__label" x={spot.x} y={spot.y - (lines.length === 2 ? 14 : 26)} textAnchor="middle">
              {lines.map((line, index) => (
                <tspan key={`${field}-${index}`} x={spot.x} dy={index === 0 ? 0 : 18}>
                  {line}
                </tspan>
              ))}
              {countLabel ? (
                <tspan className="ik-map__count" x={spot.x} dy={20}>
                  {countLabel}
                </tspan>
              ) : null}
            </text>
          </g>
        );
      })}
      {crosses.map((cross) => {
        const zone = zoneById(cross.id)!;
        return (
          <g key={cross.id} className="ik-map__reveal">
            <LensPaint id={`reveal-${cross.id}`} fields={cross.fields} fillClass="ik-map__reveal-fill" lined />
            <text className="ik-map__cross" x={cross.x ?? zone.x} y={(cross.y ?? zone.y) + 5} textAnchor="middle">
              {cross.name}
            </text>
          </g>
        );
      })}
      {allDone ? (
        <g className="ik-map__reveal is-center">
          <CenterPaint fillClass="ik-map__reveal-fill" lined />
          <text className="ik-map__cross is-center" x={400} y={405} textAnchor="middle">
            IKIGAI
          </text>
        </g>
      ) : null}
      {markers.map((marker, order) => {
        const spot = zoneById(zoneKey(marker.fields)) ?? MAP_ZONES[0];
        const shift = order * 14;
        return (
          <g
            key={marker.id}
            className={`ik-map__marker${marker.id === activeId ? ' is-on' : ''}`}
            transform={`translate(${spot.x + (shift % 28) - 11} ${spot.y - 46})`}
            role="button"
            tabIndex={0}
            aria-label={`Posibilidad ${marker.index}`}
            onClick={() => onOpenMarker?.(marker.id)}
            onKeyDown={(event) => onZoneKey(event, () => onOpenMarker?.(marker.id))}
          >
            <circle cx={11} cy={11} r={11} />
            <text x={11} y={15} textAnchor="middle">
              {marker.index}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
