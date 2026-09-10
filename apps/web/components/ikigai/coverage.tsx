'use client';

import type { IkigaiFieldKey } from '@/lib/ikigai-api';
import { COVERAGE_LABELS } from '@/lib/ikigai-ui/format';
import { useState } from 'react';

export function IkigaiCoverageIndicator({
  coverage,
}: {
  coverage: Record<IkigaiFieldKey, boolean>;
}) {
  const [open, setOpen] = useState(false);
  const keys = Object.keys(coverage) as IkigaiFieldKey[];
  const n = keys.filter((k) => coverage[k]).length;
  const missing = keys.filter((k) => !coverage[k]).map((k) => COVERAGE_LABELS[k]);

  return (
    <div>
      <div className="ik-cov">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            className={coverage[key] ? 'is-on' : ''}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={`ik-dot${coverage[key] ? ' is-on' : ''}`} />
            {COVERAGE_LABELS[key]}
          </button>
        ))}
      </div>
      <p className="ik-hint">{n} de 4 áreas conectadas</p>
      {open && missing.length > 0 ? (
        <p className="ik-note">Todavía no conecta: {missing.join(', ')}.</p>
      ) : null}
    </div>
  );
}
