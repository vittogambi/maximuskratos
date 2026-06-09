import type { Metadata } from 'next';
import { ContactoContent } from '@/components/pages/contacto-content';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contáctanos — Maximus Kratos. Inicia tu diagnóstico o solicita más información.',
};

export default function ContactoPage() {
  return <ContactoContent />;
}
