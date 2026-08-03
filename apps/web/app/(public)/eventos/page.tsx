import { EventosContent } from '@/components/pages/eventos-content';
import { LANDING_IMAGES } from '@/lib/assets';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/schema';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Eventos',
  description:
    'Eventos presenciales Maximus Kratos: jornadas intensivas de diagnóstico, estrategia y alineación de vida.',
  path: '/eventos',
  image: LANDING_IMAGES.eventosHero,
});

export default function EventosPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            breadcrumbJsonLd([
              { name: 'Inicio', path: '/' },
              { name: 'Eventos', path: '/eventos' },
            ]),
          ),
        }}
      />
      <EventosContent />
    </>
  );
}
