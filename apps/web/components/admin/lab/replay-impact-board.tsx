import { LabCard } from './primitives';
import { groupReplayRows, replayLayerChanges, singleCaseBacking, type ReplayRow } from '@/lib/lab-ui/replay-groups';

export function ReplayImpactBoard({ rows }: { rows: ReplayRow[] }) {
  const groups = groupReplayRows(rows);
  return (
    <div className="lab-stack">
      {singleCaseBacking(rows) ? (
        <p className="lab-hint">
          Este cambio nace de un solo caso. Revisa su efecto sobre otros casos antes de incorporarlo.
        </p>
      ) : null}
      <LabCard title="Arregla">
        {groups.improved.length === 0 ? (
          <p className="lab-muted">Ningún caso pasa a coincidir con una expectativa registrada.</p>
        ) : (
          <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
            {groups.improved.map((row) => (
              <li key={row.run_id}>
                <strong>{row.case_label}</strong>
                {replayLayerChanges(row).map((item) => (
                  <div key={item.text}>{item.text}</div>
                ))}
              </li>
            ))}
          </ul>
        )}
      </LabCard>
      <LabCard title="Sin cambio">
        {groups.unchanged.length === 0 ? (
          <p className="lab-muted">Todos los casos comparados cambian algo.</p>
        ) : (
          <p className="lab-muted">{groups.unchanged.map((row) => row.case_label).join(', ')}</p>
        )}
      </LabCard>
      <LabCard title="Consecuencia">
        {groups.needsReview.length === 0 ? (
          <p className="lab-muted">Ningún caso cambia sin una expectativa contraria.</p>
        ) : (
          <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
            {groups.needsReview.map((row) => (
              <li key={row.run_id}>{row.case_label}</li>
            ))}
          </ul>
        )}
      </LabCard>
      <LabCard title="Conflicto">
        {groups.worsened.length === 0 ? (
          <p className="lab-muted">Ningún caso rompe una expectativa previamente aceptada.</p>
        ) : (
          <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
            {groups.worsened.map((row) => (
              <li key={row.run_id}>
                {row.case_label}
                {row.critical_regression ? ': contradice un caso que ya habías aceptado' : ''}
              </li>
            ))}
          </ul>
        )}
      </LabCard>
    </div>
  );
}
