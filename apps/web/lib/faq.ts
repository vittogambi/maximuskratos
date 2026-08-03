export type PublicFaqItem = {
  id: string;
  question: string;
  answer: string;
  link?: { href: string; label: string };
};

/** JSON-LD FAQPage para páginas públicas con acordeón. */
export function faqJsonLd(items: ReadonlyArray<PublicFaqItem>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
