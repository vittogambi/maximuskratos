import type { Metadata } from 'next';
import { SistemaContent } from '@/components/pages/sistema-content';
import { faqJsonLd } from '@/lib/faq';
import { SISTEMA_FAQ_ITEMS } from '@/lib/sistema-faq';

export const metadata: Metadata = {
  title: 'El Sistema',
  description:
    'Maximus Kratos: acceso anticipado abierto. Diagnóstico, Perfil Maestro, Ruta MK y apps se lanzan juntos próximamente.',
};

export default function SistemaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(SISTEMA_FAQ_ITEMS)) }}
      />
      <SistemaContent />
    </>
  );
}
