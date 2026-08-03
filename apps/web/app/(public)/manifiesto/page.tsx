import { ManifiestoContent } from '@/components/pages/manifiesto-content';
import { faqJsonLd } from '@/lib/faq';
import { MANIFIESTO_FAQ_ITEMS } from '@/lib/manifiesto-faq';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/schema';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Manifiesto',
  description:
    'El manifiesto de Maximus Kratos: el nombre, el fundamento clásico, las creencias y la decisión de construir un sistema integral de transformación masculina.',
  path: '/manifiesto',
});

export default function ManifiestoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            faqJsonLd(MANIFIESTO_FAQ_ITEMS),
            breadcrumbJsonLd([
              { name: 'Inicio', path: '/' },
              { name: 'Manifiesto', path: '/manifiesto' },
            ]),
          ),
        }}
      />
      <ManifiestoContent />
    </>
  );
}
