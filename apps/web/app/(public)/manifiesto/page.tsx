import type { Metadata } from 'next';
import { ManifiestoContent } from '@/components/pages/manifiesto-content';
import { faqJsonLd } from '@/lib/faq';
import { MANIFIESTO_FAQ_ITEMS } from '@/lib/manifiesto-faq';

export const metadata: Metadata = {
  title: 'Manifiesto',
  description:
    'El manifiesto de Maximus Kratos: el nombre, el fundamento clásico, las creencias y la decisión de construir un sistema integral de transformación masculina.',
};

export default function ManifiestoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(MANIFIESTO_FAQ_ITEMS)) }}
      />
      <ManifiestoContent />
    </>
  );
}
