'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AppIcon } from '@/components/app-icon';
import { cn } from '@/lib/cn';
import {
  DOMAINS,
  INTEGRATION_EXAMPLES,
  MODEL_DISTINCTION,
  PILLARS,
  type DomainKey,
  type PillarKey,
} from '@/lib/mk-system';

type MkPillarsDomainsMatrixProps = {
  className?: string;
  /** Show the capacities vs territories framing line above the grid. */
  showDistinction?: boolean;
};

/**
 * Interactive 3×4 matrix: each pillar capacity × each life domain.
 * Desktop: full width grid with row/column highlighting on selection, and a
 * detail band below that reveals the full reading for the selected cross.
 * Mobile: domain accordion with the three pillar contributions.
 */
export function MkPillarsDomainsMatrix({
  className,
  showDistinction = true,
}: MkPillarsDomainsMatrixProps) {
  const baseId = useId();
  const reduceMotion = useReducedMotion();
  const [activeDomain, setActiveDomain] = useState<DomainKey>('mentalidad');
  const [activePillar, setActivePillar] = useState<PillarKey>('espiritu');
  const [openMobileDomain, setOpenMobileDomain] = useState<DomainKey | null>('mentalidad');
  const cellRefs = useRef(new Map<string, HTMLButtonElement>());

  const activeContribution =
    INTEGRATION_EXAMPLES.find((item) => item.domain === activeDomain)?.contributions[activePillar] ??
    '';
  const activeDomainMeta = DOMAINS.find((d) => d.key === activeDomain);
  const activePillarMeta = PILLARS.find((p) => p.key === activePillar);

  function selectCell(domain: DomainKey, pillar: PillarKey) {
    setActiveDomain(domain);
    setActivePillar(pillar);
  }

  function handleCellKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    domainIndex: number,
    pillarIndex: number,
  ) {
    let nextDomainIndex = domainIndex;
    let nextPillarIndex = pillarIndex;
    switch (event.key) {
      case 'ArrowRight':
        nextDomainIndex = Math.min(domainIndex + 1, DOMAINS.length - 1);
        break;
      case 'ArrowLeft':
        nextDomainIndex = Math.max(domainIndex - 1, 0);
        break;
      case 'ArrowDown':
        nextPillarIndex = Math.min(pillarIndex + 1, PILLARS.length - 1);
        break;
      case 'ArrowUp':
        nextPillarIndex = Math.max(pillarIndex - 1, 0);
        break;
      default:
        return;
    }
    event.preventDefault();
    const nextDomain = DOMAINS[nextDomainIndex].key;
    const nextPillar = PILLARS[nextPillarIndex].key;
    selectCell(nextDomain, nextPillar);
    cellRefs.current.get(`${nextDomain}:${nextPillar}`)?.focus();
  }

  return (
    <div className={cn('ag-mk-matrix', className)}>
      {showDistinction ? (
        <p className="ag-mk-matrix__distinction font-body-md">{MODEL_DISTINCTION}</p>
      ) : null}

      <div className="ag-mk-matrix__stage">
        <span className="ag-panel__corner ag-panel__corner--tl" aria-hidden />
        <span className="ag-panel__corner ag-panel__corner--br" aria-hidden />
        <div className="ag-mk-matrix__ambient" aria-hidden />

        <div
          className="ag-mk-matrix__desktop"
          role="grid"
          aria-label="Matriz de relación entre pilares y ámbitos"
        >
          <div className="ag-mk-matrix__corner" role="columnheader">
            <AppIcon name="crosshair" size={16} className="ag-mk-matrix__corner-icon" />
          </div>

          {DOMAINS.map((domain) => (
            <div
              key={`head-${domain.key}`}
              role="columnheader"
              className={cn(
                'ag-mk-matrix__domain-head',
                activeDomain === domain.key && 'is-active',
              )}
            >
              <span className="ag-mk-matrix__domain-icon">
                <AppIcon name={domain.icon} size={15} aria-hidden />
              </span>
              <span className="ag-mk-matrix__domain-label">{domain.label}</span>
            </div>
          ))}

          {PILLARS.flatMap((pillar, pillarIndex) => [
            <div
              key={`row-${pillar.key}`}
              role="rowheader"
              className={cn(
                'ag-mk-matrix__pillar-head',
                activePillar === pillar.key && 'is-active',
              )}
            >
              <span className="ag-mk-matrix__pillar-icon">
                <AppIcon name={pillar.icon} size={15} aria-hidden />
              </span>
              <div className="ag-mk-matrix__pillar-copy">
                <span className="ag-mk-matrix__pillar-label">{pillar.label}</span>
                <span className="ag-mk-matrix__pillar-verb">{pillar.verb}</span>
              </div>
            </div>,
            ...DOMAINS.map((domain, domainIndex) => {
              const isRow = activePillar === pillar.key;
              const isCol = activeDomain === domain.key;
              const isActive = isRow && isCol;
              const cellKey = `${domain.key}:${pillar.key}`;
              const text =
                INTEGRATION_EXAMPLES.find((item) => item.domain === domain.key)?.contributions[
                  pillar.key
                ] ?? '';
              return (
                <button
                  key={cellKey}
                  ref={(node) => {
                    if (node) cellRefs.current.set(cellKey, node);
                    else cellRefs.current.delete(cellKey);
                  }}
                  type="button"
                  role="gridcell"
                  aria-selected={isActive}
                  aria-controls={`${baseId}-detail`}
                  tabIndex={isActive ? 0 : -1}
                  className={cn(
                    'ag-mk-matrix__cell',
                    isRow && 'is-row',
                    isCol && 'is-col',
                    isActive && 'is-active',
                  )}
                  onClick={() => selectCell(domain.key, pillar.key)}
                  onKeyDown={(event) => handleCellKeyDown(event, domainIndex, pillarIndex)}
                >
                  <span className="ag-mk-matrix__cell-text">{text}</span>
                </button>
              );
            }),
          ])}
        </div>

        <div id={`${baseId}-detail`} className="ag-mk-matrix__detail" aria-live="polite">
          <AnimatePresence mode="wait">
            {activePillarMeta && activeDomainMeta ? (
              <motion.div
                key={`${activePillar}:${activeDomain}`}
                className="ag-mk-matrix__detail-inner"
                initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <div className="ag-mk-matrix__detail-badges">
                  <span className="ag-mk-matrix__detail-badge ag-mk-matrix__detail-badge--pillar">
                    <AppIcon name={activePillarMeta.icon} size={14} aria-hidden />
                    {activePillarMeta.label}
                  </span>
                  <span className="ag-mk-matrix__detail-join" aria-hidden>
                    en
                  </span>
                  <span className="ag-mk-matrix__detail-badge ag-mk-matrix__detail-badge--domain">
                    <AppIcon name={activeDomainMeta.icon} size={14} aria-hidden />
                    {activeDomainMeta.label}
                  </span>
                </div>

                <div className="ag-mk-matrix__detail-body-row">
                  <p className="ag-mk-matrix__detail-body font-body-lg">{activeContribution}</p>
                  <p className="ag-mk-matrix__detail-note font-body-sm">
                    {activeDomainMeta.distinction}
                  </p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="ag-mk-matrix__mobile" role="list">
          {DOMAINS.map((domain) => {
            const open = openMobileDomain === domain.key;
            const panelId = `${baseId}-panel-${domain.key}`;
            const example = INTEGRATION_EXAMPLES.find((item) => item.domain === domain.key);
            return (
              <div key={domain.key} className="ag-mk-matrix__acc" role="listitem">
                <button
                  type="button"
                  className={cn('ag-mk-matrix__acc-trigger', open && 'is-open')}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenMobileDomain(open ? null : domain.key)}
                >
                  <span className="ag-mk-matrix__acc-title">
                    <span className="ag-mk-matrix__domain-icon">
                      <AppIcon name={domain.icon} size={15} aria-hidden />
                    </span>
                    <span className="ag-mk-matrix__acc-title-copy">
                      {domain.label}
                      <span className="ag-mk-matrix__acc-q">{domain.question}</span>
                    </span>
                  </span>
                  <AppIcon name="chevron-down" size={16} className="ag-mk-matrix__acc-chevron" />
                </button>
                <div
                  id={panelId}
                  className={cn('ag-mk-matrix__acc-panel', open && 'is-open')}
                  hidden={!open}
                >
                  <p className="ag-mk-matrix__acc-distinction font-body-sm">{domain.distinction}</p>
                  <ul className="ag-mk-matrix__acc-list">
                    {PILLARS.map((pillar) => (
                      <li key={pillar.key} className="ag-mk-matrix__acc-item">
                        <span className="ag-mk-matrix__acc-pillar">
                          <span className="ag-mk-matrix__acc-pillar-name">
                            <AppIcon name={pillar.icon} size={12} aria-hidden />
                            {pillar.label}
                          </span>
                          <em>{pillar.verb}</em>
                        </span>
                        <p className="font-body-md">{example?.contributions[pillar.key]}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
