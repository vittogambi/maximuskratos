import { AppIcon } from '@/components/app-icon';
import { DOMAINS, PILLARS, type DomainKey, type PillarKey } from '@/lib/mk-system';

type SystemMapProps = {
  pillarScores: Record<PillarKey, number | null>;
  domainScores: Record<DomainKey, number | null>;
};

/**
 * Relación pilares ↔ ámbitos con los datos reales del usuario: una tarjeta por
 * ámbito con su score y, debajo, el aporte (score) de cada uno de los tres pilares.
 * La misma composición sirve para desktop (grid) y mobile (bloques apilados).
 */
export function SystemMap({ pillarScores, domainScores }: SystemMapProps) {
  return (
    <div className="sys-map">
      {DOMAINS.map((domain) => {
        const score = domainScores[domain.key];
        return (
          <div key={domain.key} className="sys-map-card">
            <div className="sys-map-card__head">
              <div className="sys-map-card__title">
                <AppIcon name={domain.icon} size={18} />
                <span className="sys-map-card__label">{domain.label}</span>
              </div>
              <span className="sys-map-card__score">{score ?? '—'}</span>
            </div>
            <div className="sys-map-card__chips">
              {PILLARS.map((pillar) => (
                <div key={pillar.key} className="sys-map-chip">
                  <span className="sys-map-chip__pillar">
                    <AppIcon name={pillar.icon} size={13} />
                    {pillar.label}
                  </span>
                  <span className="sys-map-chip__score">{pillarScores[pillar.key] ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
