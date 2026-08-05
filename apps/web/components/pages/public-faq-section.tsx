'use client';

import { useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ScrollStaggerContainer, StaggerItem } from '@/components/motion/stagger';
import { MOTION_DISTANCE, MOTION_STAGGER } from '@/components/motion/tokens';
import { FaqAccordionItem } from '@/components/pages/faq-accordion-item';
import { SectionIntro } from '@/components/pages/section-intro';
import type { PublicFaqItem } from '@/lib/faq';

type PublicFaqSectionProps = {
  eyebrow?: string;
  title: string;
  lead?: string;
  items: ReadonlyArray<PublicFaqItem>;
  /** Prefijo único para ids del acordeón (evita choques entre páginas). */
  idPrefix: string;
  headingId?: string;
};

/** Bloque FAQ compartido para subpáginas públicas (Manifiesto, Marco, Producto). */
export function PublicFaqSection({
  eyebrow = 'PREGUNTAS FRECUENTES',
  title,
  lead,
  items,
  idPrefix,
  headingId = `${idPrefix}-faq-heading`,
}: PublicFaqSectionProps) {
  const reduced = useReducedMotion();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <section className="ag-faq-section ag-section-inner" aria-labelledby={headingId}>
      <div className="ag-container ag-container--narrow">
        <SectionIntro eyebrow={eyebrow} title={title} lead={lead} headingId={headingId} />
        <ScrollStaggerContainer
          className="ag-faq-list"
          stagger={MOTION_STAGGER.base}
          itemCount={items.length}
        >
          {items.map((item, index) => (
            <StaggerItem key={item.id} distance={MOTION_DISTANCE.sm}>
              <FaqAccordionItem
                id={`${idPrefix}-${item.id}`}
                question={item.question}
                answer={item.answer}
                link={item.link}
                isOpen={openFaqIndex === index}
                reduced={reduced ?? false}
                onToggle={() =>
                  setOpenFaqIndex((current) => (current === index ? null : index))
                }
              />
            </StaggerItem>
          ))}
        </ScrollStaggerContainer>
      </div>
    </section>
  );
}
