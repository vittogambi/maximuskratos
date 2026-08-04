'use client';

import { ProgressReveal } from '@/components/motion/progress-reveal';

export function ScoreBar({ label, score }: { label: string; score: number }) {
  const capped = Math.min(100, Math.max(0, score));
  const color = capped >= 70 ? '#cc0000' : capped >= 40 ? '#888' : '#444';
  return (
    <div className="sys-score-bar">
      <span className="font-label-sm sys-score-bar__label">{label}</span>
      <ProgressReveal
        value={capped}
        className="sys-score-bar__track"
        fillClassName="sys-score-bar__fill"
        fillStyle={{ background: color }}
      />
      <span className="font-label-sm sys-score-bar__value">{capped}</span>
    </div>
  );
}
