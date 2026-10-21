import type { Metadata } from 'next';
import { MemoryScreen } from '@/components/member/MemoryScreen';

export const metadata: Metadata = { title: 'Memoria', robots: { index: false, follow: false } };

export default function MemoriaPage() {
  return <MemoryScreen />;
}
