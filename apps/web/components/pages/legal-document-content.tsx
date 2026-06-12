'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import type { LegalDocument } from '@/lib/legal-content';

type LegalDocumentContentProps = {
  document: LegalDocument;
};

export function LegalDocumentContent({ document }: LegalDocumentContentProps) {
  return (
    <div className="ag-landing ag-page ag-legal-page flex min-h-full flex-col antialiased">
      <section className="ag-legal-page__hero ag-section-inner">
        <div className="ag-container">
          <ScrollReveal distance={16}>
            <p className="hud-text text-action-red">{document.eyebrow}</p>
            <h1
              className="ag-legal-page__title font-display-xl text-white"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}
            >
              {document.title}
            </h1>
            <p className="ag-legal-page__meta font-body-md">
              Última actualización: {document.lastUpdated}
            </p>
            <p className="ag-legal-page__intro font-body-lg">{document.intro}</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-legal-page__body ag-section-inner">
        <div className="ag-container ag-legal-page__layout">
          <nav className="ag-legal-page__toc" aria-label="Índice del documento">
            <p className="hud-text ag-legal-page__toc-label">Contenido</p>
            <ol className="ag-legal-page__toc-list">
              {document.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="ag-legal-page__toc-link">
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="ag-legal-page__article">
            {document.sections.map((section) => (
              <section key={section.id} id={section.id} className="ag-legal-page__section">
                <h2 className="ag-legal-page__section-title font-display-md text-white">
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="ag-legal-page__paragraph font-body-md">
                    {paragraph}
                  </p>
                ))}
                {section.list ? (
                  <ul className="ag-legal-page__list">
                    {section.list.map((item) => (
                      <li key={item} className="ag-legal-page__list-item font-body-md">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </article>
        </div>
      </section>
    </div>
  );
}
