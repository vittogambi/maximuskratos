import { AethelgardLanding } from '@/components/landing/aethelgard-landing';
import { LANDING_HOME_META_DESCRIPTION } from '@/lib/landing-copy';
import { landingFaqJsonLd } from '@/lib/landing-faq';
import { serializeJsonLd } from '@/lib/schema';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Maximus Kratos: app y plataforma web de desarrollo personal para hombres',
  description: LANDING_HOME_META_DESCRIPTION,
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
