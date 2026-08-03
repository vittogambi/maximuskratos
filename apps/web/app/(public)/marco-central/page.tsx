import { MarcoCentralContent } from '@/components/pages/marco-central-content';
import { LANDING_IMAGES } from '@/lib/assets';
import { faqJsonLd } from '@/lib/faq';
import { MARCO_CENTRAL_FAQ_ITEMS } from '@/lib/marco-central-faq';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/schema';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Marco Central',
  description:
    'Los nueve componentes del proceso de auditoría y autodescubrimiento de Maximus Kratos, y el marco filosófico que los sostiene: arquetipo, sombra y Hoja de Ruta de Propósito.',
  path: '/marco-central',
  image: LANDING_IMAGES.bgMarcoCentral,
});

export default function MarcoCentralPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            faqJsonLd(MARCO_CENTRAL_FAQ_ITEMS),
            breadcrumbJsonLd([
              { name: 'Inicio', path: '/' },
              { name: 'Marco Central', path: '/marco-central' },
            ]),
          ),
        }}
      />
      <MarcoCentralContent />
    </>
  );
}
