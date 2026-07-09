'use client';

import { ScrollReveal } from '@/components/motion/scroll-reveal';
import type { LegalDocument } from '@/lib/legal-content';

type LegalDocumentContentProps = {
  document: LegalDocument;
};

export function LegalDocumentContent({ document }: LegalDocumentContentProps) {
  return (
    <div className="ag-landing ag-page ag-legal-page flex min-h-full flex-col antialiased">
      <section className="ag-legal-page__hero">
        <div className="ag-container ag-legal-page__hero-inner">
          <ScrollReveal distance={16}>
            <p className="hud-text text-action-red">{document.eyebrow}</p>
            <h1 className="ag-legal-page__title ag-type-display text-white">
              {document.title}
            </h1>
            <p className="ag-legal-page__meta font-body-md">
              Última actualización: {document.lastUpdated}
            </p>
            <p className="ag-legal-page__intro font-body-lg">{document.intro}</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-legal-page__body">
        <div className="ag-container ag-legal-page__layout">
          <nav className="ag-legal-page__toc" aria-label="Índice del documento">
            <p className="hud-text ag-legal-page__toc-label ag-legal-page__toc-label--desktop">
              Contenido
            </p>
            <details className="ag-legal-page__toc-panel">
              <summary className="ag-legal-page__toc-summary">
                <span className="hud-text ag-legal-page__toc-label">Contenido</span>
                <span className="ag-legal-page__toc-summary-meta font-body-md">
                  {document.sections.length} secciones
                </span>
              </summary>
              <ol className="ag-legal-page__toc-list">
                {document.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="ag-legal-page__toc-link">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </details>
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
