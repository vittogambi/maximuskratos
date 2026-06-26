'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

const DIM_LABELS: Record<string, string> = {
  mentality:     'Mentalidad',
  identity:      'Identidad',
  habits:        'Hábitos',
  environment:   'Entorno',
  finances:      'Finanzas',
  relationships: 'Relaciones',
  purpose:       'Propósito',
  ikigai:        'Ikigai',
};

const DIM_ORDER = ['mentality', 'identity', 'habits', 'environment', 'finances', 'relationships', 'purpose', 'ikigai'];

type Props = {
  scores: Record<string, number>;
};

export function RadarProfile({ scores }: Props) {
  const data = DIM_ORDER.filter((d) => scores[d] !== undefined).map((dim) => ({
    subject: DIM_LABELS[dim] ?? dim,
    value: Math.min(100, Math.max(0, Math.round(scores[dim] ?? 0))),
    fullMark: 100,
  }));

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
        <PolarGrid
          stroke="rgba(255,255,255,0.07)"
          strokeDasharray="3 3"
        />
        <PolarAngleAxis
          dataKey="subject"
          tick={{
            fill: 'rgba(255,255,255,0.45)',
            fontSize: 10,
            fontFamily: 'var(--font-hanken, system-ui)',
            fontWeight: 500,
          }}
          tickLine={false}
        />
        <Radar
          name="Perfil"
          dataKey="value"
          stroke="#cc0000"
          fill="#8b0000"
          fillOpacity={0.35}
          dot={{ r: 3, fill: '#cc0000', fillOpacity: 0.9 }}
          strokeWidth={1.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
