'use client';

type Classification = {
  label: string;
  color: string;
};

function classify(val: number): Classification {
  if (val < 40) return { label: 'CRÍTICO',   color: '#ff3333' };
  if (val < 60) return { label: 'INESTABLE', color: '#ff8800' };
  if (val < 80) return { label: 'SÓLIDO',    color: '#c9a24a' };
  return          { label: 'DOMINANTE',      color: '#22c060' };
}

type Props = {
  label: string;
  value: number;
  isGlobal?: boolean;
};

export function KpiCard({ label, value, isGlobal = false }: Props) {
  const { label: clsLabel, color } = classify(value);
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className="mk-kpi-card">
      <div className="mk-kpi-card__top">
        <span className="mk-kpi-card__label">{label}</span>
        {isGlobal && (
          <span className="mk-kpi-card__badge" style={{ color, borderColor: color }}>
            {clsLabel}
          </span>
        )}
      </div>
      <div className="mk-kpi-card__value" style={{ color: isGlobal ? color : undefined }}>
        {value}
      </div>
      <div className="mk-kpi-card__bar">
        <div
          className="mk-kpi-card__bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
