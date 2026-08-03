import { PreciosContent } from '@/components/pages/precios-content';
import { faqJsonLd } from '@/lib/faq';
import { getPreciosFaqItems } from '@/lib/precios-faq';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/schema';
import { buildPageMetadata } from '@/lib/seo';

const PRECIOS_FAQ_TRIAL_DAYS = 30;

export const metadata = buildPageMetadata({
  title: 'Precios',
  description:
    'Un acceso a Maximus Kratos. Elige pagar mensual, trimestral, semestral o anual. Mismo contenido; más ahorro si pagas por adelantado.',
  path: '/precios',
});

export default function PreciosPage() {
  const faqItems = getPreciosFaqItems(PRECIOS_FAQ_TRIAL_DAYS);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            faqJsonLd(faqItems),
            breadcrumbJsonLd([
              { name: 'Inicio', path: '/' },
              { name: 'Precios', path: '/precios' },
            ]),
          ),
        }}
      />
      <PreciosContent />
    </>
  );
}
