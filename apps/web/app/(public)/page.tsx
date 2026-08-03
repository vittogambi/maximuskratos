import { AethelgardLanding } from '@/components/landing/aethelgard-landing';
import { landingFaqJsonLd } from '@/lib/landing-faq';
import { serializeJsonLd } from '@/lib/schema';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Maximus Kratos: Descúbrete. Alíneate. Construye.',
  description:
    'Sistema de reconstrucción personal para hombres. Acceso anticipado abierto: crea tu cuenta de fundador. Diagnóstico y apps próximamente.',
  path: '/',
  absoluteTitle: true,
});

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(landingFaqJsonLd()),
        }}
      />
      <AethelgardLanding />
    </>
  );
}
