import type { Metadata } from 'next';
import { ContactoContent } from '@/components/pages/contacto-content';

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Escríbenos con preguntas, feedback o consultas de empresas. Estamos construyendo Maximus Kratos y queremos escucharte.',
};

export default function ContactoPage() {
  return <ContactoContent />;
}
