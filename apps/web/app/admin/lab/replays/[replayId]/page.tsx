'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { KeepCandidateButton } from '@/components/admin/lab/keep-candidate';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { ReplayImpactBoard } from '@/components/admin/lab/replay-impact-board';
import { ErrorNote, LabCard, RadioCards, Skeleton, Tech } from '@/components/admin/lab/primitives';
import { labApi, type LabReplayComparison } from '@/lib/lab-api';
import { formatState, humanError } from '@/lib/lab-ui/format';
import { REPLAY_VERDICT_OPTIONS, labUiLabels } from '@/lib/lab-ui/labels';

export default function LabReplayPage({ params }: { params: Promise<{ replayId: string }> }) {
  const { replayId } = use(params);
  const [comparison, setComparison] = useState<LabReplayComparison | null>(null);
  const [error, setError] = useState<ReturnType<typeof humanError> | null>(null);
  const [verdicts, setVerdicts] = useState<Record<string, string>>({});
  const [onlyChanged, setOnlyChanged] = useState(false);

  useEffect(() => {
    labApi
      .replayComparison(replayId)
      .then((next) => {
        setComparison(next);
        setVerdicts(
          Object.fromEntries(next.results.map((row) => [row.run_id, row.verdict ?? ''])),
        );
      })
      .catch((err) => setError(humanError(err, 'No pudimos cargar esta comparación.')));
  }, [replayId]);

  if (!comparison) {
    return (
      <div className="lab">
        <LabNav />
        {error ? <ErrorNote error={error} /> : <Skeleton lines={5} />}
      </div>
    );
  }

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-casehead">
        <Link className="lab-back" href="/admin/lab/experiments">
          Volver a cambios
        </Link>
        <div className="lab-casehead__top">
          <h1 className="lab-casehead__title">Comparar el cambio</h1>
        </div>
        <p className="lab-casehead__desc">
          {comparison.changeset_reason || 'Este cambio no registró un motivo.'}
        </p>
        {comparison.summary ? (
          <p className="lab-lead">
            Mejora en {comparison.summary.improves} casos. Empeora en {comparison.summary.worsens}. Sin cambio
            relevante en {comparison.summary.unchanged}. Necesitan tu revisión: {comparison.summary.needs_review}.
          </p>
        ) : null}
      </header>

      {error ? <ErrorNote error={error} /> : null}
      <ReplayImpactBoard rows={comparison.results} />
      <label className="lab-check">
        <input type="checkbox" checked={onlyChanged} onChange={(event) => setOnlyChanged(event.target.checked)} />
        Solo casos que cambian
      </label>

      {(onlyChanged
        ? comparison.results.filter((row) => row.impact && row.impact !== 'UNCHANGED')
        : comparison.results
      ).map((row) => (
        <div key={row.run_id} style={{ marginBottom: '1.25rem' }}>
          <LabCard title={row.case_label}>
            <table className="lab-table">
              <thead>
                <tr>
                  <th />
                  <th>Actual</th>
                  <th>Con el cambio</th>
                  <th>Tu criterio</th>
                </tr>
              </thead>
              <tbody>
                {row.domains.map((domain) => {
                  const changed =
                    domain.from_score !== domain.to_score || domain.from_state !== domain.to_state;
                  return (
                    <tr key={domain.key} className={changed ? 'is-divergent' : undefined}>
                      <th scope="row">{labUiLabels.domain(domain.key)}</th>
                      <td>
                        {domain.from_score ?? 'sin puntaje'} · {formatState(domain.from_state)}
                      </td>
                      <td>
                        {domain.to_score ?? 'sin puntaje'} · {formatState(domain.to_state)}
                      </td>
                      <td>Sin registrar</td>
                    </tr>
                  );
                })}
                <tr className={row.priority.from !== row.priority.to ? 'is-divergent' : undefined}>
                  <th scope="row">Ámbito prioritario sugerido</th>
                  <td>{row.priority.from ? labUiLabels.domain(row.priority.from) : 'Ninguno'}</td>
                  <td>{row.priority.to ? labUiLabels.domain(row.priority.to) : 'Ninguno'}</td>
                  <td>{row.rafa_priority ? labUiLabels.domain(row.rafa_priority) : 'Sin registrar'}</td>
                </tr>
                <tr className={row.plan.from !== row.plan.to ? 'is-divergent' : undefined}>
                  <th scope="row">Ruta</th>
                  <td>{row.plan.from_name ?? row.plan.from ?? 'Sin ruta'}</td>
                  <td>{row.plan.to_name ?? row.plan.to ?? 'Sin ruta'}</td>
                  <td>Sin registrar</td>
                </tr>
                <tr className={row.safety.from !== row.safety.to ? 'is-divergent' : undefined}>
                  <th scope="row">Alertas</th>
                  <td>{row.safety.from}</td>
                  <td>{row.safety.to}</td>
                  <td>Sin registrar</td>
                </tr>
              </tbody>
            </table>
            <p className="lab-badge">{labUiLabels.replayImpact(row.impact)}</p>
            <p className="lab-muted">
              Tu criterio: {row.rafa_priority ? labUiLabels.domain(row.rafa_priority) : 'Sin registrar'}
            </p>
            <div className="lab-field">
              <span className="lab-label">¿Este cambio mejora la lectura de este caso?</span>
              <RadioCards
                name={`verdict-${row.run_id}`}
                value={verdicts[row.run_id] ?? ''}
                options={REPLAY_VERDICT_OPTIONS}
                inline
                onChange={(value) => {
                  setVerdicts((current) => ({ ...current, [row.run_id]: value }));
                  labApi
                    .verdict(replayId, row.run_id, value)
                    .catch((err) => setError(humanError(err, 'No pudimos guardar el veredicto.')));
                }}
              />
            </div>
            <Tech>
              <p>Atribución: {row.attribution}</p>
              <pre className="lab-pre">{JSON.stringify(row.flags, null, 2)}</pre>
            </Tech>
          </LabCard>
        </div>
      ))}

      <div className="lab-ctabar">
        <p className="lab-ctabar__note">
          Estado del cambio: {labUiLabels.changesetStatus(comparison.changeset_status)}.
          {comparison.keep_blocked
            ? ` Hay ${comparison.summary?.worsens_without_verdict ?? 0} casos que empeoran sin veredicto.`
            : ''}
        </p>
        <KeepCandidateButton
          blocked={Boolean(comparison.keep_blocked)}
          worsensWithoutVerdict={comparison.summary?.worsens_without_verdict ?? 0}
          onKeep={() =>
            labApi
              .accept(comparison.changeset_id, { note: 'Conservado desde la comparación' })
              .then(() => labApi.replayComparison(replayId).then(setComparison))
              .catch((err) => setError(humanError(err, 'No pudimos conservar este cambio.')))
          }
        />
        <button
          type="button"
          className="lab-btn lab-btn--danger"
          onClick={() =>
            labApi
              .reject(comparison.changeset_id)
              .then(() => labApi.replayComparison(replayId).then(setComparison))
              .catch((err) => setError(humanError(err, 'No pudimos descartar este cambio.')))
          }
        >
          Descartar este cambio
        </button>
      </div>
    </div>
  );
}
