import type { Metadata } from 'next';
import { AethelgardLanding } from '@/components/landing/aethelgard-landing';
import { landingFaqJsonLd } from '@/lib/landing-faq';

export const metadata: Metadata = {
  title: 'Maximus Kratos — Sistema Operativo para la Vida',
  description:
    'Diseña tu arquitectura de vida con precisión. Un sistema de diagnóstico, plano estratégico y ejecución diaria para hombres que exigen soberanía real sobre su destino.',
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingFaqJsonLd()) }}
      />
      <AethelgardLanding />
    </>
  );
}
