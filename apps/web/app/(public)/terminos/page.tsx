import type { Metadata } from 'next';
import { LegalDocumentContent } from '@/components/pages/legal-document-content';
import { termsOfService } from '@/lib/legal-content';
import { siteConfig } from '@/lib/design';

export const metadata: Metadata = {
  title: 'Términos de Servicio',
  description: `Términos de Servicio de ${siteConfig.name}. Condiciones de uso del sitio y la Plataforma.`,
};

export default function TerminosPage() {
  return <LegalDocumentContent document={termsOfService} />;
}
