import { IkigaiContent } from '@/components/pages/ikigai-content';
import { LANDING_IMAGES } from '@/lib/assets';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/schema';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'IKIGAI',
  description:
    'Empieza por ordenar las piezas. Explora lo que te mueve, lo que puedes aportar, lo que te importa y lo que puede sostenerte. Versión en revisión.',
  path: '/ikigai',
  image: LANDING_IMAGES.ikigaiHero,
});

export default function IkigaiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            breadcrumbJsonLd([
              { name: 'Inicio', path: '/' },
              { name: 'IKIGAI', path: '/ikigai' },
            ]),
          ),
        }}
      />
      <IkigaiContent />
    </>
  );
}
