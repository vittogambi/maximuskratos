'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { LabCard, Skeleton } from '@/components/admin/lab/primitives';
import { labApi, type LabDeliveryReport } from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';

export default function DeliveryPage() {
  const [data, setData] = useState<LabDeliveryReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    labApi
      .deliveryReport()
      .then(setData)
      .catch((err) => setError(humanError(err, 'No pudimos armar la entrega.').message));
  }, []);

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <Link className="lab-back" href="/admin/lab/readiness">
          Volver al estado de la Matriz
        </Link>
        <h1 className="admin-page-header__title">Entrega de metodología</h1>
        <p className="lab-lead">Este informe se arma solo con lo que ya registraste. No inventa conclusiones.</p>
        {data ? (
          <button
            type="button"
            className="lab-btn"
            onClick={() => {
              labApi
                .deliveryMarkdown()
                .then(({ markdown }) => {
                  const blob = new Blob([markdown], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'entrega-metodologia.md';
                  link.click();
                  URL.revokeObjectURL(url);
                })
                .catch((err) => setError(humanError(err, 'No pudimos descargar la entrega.').message));
            }}
          >
            Descargar como Markdown
          </button>
        ) : null}
      </header>
      {error ? <p className="lab-error">{error}</p> : null}
      {!data ? (
        <Skeleton lines={10} />
      ) : (
        <div className="lab-stack">
          {(data.sections ?? []).map((section) => (
            <LabCard key={section.title} title={section.title}>
              {section.empty ? (
                <p className="lab-muted">Nada registrado.</p>
              ) : (
                section.items.map((item, index) => (
                  <DeliveryItem key={`${section.title}-${index}`} item={item} />
                ))
              )}
            </LabCard>
          ))}
        </div>
      )}
    </div>
  );
}

function DeliveryItem({ item }: { item: unknown }) {
  const row = item as Record<string, unknown>;
  if (row.question_id) {
    return (
      <div className="lab-stack lab-stack--tight" style={{ marginBottom: '0.85rem' }}>
        <p className="lab-q__id">{String(row.question_id)}</p>
        <p>{String(row.text ?? row.question_id)}</p>
        <p className="lab-muted">Problema: {Array.isArray(row.problem) ? (row.problem as string[]).join(', ') : 'Sin propuesta escrita'}</p>
        <p className="lab-muted">Nuevo texto: {String(row.proposed ?? 'Sin propuesta escrita')}</p>
        <p className="lab-muted">Por qué: {String(row.why ?? 'Sin propuesta escrita')}</p>
        <p className="lab-muted">Casos: {String(row.cases ?? 'Sin casos')}</p>
      </div>
    );
  }
  if (row.ref) {
    return (
      <div>
        <p>{candidateTitle(String(row.ref))}</p>
        <p className="lab-q__id">{String(row.ref)}</p>
      </div>
    );
  }
  if (row.label) {
    return (
      <p className="lab-muted">
        {String(row.label)}
        {row.verdict ? `. ${String(row.verdict)}` : ''}
        {row.kind ? `. ${String(row.kind)}` : ''}
        {row.recommended ? `. Recomendación: ${String(row.recommended)}` : ''}
      </p>
    );
  }
  if (row.title) return <p className="lab-muted">{String(row.title)}</p>;
  if (row.decision) return <p className="lab-muted">{String(row.decision)}</p>;
  if (row.case_label) return <p className="lab-muted">{String(row.case_label)}</p>;
  return <p className="lab-muted">{JSON.stringify(item)}</p>;
}

function candidateTitle(ref: string) {
  const match = ref.match(/@(\d+)$/);
  return match ? `Candidata ${match[1]}` : 'Versión candidata';
}
