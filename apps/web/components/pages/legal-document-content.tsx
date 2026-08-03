'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import type { LegalDocument } from '@/lib/legal-content';
import { legalContact } from '@/lib/legal-content';

type LegalDocumentContentProps = {
  document: LegalDocument;
};

function LegalTocList({ document }: LegalDocumentContentProps) {
  return (
    <ol className="ag-legal-page__toc-list">
      {document.sections.map((section) => (
        <li key={section.id}>
          <a href={`#${section.id}`} className="ag-legal-page__toc-link">
            {section.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

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
            <div className="ag-legal-page__toc-panel ag-legal-page__toc-panel--desktop">
              <p className="hud-text ag-legal-page__toc-label">Contenido</p>
              <LegalTocList document={document} />
            </div>
            <details className="ag-legal-page__toc-panel ag-legal-page__toc-panel--mobile">
              <summary className="ag-legal-page__toc-summary">
                <span className="hud-text ag-legal-page__toc-label">Contenido</span>
                <span className="ag-legal-page__toc-summary-meta font-body-md">
                  {document.sections.length} secciones
                </span>
              </summary>
              <LegalTocList document={document} />
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
                {section.closingParagraphs?.map((paragraph) => (
                  <p key={paragraph} className="ag-legal-page__paragraph font-body-md">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}

            <aside className="ag-legal-page__notice" aria-label="Documentos relacionados">
              <p className="hud-text ag-legal-page__notice-label">También te puede interesar</p>
              <p className="ag-legal-page__notice-body font-body-md">
                Revisa nuestro documento relacionado y escríbenos si tienes dudas.
              </p>
              <p className="ag-legal-page__notice-links font-body-md">
                <Link
                  href={document.relatedDocument.href}
                  className="ag-legal-page__inline-link"
                >
                  {document.relatedDocument.label}
                </Link>
                <a
                  href={`mailto:${legalContact.email}`}
                  className="ag-legal-page__inline-link"
                >
                  {legalContact.email}
                </a>
              </p>
            </aside>
          </article>
        </div>
      </section>
    </div>
  );
}
