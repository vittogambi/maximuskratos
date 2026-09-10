import { IkigaiContent } from '@/components/pages/ikigai-content';
import { LANDING_IMAGES } from '@/lib/assets';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/schema';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'IKIGAI',
  description:
    'Ordena material personal, conecta lo que te importa, formula una dirección y contrástala. Versión en revisión.',
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
