'use client';

import type { ReactNode } from 'react';
import { AppIcon } from '@/components/app-icon';
import type { LabEvidenceSummary, LabQuestion } from '@/lib/lab-api';
import { domainToken, humanDimensionLabel } from '@/lib/lab-ui/domain';
import { labUiLabels } from '@/lib/lab-ui/labels';
import { formatDomainCountLine, resolveCaseCounts, type CaseQuestionCounts } from '@/lib/lab-ui/question-counts';

export function DomainChip({
  domain,
  compact,
}: {
  domain: string | null | undefined;
  compact?: boolean;
}) {
  const token = domainToken(domain);
  const label = token?.label ?? labUiLabels.domain(domain);
  return (
    <span className={`lab-dchip lab-dchip--${token?.css ?? 'plain'}`}>
      {token ? <AppIcon name={token.icon} size={14} /> : null}
      {compact ? null : label}
      {compact ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

export function SafetyChip({ triggered }: { triggered?: boolean }) {
  return (
    <span
      className={triggered ? 'lab-dchip lab-dchip--safety is-on' : 'lab-dchip lab-dchip--safety'}
      title={triggered ? 'Esta respuesta disparó una alerta.' : 'Pregunta de seguridad. Puede disparar una alerta.'}
    >
      <AppIcon name={triggered ? 'shield-alert' : 'shield'} size={14} />
      {triggered ? 'Alerta activa' : 'Seguridad'}
    </span>
  );
}

export function DimensionText({ label }: { label: string | null | undefined }) {
  if (!label) return null;
  return <span className="lab-dim">{humanDimensionLabel(label)}</span>;
}

export function LabCoverageStrip({
  evidence,
  questions,
  selected,
  onSelect,
  firedSafetyIds,
}: {
  evidence: LabEvidenceSummary;
  questions?: LabQuestion[];
  selected?: string;
  onSelect?: (key: string) => void;
  firedSafetyIds?: string[];
}) {
  const purpose = evidence.purpose.answered;
  const pick = Boolean(onSelect);
  const purposeKey = 'PROPÓSITO';
  const counts: CaseQuestionCounts = resolveCaseCounts(questions, evidence.domains);
  const fired = new Set(firedSafetyIds ?? []);

  function tile(key: string, active: boolean, body: ReactNode) {
    const className = ['lab-cov__item', active ? 'is-active' : '', pick ? 'is-btn' : '']
      .filter(Boolean)
      .join(' ');
    if (!onSelect) {
      return (
        <div key={key} className={className}>
          {body}
        </div>
      );
    }
    return (
      <button
        key={key}
        type="button"
        className={className}
        aria-pressed={active}
        onClick={() => onSelect(active && key !== 'todos' ? 'todos' : key)}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={pick ? 'lab-cov lab-cov--pick' : 'lab-cov'}>
      {pick
        ? tile(
            'todos',
            !selected || selected === 'todos',
            <span className="lab-cov__name">Todos</span>,
          )
        : null}
      {counts.domains.map((item) => {
        const token = domainToken(item.domain);
        return tile(
          item.domain,
          selected === item.domain,
          <>
            <span className="lab-cov__name">
              {token ? <AppIcon name={token.icon} size={16} /> : null}
              {labUiLabels.domain(item.domain)}
            </span>
            <span className="lab-cov__n">
              {formatDomainCountLine(
                item,
                questions?.filter((question) => question.domain === item.domain && fired.has(question.id)).length ?? 0,
              )}
            </span>
          </>,
        );
      })}
      {tile(
        purposeKey,
        selected === purposeKey || selected === 'PURPOSE' || selected === 'PROPOSITO',
        <>
          <span className="lab-cov__name">
            <AppIcon name={domainToken('PROPÓSITO')?.icon ?? 'compass'} size={16} />
            Dirección
          </span>
          <span className={purpose === 0 ? 'lab-cov__n is-empty' : 'lab-cov__n'}>
            {purpose === 0 ? 'Sin información' : `${purpose} / ${evidence.purpose.total}`}
          </span>
        </>,
      )}
    </div>
  );
}
