'use client';

import Link from 'next/link';
import type { EvidenceSection } from '@/lib/journey-api';
import { EVIDENCE_ITEM_LABEL, evidenceAccess } from '@/lib/direction-ui';

function Section({ section }: { section: EvidenceSection }) {
  const access = evidenceAccess(section);
  const count = section.answered === 0
    ? 'Sin respuestas'
    : `${section.answered} de ${section.total} ${section.id === 'ikigai' ? 'campos con actividades' : 'respondidas'}`;
  return (
    <details className="mk-dir-ev" id={`respuestas-${section.id}`}>
      <summary className="mk-dir-ev__summary">
        <span className="mk-dir-ev__title">{section.title}</span>
        <span className="mk-dir-ev__count">{count}</span>
      </summary>
      {section.answered > 0 ? (
        <ul className="mk-dir-ev__list">
          {section.groups.map((group) => (
            <li key={group.id} className="mk-dir-ev__group">
              <p className="mk-dir-ev__question">{group.title}</p>
              {group.question ? <p className="mk-dir-ev__hint">{group.question}</p> : null}
              {group.items.map((item, index) => (item.status === 'ANSWERED' ? (
                <p key={index} className="mk-dir-ev__answer">{item.texts.join(', ')}</p>
              ) : (
                <p key={index} className="mk-dir-ev__missing">{EVIDENCE_ITEM_LABEL[item.status]}</p>
              )))}
            </li>
          ))}
        </ul>
      ) : null}
      {access ? (
        <p className="mk-dir-ev__access">
          {access.text}{' '}
          {access.action && section.href ? <Link href={section.href} className="mk-mx__textlink">{access.action}</Link> : null}
        </p>
      ) : null}
    </details>
  );
}

/** The person's own answers, literal. No reading or score is shown here. */
export function PurposeEvidence({ sections }: { sections: EvidenceSection[] }) {
  return (
    <div className="mk-dir-ev-list">
      {sections.map((section) => <Section key={section.id} section={section} />)}
    </div>
  );
}
