'use client';

import type { AuditCloseDto } from '@/lib/api';
import { AppIcon } from '@/components/app-icon';
import { moduleIntroIcon } from './module-intro-icon';

type Props = {
  close: AuditCloseDto;
};

export function AuditCloseScreen({ close }: Props) {
  return (
    <div className="dk-audit-close">
      {close.incompleteNote ? (
        <p className="dk-audit-close__total">{close.incompleteNote}</p>
      ) : null}
      {close.diagnostic ? (
        <h1 className="dk-audit-close__headline">{close.diagnostic}</h1>
      ) : null}
      {close.total != null ? (
        <p className="dk-audit-close__total">
          Suma {close.total} de {close.totalMax}
        </p>
      ) : null}
      <ul className="dk-audit-close__sections">
        {close.sections.map((section) => {
          const icon = moduleIntroIcon(section.slug, null);
          return (
            <li key={section.slug} className="dk-audit-close__section">
              {icon ? <AppIcon name={icon} size={20} aria-hidden /> : <span aria-hidden />}
              <p className="dk-audit-close__section-title">
                {section.titleEs}: {section.sum} de {section.max}
              </p>
              <p className="dk-audit-close__section-mark">{section.markLabel}</p>
            </li>
          );
        })}
      </ul>
      <p className="dk-audit-close__total">{close.senseNote}</p>
    </div>
  );
}
