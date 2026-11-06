'use client';

import type { AreaSectionDto } from '@/lib/api';
import { AppIcon } from '@/components/app-icon';
import { moduleIntroIcon } from './module-intro-icon';

type Props = {
  sections: AreaSectionDto[];
};

export function AreaSectionsRail({ sections }: Props) {
  if (!sections.length) return null;
  return (
    <div className="dk-area-sections" aria-label="Avance por sección">
      {sections.map((section) => {
        const icon = moduleIntroIcon(section.slug, null);
        const ratio = section.total > 0 ? section.answered / section.total : 0;
        return (
          <div
            key={section.slug}
            className={`dk-area-sections__item${section.current ? ' dk-area-sections__item--current' : ''}`}
            title={section.titleEs}
          >
            {icon ? <AppIcon name={icon} size={16} aria-hidden /> : null}
            <span className="dk-area-sections__bar" aria-hidden>
              <span className="dk-area-sections__fill" style={{ width: `${Math.round(ratio * 100)}%` }} />
            </span>
            <span className="dk-area-sections__count">
              {section.answered}/{section.total}
            </span>
          </div>
        );
      })}
    </div>
  );
}
