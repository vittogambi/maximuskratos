import type { Metadata } from 'next';
import { CalendarScreen } from '@/components/journey/CalendarScreen';

export const metadata: Metadata = { title: 'Semana', robots: { index: false, follow: false } };

export default function SemanaPage() {
  return <CalendarScreen />;
}
