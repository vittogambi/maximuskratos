import { AppIcon } from '@/components/app-icon';
import { LANDING_DOMAINS_SECTION } from '@/lib/landing-copy';
import { cn } from '@/lib/cn';

type MkDomainsBridgeProps = {
  className?: string;
};

/** Compact equal-weight bridge: internal pillars → life domains (chip panels). */
export function MkDomainsBridge({ className }: MkDomainsBridgeProps) {
  return (
    <div className={cn('ag-mk-domains-bridge', className)} aria-label="Relación entre pilares y ámbitos">
      <div className="ag-mk-domains-bridge__side">
        <p className="hud-text ag-mk-domains-bridge__label">
          {LANDING_DOMAINS_SECTION.leadInternalLabel}
        </p>
        <ul className="ag-mk-domains-bridge__items ag-mk-domains-bridge__items--pillars">
          {LANDING_DOMAINS_SECTION.leadInternalItems.map((item) => (
            <li key={item} className="ag-mk-domains-bridge__item">
              {item}
            </li>
          ))}
        </ul>
      </div>
      <span className="ag-mk-domains-bridge__arrow" aria-hidden>
        <AppIcon name="arrow-right" size={18} />
      </span>
      <div className="ag-mk-domains-bridge__side">
        <p className="hud-text ag-mk-domains-bridge__label">
          {LANDING_DOMAINS_SECTION.leadExternalLabel}
        </p>
        <ul className="ag-mk-domains-bridge__items ag-mk-domains-bridge__items--domains">
          {LANDING_DOMAINS_SECTION.leadExternalItems.map((item) => (
            <li key={item} className="ag-mk-domains-bridge__item">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
