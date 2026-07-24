export function ScoreBar({ label, score }: { label: string; score: number }) {
  const capped = Math.min(100, Math.max(0, score));
  const color = capped >= 70 ? '#cc0000' : capped >= 40 ? '#888' : '#444';
  return (
    <div className="sys-score-bar">
      <span className="font-label-sm sys-score-bar__label">{label}</span>
      <div className="sys-score-bar__track">
        <div className="sys-score-bar__fill" style={{ width: `${capped}%`, background: color }} />
      </div>
      <span className="font-label-sm sys-score-bar__value">{capped}</span>
    </div>
  );
}
