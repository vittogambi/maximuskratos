'use client';

import { useEffect, useMemo, useState } from 'react';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { OriginChip } from '@/components/admin/lab/origin-chip';
import { Skeleton } from '@/components/admin/lab/primitives';
import { labApi, type LabQuestionBankRow } from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';
import { labUiLabels } from '@/lib/lab-ui/labels';

type IntegrityFilter = 'all' | 'without_role' | 'without_current_consumer' | 'broken_config' | 'review';

export default function QuestionBankPage() {
  const [rows, setRows] = useState<LabQuestionBankRow[] | null>(null);
  const [withoutRole, setWithoutRole] = useState(0);
  const [withoutConsumer, setWithoutConsumer] = useState(0);
  const [broken, setBroken] = useState(0);
  const [filter, setFilter] = useState<IntegrityFilter>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    labApi
      .questionBank()
      .then((next) => {
        setRows(next.questions);
        setWithoutRole(next.without_role ?? next.without_function);
        setWithoutConsumer(next.without_current_consumer ?? 0);
        setBroken(next.broken_config ?? 0);
      })
      .catch((err) => setError(humanError(err, 'No pudimos cargar el banco.').message));
  }, []);

  const visible = useMemo(() => {
    if (!rows) return [];
    if (filter === 'all') return rows;
    if (filter === 'review') return rows.filter((item) => item.review_needed_by_rafa === 'YES');
    return rows.filter((item) => item.integrity === filter);
  }, [rows, filter]);

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <p className="lab-eyebrow">Mantenimiento</p>
        <h1 className="admin-page-header__title">Banco de preguntas</h1>
        <p className="lab-lead">Para qué existe cada pregunta. Si no tiene función, sobra o hay que conectarla.</p>
      </header>
      {error ? <p className="lab-error">{error}</p> : null}
      {rows ? (
        <p className="lab-muted">
          {rows.length} preguntas. {withoutRole} sin rol. {withoutConsumer} sin consumidor actual.{' '}
          {broken} con configuración rota.
        </p>
      ) : null}
      {rows ? (
        <p className="lab-actions">
          {(
            [
              ['all', 'Todas'],
              ['without_role', 'Sin rol'],
              ['without_current_consumer', 'Sin consumidor actual'],
              ['broken_config', 'Configuración rota'],
              ['review', 'Piden criterio'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? 'lab-btn' : 'lab-btn lab-btn--ghost'}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </p>
      ) : null}
      {!rows ? (
        <Skeleton lines={6} />
      ) : (
        <table className="lab-table">
          <thead>
            <tr>
              <th>Pregunta</th>
              <th>Rol</th>
              <th>Consumidor actual</th>
              <th>Origen</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.id}. {item.text}
                </td>
                <td>{item.roles.join(', ') || 'Ninguno'}</td>
                <td>
                  {item.functional_consumer || item.used_in}
                  {item.does_not_modify ? ` No modifica: ${item.does_not_modify}.` : ''}
                </td>
                <td>
                  {item.origin_type ? <OriginChip origin={item.origin_type} /> : null}{' '}
                  {item.source_form ?? 'Sin fuente'}
                  {item.transformation_type
                    ? `. ${labUiLabels.transformation(item.transformation_type)}`
                    : ''}
                  {item.confidence ? `. Confianza ${item.confidence.toLowerCase()}.` : ''}
                  {item.review_needed_by_rafa === 'YES' ? ' Requiere revisión.' : ''}
                </td>
                <td>
                  {item.warning ??
                    (item.domain === 'PROPÓSITO' || item.domain === 'PURPOSE'
                      ? labUiLabels.domain(item.domain)
                      : '—')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
